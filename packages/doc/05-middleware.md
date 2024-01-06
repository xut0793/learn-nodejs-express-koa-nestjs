# Middleware 中间件

中间件本质上就是一个函数。

```js
// express
app.use(cb) / app.METHOD(path, cb1, cb2, ...])

// koa
app.use(cb) / router.METHOD(path, cb1, cb2, ...)
```

其中，各个 cb 函数都可以称为是中间件函数。每个函数形式为：

```js
// express 中间件函数按形参数量分为两种，正常处理程序3个形参，特别是错误错误程序4个形参
function cb(req, res, next) {}
function errorCb(err, req, res, next) {}

// koa
function cb(ctx, next) {}
```

express 和 koa 的主要区别，就在于对一串中间件函数调用顺序的方式不同，体现在 next 参数的使用上。

### express 的 next 函数

express 注册的中间件函数都是串行的，根据注册的先后顺序执行，执行控制权由 next 函数分配。

- 不调用 next()，此时中间件函数需要调用 res 对象进行响应来结束请求，不然请求会被挂起。

- `next()` 调用没有实参时，表示顺序执行下一个中间件函数

- `next(err)` 传入错误对象，表示中断后续正常中间件函数，转入注册的错误中间件队列中执行。

- next('route') 跳出当前路由中间件队列，执行下一个路由程序匹配。类似循环中的 continue 指令

- next('router') 中断所有路由中间件的执行，执行最终回调函数，一般是 express 内置的错误处理程序响应 404 Not Found，或 app 直接作为中间件函数调用时传入的第三个参数cb `app(req,res,cb)`

代码示例 [04-router-middleware](../express/04-router-middleware/index.js)

## koa 的 next 函数

koa 的 next 函数本身就是下一个需要执行中间件的包装函数。至于注册的中间件执行的调度由 koa 的核心包 `compose.js` 来处理。

但是是 koa 中间件的执行分支就只有中断，即不再调用 next 函数。至于中断后是正常响应还是错误响应由业务逻辑控制。就不存在 express 中 next 入参不同，执行不同分支的情况，相对更为简单。

` compose.js` 的核心代码逻辑如下：

```js
function compose(middleware) {
  // 校验 middleware 是数组且数组每一项必须是函数的
  // middleware 保存着在 Koa 中注册的所有中间件
  return function (context, next) {
    let index = -1
    return dispatch(0)
    function dispatch(i) {
      if (i <= index)
        return Promise.reject(new Error("next() called multiple times"))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        // dispatch.bind(null, i + 1) 就是下一个 next
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

## express 和 koa 中间件执行顺序

koa 最初的特点是由于中间件函数的调度执行包装在 Promise 中，所以在业务逻辑中可以使用 `async / await` 处理，使得每一个中间件逻辑会 `await next()` 分割成它之前和之后的两部分来执行。社区称之为 **洋葱模型**

但是目前在 express 的函数中使用 `async / await` 处理后，执行顺序 koa 中间件的洋葱模型基本一样了。

```js
// koa
import koa from "koa"
import Router from "@koa/router"

const app = new koa()
const router = new Router({ prefix: "/next" })

router.get(
  "/index",
  async (ctx, next) => {
    console.log("cb1 before")
    await next()
    console.log("cb1 after")
  },
  async (ctx, next) => {
    console.log("cb2")
    ctx.body = "测试 next 执行"
  }
)

app.use(async (ctx, next) => {
  console.log("app use router start before")
  await next()
  console.log("app use router start after")
})

app.use(router.routes()).use(router.allowedMethods())

app.use(async (ctx, next) => {
  console.log("app use router end before")
  await next()
  console.log("app use router end after")
})

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
```

express 实现

```js
import expires, { Router } from "express"

const app = expires()
const router = Router()

router.get(
  "/index",
  async (req, res, next) => {
    console.log("cb1 before")
    await next()
    console.log("cb1 after")
  },
  async (req, res, next) => {
    console.log("cb2")
    res.send("测试 next 执行")
  }
)

app.use(async (req, res, next) => {
  console.log("app use router start before")
  await next()
  console.log("app use router start after")
})

app.use("/next", router)

app.use(async (req, res, next) => {
  console.log("app use router end before")
  await next()
  console.log("app use router end after")
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
```

上述代码，不管 express 还是 koa 的输出都是一样的，如果其中有中间件函数响应了之后，后续中间件将不再执行。所以 `app use router end` 是不会输出的。

```js
app use router start before
cb1 before
cb2
cb1 after
app use router start after
```

## nestjs 中间件

中间件就是一个函数，即是函数，那目的也是一样的，就是为了代码逻辑的抽离复用。比如需要对每个路由进行鉴权，不可能在每个路由的处理逻辑中都写一遍，那就把鉴权的那部分逻辑抽离成一个中间件函数，在每个路由的处理程序前注册个这中间件。

在实际项目中，通常会有一些通用的代码逻辑，比如

- 认证或鉴权

- 参数校验和转换

- 响应数据序列化

- 错误捕获

- 日志等等

这类通用代码逻辑，在 express 或 koa 中都作为中间件函数注入。那在 nestjs 框架中则更进一步，按使用场景，将部分中间件的叫法更具体化，比如：

- 守卫 Guard：执行一些鉴权的逻辑

- 管道 Pipe：执行一些参数校验和转换的逻辑

- 拦截器 Interceptor：分为请求拦截器和响应拦截器，执行请求或响应中额外的逻辑，比如响应数据格式统一转换等

- 异常过滤器 Filter：添加一些异常错误的处理逻辑

- 中间件 Middleware：以上未囊括的其它情形，比如日志等。

```
            +------------+        +-------+       +-------------+       +--------+       +-----------+       +------------+
  Request   |            |        |       |       |             |       |        |       |           |       |            |   Response
   +--------> Middleware +--------> Guard +-------> Request     +------->  Pipe  +------->  Handler  +-------> Response   +-------+-->
            |            |        |       |       | Interceptor |       |        |       |           |       | Interceptor|       ^
            +-----+------+        +---+---+       +-----+-------+       +---+----+       +-----+-----+       +-------+----+       |
                  |                   |                 |                   |                  |                     |            |
                  |                   |                 |                   |                  |                     |            |
                  |                   |                 |                   |                  |                 +---v----+       |
                  |                   |                 |                   |                  |                 |        |       |
                  +-------------------v-----------------v-------------------v------------------v-----------------> Filter +-------+
                                                          Exception                                              |        |
                                                                                                                 +--------+

```


