# Router 路由

在 express 官网中，对路由的定义是：

路由是指确定服务如何响应客户端对特定端点的请求，该端点由请求的 URI（或路径）和特定的 HTTP 请求方法（GET、POST 等）进行匹配。

> 这里的路由指服务端路由，区别于现在前端开发 spa 应用的前端路由的概念。

可以理解为：**路由就是用HTTP请求方式和url请求路径来匹配一个或一串处理逻辑。**

## node 实现路由

在 node 中，没有原生实现路由的功能。可以参照 express 中路由的使用方式，在 node 中一步一步原生实现路由的功能。

- 具体路由演变见 [node Router 实现](./04-router-node.md)

- 源代码代码见 [未尾](#node Router)。

## express 路由

express 框架内置了路由的功能，在应用对象上使用与 HTTP 方法对应的函数来定义路由。

```js
app.METHOD(PATH, HANDLER)
```

上面路由定义的结构包括：

- app 是 express 的实例 `const app = express()`

- Method 对应 HTTP 请求方式，小写形式。特殊的是**all** 方法匹配任意 HTTP 请求方式。

- PATH 定义如何匹配请求URL，可以是字符串、特定的字符串匹配模式、或正则表达式。内部通过 path-to-regexp 这个库来实现匹配。

- HANDLER 是路由匹配时执行的回调函数。可以指定一个或多个，如果是多个处理函数，按顺序串行执行，也就是中间件的定义。

代码示例

```js
// 单个处理程序
app.get("/example/a", (req, res) => {
  res.send("Hello from A!")
})

// 多个处理串程序，除最后一个外，中间的处理程序需要调用 next 函数才能将控制权传递给下一个处理程序。
app.get(
  "/example/b",
  (req, res, next) => {
    console.log("the response will be sent by the next function ...")
    next()
  },
  (req, res) => {
    res.send("Hello from B!")
  }
)

// 处理程序也可以用数组形式传入，或者数组和单个串行混合，但这种不作为最佳实践推荐
app.get("/example/c", [cb0, cb1, cb2])
app.get("/example/c", cb0, [cb1, cb2])
```

### express.Router

在项目架构中，为了更好地组织业务逻辑，将路由 router 和应用 app 的定义区分开，使用模块化方式进行组织。

在独立的文件中定义路由

```js
// user.router.js
import express from 'express'
const router = express.Router()

router.get('/login', (req, res) => {
  res.send('user login')
})

export default router

// order.router.js
import express from 'express'
const router = express.Router()

router.get('/query', (req, res) => {
  res.send('order query')
})

export default router
```

在应用文件中注册路由

```js
// app.js
import express from "express"
import userRouter from "./user.router.js"
import orderRouter from "./order.router.js"

const app = express()
app.use("/user", userRouter) // 匹配 /user/login
app.use("/order", orderRouter) // 匹配 /order/query
app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
```

express.Router 对象就是一个完整的中间件和路由系统，`app.Method(path, handlers)` 的实现也是通过 Router 实例。

## koa 路由

koa 框架追求极简，只实现了核心的 Web 服务功能，要使用路由，通过依赖包实现，可以安装官方依赖 `@koa/router`。使用方式上同 express.Router 一样了，只不过处理程序的入参是一个上下文对象 context。

```js
// user.router.js
import Router from "@koa/router"
const router = new Router({prefix: '/user'})

router.get("/login", (ctx) => {
  ctx.body = "user login"
})

export default router

// order.router.js
import Router from "@koa/router"
const router = new Router({prefix:'/order'})

router.get("/query", (ctx) => {
  ctx.body = "order query"
})

export default router
```

在应用文件中注册

```js
import koa from "koa"
import userRouter from "./user.router.js"
import orderRouter from "./order.router.js"

const app = new koa()
app.use(userRouter.routes()).use(userRouter.allowedMethods(options))
app.use(orderRouter.routes()).use(orderRouter.allowedMethods(options))
app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
/**
 * routes() 组装好所有路由 middlewares，作为中间件提供给 koa 调用。
 * allowedMethods(options)
 * options = {
 *    throw: boolean, // 直接抛出错误，而不是设置状态和头
 *    notImplemented: function, // 遇到客户端请求未实现的 HTTP 方法时，自定义响应行为，以覆盖内部默认行为。
 *    methodNotAllowed: function, // 遇到客户端请求不允许的方式时，自定义响应行为，以覆盖内部默认行为。
 * }
 */
```

其中 allowedMethods 用于附加对应组的 options 请求，响应允许的 allow 头，或405 Method Not allowed /501 Not Implemented状态。

```js
axios.options("/user") // options
axios.custom("/order") // 501 Not Implemented
```

## nestjs 路由

路由本身就是一层抽象，方便业务逻辑的组织。然后 nestjs 在特定平台之上，如 express ，通过装饰器又加了一层抽象。

在 `@Controller(prefix)` 或 `@Controller({path: prefix})` 上定义路由组的前缀名称。

然后在对应 HTTP 方法的装饰器上定义具体路由名称，如 `@Get(path)`

```js
// order.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('order')
export class CatsController {
  @Get('query')
  findAll(): string {
    // 此时这
    return 'This action returns all cats';
  }
}
```

控制器的路径前缀和请求方式中路径字符串，组合成一条路由 `Get /order/query`，并映射到 findAll 处理程序。

## node Router

简单实现 router 基本功能。

```js
import { urlToHttpOptions } from "node:url"
import { pathToRegexp } from "path-to-regexp"

const METHODS = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]

export function createRouter() {
  const routes = []
  async function router(req, res) {
    const protocol = req.socket.encrypted ? "https" : "http"
    const host = req.headers["host"]
    const baseUrl = `${protocol}:${host}`
    const url = new URL(req.url, baseUrl)
    const urlOptions = urlToHttpOptions(url)
    const pathname = urlOptions.pathname
    const method = req.method.toLowerCase()

    let idx = -1

    const next = async (err) => {
      if (err) {
        res.writeHead(500)
        res.end()
        return
      }

      const route = routes[++idx]

      if (!route) {
        res.writeHead(404)
        res.end()
      }

      // 对应 router.use(fn) 注册的回调，没有 method 和 path
      if (!route.method && !route.path) {
        await route.handler(req, res, next)
      } else {
        /**
         * TODO: 这里可优化
         * 比如 router.get('/path/:id', cb1, cb2, cb3)
         * 那在处理 cb1, cb2, cb3 的时候，不需要每个再重新执行一次路由匹配和params 参数附加了，这部分逻辑应该只执行一次。
         * 所以就是为什么 express.Router 中划分为 router 和 layer ，其中有各自的 next 实现。
         */
        const matched = route.regexp.exec(pathname)

        if (route.method === method && matched) {
          // 将 params 附加到 req 上
          const params = {}

          for (let i = 1; i < matched.length; i++) {
            const key = route.keys[i - 1]
            const prop = key.name
            const value = decodeURIComponent(matched[i])

            // /params/:id/:id 只取第一个
            if (
              value !== undefined ||
              !Object.prototype.hasOwnProperty.call(params, prop)
            ) {
              params[prop] = value
            }
          }

          req.params = params
          await route.handler(req, res, next)
        } else {
          await next()
        }
      }
    }

    await next()
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
      const keys = [] // 路由上定义的动态路由参数的 key
      const regexp = pathToRegexp(path, keys)

      for (const fn of fns) {
        routes.push({
          method,
          path,
          keys,
          regexp,
          handler: fn,
        })
      }
    }
  })

  return router
}
```
