# Node Router

在 router 中最主要的事情就是将请求路径匹配正确的处理程序。

## 基本使用

主要是通过 if 条件判断匹配。

```js
import { createServer } from "node:http"
const server = createServer((req, res) => {
  const method = req.method.toLowerCase()
  const url = req.url

  if (method === "get" && url === "/favicon.ico") {
    // ...
  } else if (method === "get" && url === "/blog/list") {
    // ...
  } else {
    // *
  }
})
```

## 策略模式，映射

在事实上，这部分逻辑在理解上可以抽象为 path + method 和 controller 的一种映射关系

```javascript
GET /favicon.ico => faviconController
GET /blog/list => blogController.getBlogList
GET /blog/detail/:id => blogController.getBlogDetail
GET * => notFound404Controller
```

把这种关系形成一个对象缓存在应用各种中，然后请求过来，逐个匹配判断，如果匹配上就执行对应的处理函数，直到主动退出或兜底的 404 处理。

```javascript
// src/lib/router.js
import blogController from "../controller/blog.controller.js"

// 建立路由与控制器的映射
const routes = [
  {
    method: "GET",
    path: "/favicon.ico",
    handler: faviconController,
  },
  {
    method: "GET",
    path: "/blog/list",
    handler: blogController.getBlogList,
  },
  {
    method: "GET",
    path: "/blog/detail/:id",
    handler: blogController.getBlogDetail,
  },
]

export default function router(req, res) {
  // 解析请求路径，挂载到req上
  const url = new URL(req.url, "http://localhost:3000")
  req.path = url.pathname

  const matchedRoutes = routes.filter((r) => {
    // 因为存在 /blog/detail/:id 和 404的*路径，需要特殊处理
    let regexp = pathToRegExp(r.path)
    let routeMatched = req.path.match(regexp)

    // 添加 req.params
    if (routeMatched) {
      attachParamsToRequest(req, r.path, routeMatched)
    }

    return r.method === req.method && regexp.test(req.path)
  })

  const handlers = matchedRoutes.map((i) => i.handler)

  for (const handler of handlers) {
    const result = handler(req, res)
    if (result) return
  }

  // 404 兜底
  notFound404Controller(req, res)
}

function faviconController(req, res) {
  if (req.method === "GET" && req.path === "/favicon.ico") {
    // TODO: 读取 favicon.ico 图像文件返回
    res.writeHead(200, "OK", { "Content-Type": "text/plain" })
    res.end()
    return true
  }
}

function notFound404Controller(req, res) {
  res.writeHead(404, "NOT FOUND", {
    "Content-Type": "text/plain;charset=utf8",
  })
  res.end("404 NOT FOUND")
  return true
}

/**
 * 用于匹配以下两种情况：
 * /blog/detail/:id 应该与 /blog/detail/1 匹配
 *
 * 将path转为正则对象
 * /blog/detail/:id => /^\/blog\/detail\/([a-zA-Z0-9-\s]+)$/
 *
 * 考虑很多边界及普适情形，可以使用专门的第三库 path-to-regexp
 */
function pathToRegExp(path) {
  let patternStr = "^" + path.replace(/(\:\w+)/g, "([a-zA-Z0-9-\\s]+)") + "$"
  return new RegExp(patternStr)
}

/**
 * 另外需要将 /:id 这样的路由参数作为 req.params 的值
 * 比如：/blog/detail/:id 匹配的路径 /blog/detail/1 的参数对象 req.params = {id: 1}
 */
function attachParamsToRequest(req, routePath, routeMatched) {
  // 'blog/detail/:id'.match(/:(\w+)/g) => [':id']
  let paramsKeys = routePath.match(/:(\w+)/g) ?? []

  req.params = paramsKeys.reduce((ret, cur, index) => {
    ret[cur.slice(1)] = routeMatched[index + 1]
    return ret
  }, {})
}
```

上述抽象虽然规整了代码，但仍不是最佳，主要有几个问题:

- 需要提前手动维护一份路由映射表 routes
- 单个控制器没有路由的控制权，完全由 router 内部控制执行，并且需要将是否执行下一个用 boolean 返回。

## 回调函数注册

所以像如下进行改进:

- 针对第一点，我们希望路由映射不需要使用者手动维护，而是遵循 node 使用回调函数的方式添加

```javascript
// 解析路由参数中间件，放在最前面
router.use(resolveRequestQuery)
router.use(resolveRequestParams)
router.use(resolveRequestBody)

// 路由处理函数，居中
router.get("/blog/list", (req, res) => {
  blogController.getBlogList(req, res)
})
router.get("/blog/detail/:id", (req, res) => {
  blogController.getBlogDetail(req, res)
})

// 404 中间件兜底
router.use((req, res) => {
  notFound404Controller(req, res)
})
```

根据上述描述，实现 router 的 use 以及对应 request.method 的方法

```javascript
import { pathToRegExp } from "../utils/helper"

const METHODS = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]

export default function createRouter() {
  // 通过函数闭包，来实现存储路由映射的规则
  const routes = []

  function router(req, res) {}

  // JS 函数是一种特殊的对象，能被调用的同时，还可以拥有属性、方法
  router.use = (fn) => {
    routes.push({
      method: null,
      path: null,
      pattern: null,
      handler: fn,
    })
  }

  METHODS.forEach((item) => {
    // 实现同时注册多个处理函数，即中间件模式
    router[method] = (path, ...fns) => {
      for (const fn of fns) {
        routes.push({
          method,
          path,
          pattern: pathToRegExp(path),
          handler: fn,
        })
      }
    }
  })

  return router
}
```

这样调用后，函数内部的闭包对象 routes 的数据基本与最初自定义的 routes 映射关系一致。

现在最关键的代码是 router 函数的实现，如何调用 routes 中 handler 函数处理路由逻辑，以及如何控制路由匹配的控制器的调用顺序。

它需要做的是：

1. 从`req`对象中取得 method、pathname
2. 依据 method、pathname 将当前请求和 routes 数组内各个 route 按它们被添加的顺序依次匹配
3. 如果与某个 route 匹配成功，执行 route.handler，执行完后与下一个 route 匹配或结束流程 （后面详述）
4. 执行完其 handler 之后，是否继续下一个 route 匹配，还是结束流程，由开发者在其 handler 内，看其有没有主动调用 next() 。

```javascript
import { HOST_NAME, PORT } from "../constant/index.js"
import { pathToRegExp, attachParamsToRequest } from "../utils/helper.js"

const METHODS = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]

export default function createRouter() {
  // 通过函数闭包，来实现存储路由映射的规则
  const routes = []

  /**
   * 1. 从 req 对象中取得 method、pathname
   * 2. 依据 method、pathname 将请求与routes数组内各个 route 按它们被添加的顺序依次匹配
   * 3. 如果与某个route匹配成功，执行 route.handler，执行完后与下一个 route 匹配或结束流程 （后面详述）
   * 4. 执行完其 handler 之后，是否继续下一个 route 匹配，还是结束流程，由开发者在其 handler 内有没有主动调用 next() 交出控制权。
   */
  function router(req, res) {
    const url = new URL(req.url, `http://${HOST_NAME}:${PORT}`)
    const path = (req.path = url.pathname)
    const method = req.method.toLowerCase()

    let idx = 0

    const next = (err) => {
      if (err) return {
        res.writeHead(500)
        res.end()
        return
      }

      const route = routes[idx++]

      if (!route) {
        res.writeHead(404)
        res.end()
        return
      }

      // 对应 router.use(fn) 注册的回调，没有 method 和 path
      if (!route.method && !route.path) {
        route.handler(req, res, next)
      } else {
        const matched = path.match(route.pattern)

        if (route.method === method && matched) {
          attachParamsToRequest(req, route.path, matched)
          route.handler(req, res, next)
        } else {
          next()
        }
      }
    }

    next()
  }

  // JS 函数是一种特殊的对象，能被调用的同时，还可以拥有属性、方法。
  router.use = (fn) => {
    routes.push({
      method: null,
      path: null,
      pattern: null,
      handler: fn,
    })
  }

  METHODS.forEach((item) => {
    const method = item.toLowerCase()

    router[method] = (path, ...fns) => {
      for(const fn of fns) {
        routes.push({
          method,
          path,
          pattern: pathToRegExp(path),
          handler: fn,
        })
      }
    }
  })

  return router
}
```

## 使用 router

```javascript
// src/router/index.js
import createRouter from "../lib/router.js"

import { getBlogList, getBlogDetail } from "../controller/blog.controller.js"
import notFound404 from "../middleware/notFound404.middleware.js"
import useServiceFavicon from "../middleware/serviceFavicon.middleware.js"
import queryStringParser from "../middleware/queryStringParser.middleware.js"

const router = createRouter()

// 中间件注册的顺序决定了执行顺序
router.use(queryStringParser)

router.get("/favicon.ico", useServiceFavicon("favicon.ico"))
router.get("/blog/list", getBlogList)
router.get("/blog/detail/:id", getBlogDetail)

router.use(notFound404)

export default router
```

中间件 middleware 其时就是一种接受 req/res/next 入参的函数

```javascript
import querystring from "node:querystring"

export default function queryStringParser(req, res, next) {
  const url = new URL(req.url, `http://${HOST_NAME}:${PORT}`)
  if (search[0] === "?") {
    search = search.slice(1)
  }
  const query = querystring.parse(search) // 空字符串返回 {}
  req.query = query
  next()
}
```

## 异步 router

在实际业务中，不管是 controller 处理逻辑，还是查询数据库数据，或者解析 body 数据，都是异步执行。所以可以使用 async/await 来改造 router，实现异步逻辑

```javascript
async function router(req, res) {
  const url = new URL(req.url, `http://${HOST_NAME}:${PORT}`)
  const path = (req.path = url.pathname)
  const method = req.method.toLowerCase()

  let idx = 0

  const next = async (err) => {
    if (err) {
      res.writeHead(500)
      res.end()
      return
    }

    const route = routes[idx++]

    if (!route) {
      res.writeHead(404)
      res.end()
      return
    }

    // 对应 router.use(fn) 注册的回调，没有 method 和 path
    if (!route.method && !route.path) {
      await route.handler(req, res, next)
    } else {
      const matched = path.match(route.pattern)

      if (route.method === method && matched) {
        attachParamsToRequest(req, route.path, matched)
        await route.handler(req, res, next)
      } else {
        await next()
      }
    }
  }

  await next()
}
```
