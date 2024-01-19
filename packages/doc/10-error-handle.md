# 异常和错误

## JS 异常及特性

### Error 定义

[NDN Error](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Error)
JS 提供了 Error 构造函数，用于定义程序异常，包括 js 内部异常和自定义的业务异常。

```js
// options = {cause: Error }
new Error([message[, options]])

```

一个错误对象包含可用的实例属性

```js
const err1 = new Error("error 1")
const err = new Error("error message", { cause: err1 })
err.name // 错误消息。对于用户创建的 Error 对象，这是构造函数的第一个参数提供的字符串。
err.message // 错误名称。这是由构造函数决定的。
err.cause // 表示导致当前错误被抛出的原因——通常是另一个错误。对于用户创建的 Error 对象，这是构造函数的第二个参数提供的值。
```

区别于一般对象，它会有一个异常的错误栈信息来描述错误。当自定义错误类型时，可以使用 Error 中一个非标准的 V8 实现静态方法，来将当前函数加入错误堆栈。

```js
// 捕获构造点的堆栈跟踪
Error.captureStackTrace(this)

// 此时可以通过实例对象的 err.stack 查看错误堆栈信息
err.stack
```

在 Error 基本上，JS 扩展了一些类型错误

- EvalError：代表了一个关于 eval() 全局函数的错误。此异常不再会被 JavaScript 抛出，但是 EvalError 对象仍然存在，以保持兼容性。
- InternalError：表示出现在 JavaScript 引擎内部的错误。通常描述某种数量过多的情况，比如递归过深，数组初始化器过大。该特性是非标准的，尚未成为任何规范的一部分，请尽量不要在生产环境中使用它！
- RangeError：表示一个特定值不在所允许的范围或者集合中的错误。比如将错误数值传入数值计算方法 `Number.toFixed()`，将不允许的字符串值传递给 `String.prototype.normalize` 等。
- ReferenceError：当一个不存在（或尚未初始化）的变量被引用时发生的错误。
- SyntaxError：当 Javascript 引擎解析代码时，遇到了不符合语法规范的标记（token）或标记顺序，则会抛出该错误。
- TypeError: 表示值的类型非预期类型时发生的错误。比如函数入参类型不兼容，修改const变量的值，尝试调用不存在的方法或属性等。
- URIError：表示以一种错误的方式使用全局 URI 处理函数而产生的错误。

在实际代码中，最常见的两种错误类型便是 ReferenceError 和 TypeError。

- ReferenceError 错误就是字面意思，引用错误。这意味着在尝试引用一个不存在当前作用域中的变量/常量时产生的错误。
- TypeError 会发生在值的类型不符合预期时。比如在对值的操作方法不存在或并未正确的定义时。

```js
let a = b // Uncaught ReferenceError: b is not defined
console.log(c) // Uncaught ReferenceError: c is not defined

let a // a = undefined
console.log(a.b) // // Uncaught TypeError: Cannot read property 'b' of undefined
console.log(a()) // // Uncaught TypeError: a is not a function
```

### 抛出错误

throw 语句用来抛出一个用户自定义的异常。当前函数的执行将被停止，throw 之后的语句将不会执行。

语法

```js
throw expression
```

抛出异常时，expression 指定了异常的内容。它可以是 JS 合法的数据类型。但常用 Error 对象抛出。

```js
throw "error"
throw 43
throw true
throw { value, message }
throw new Error("error")
```

### 捕获错误

当JS代码中发生异常情况时，程序会沿着程序的调用栈逐层向上冒泡传递异常信息。
在这个冒泡过过程中，直到错误被一个try-catch代码捕获并处理，或直至一直传递到JS引擎默认抛出。

`try...catch` 语句用来标记一段可能会产生异常的语句块，如果产生异常，可以在 catch 中进行捕获处理。catch 会入参一个 throw 语句抛出的 expression 表达式的值。

语法

```
try {
   try_statements
}
[catch (exception_var_1) {
   catch_statements_1
}]
...// 可以有多个 catch 语句块
[catch (exception_var_2) {
   catch_statements_2
}]
[finally {
   finally_statements // 无论是否有异常抛出或捕获这些语句都将执行。
}]
```

示例

```js
try {
  throw "myException" // 抛出一个错误
} catch (e) {
  console.error(e) // e = 'myException'
}
```

如果不需要处理 e ，可以缺省

```js
try {
  throw "myException"
} catch {
  // 相关逻辑
}
```

在服务器项目中，常见抛出异常

1. 业务逻辑错误
2. HTTP 错误，响应客户端错误
3. 代码语法不规范造成的JS报错异常
4. 程序运行中发生的一些未知异常

第3点和第4点会影响程序崩溃，需要尽可能在上线前避免。在 Node 中可以通过 process 对象进行事件监听。

```js
process.on("uncaughtException", (err, origin) => {
  // 这里虽然不能再处理响应，但对错误信息可以记录到项目日志中，便于分析
})

// 异步未捕获的错误
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason)
})
```

对于典型的基于 HTTP REST/GraphQL API 的应用，最佳做法是在发生某些错误情况时发送标准 HTTP 响应对象。所以主要关注是第1点和第2点，也是本节内容，主要区别在于是否需要给请求的客户端进行响应。

## express

express 中错误异常处理的机制，示意图，后面依此进行解释。

```
抛出错误       throw error                 Promise.reject                             next(error)
                  +                       +       +   +                                +
                  |                       |       |   |                                |
                  |                  express@5.x  |   +----------> try-catch---------->+
                  |                       |       |                自行捕获              |
                  |                       |    express@4.x                             |
                  |                       |       |                                    |
                  |                       |       v                                    |
                  |                       |    express-async-errors                    |
                  |                       |       +  借助依赖                            |
                  |                       |       |                                    |
                  v                       v       v                                    |
                  +-------------------------------+                                    |
                                          |                                            |
                                          v                                            |
 express/lib/router/layer.js           try-catch                                       |
 Layer.prototype.handle_request           |                                            |
 Layer.prototype.handle_error             |                                            |
                                          |                                            |
                                          v                                            |
 express/lib/router/index.js           next(err)  <------------------------------------+
                                          +
                                          |
+-----------------------------------------v-----------+
|express/lib/application.js            done(err)      |
|                                         +           |
|                                         |           |
|                                         v           |
|                                      finalhandler   |
+-----------------------------------------------------+
```

### 抛出错误

在 express 中抛出错误分为同步错误和异步错误，处理方式不同。

#### 同步错误 throw

路由处理程序抛出同步，会被 express 内部默认捕获进行处理。

比如，在路由程序中抛出同步错误

```js
app.get("/", (req, res) => {
  throw new Error("BROKEN") // Express will catch this on its own.
})
```

或者自行捕获后传入 `next(error)`

```js
app.get("/", (req, res, next) => {
  try {
    throw new Error("BROKEN") // Express will catch this on its own.
  } catch (error) {
    next(error)
  }
})
```

#### 异常错误

express 发布较早，此时 Node 中对异步错误的处理模式都是回调方式，基本上都需要业务逻辑上自行处理 error 对象。

```js
// 回调写法
app.get("/", (req, res, next) => {
  fs.readFile("/file-does-not-exist", (err, data) => {
    if (err) {
      next(err) // Pass errors to Express.
    } else {
      res.send(data)
    }
  })
})
```

但在 ES6 之后，node 支持了最新的 Promise 语法。处理程序中的异步错误不是在回调中处理，而需要用 catch 捕获后主动传入 `next(error)`，才能被 express 处理。

```js
// promise 写法
import { readFile } from "node:fs/promise"
app.get("/", (req, res, next) => {
  readFile("/file-does-not-exist").then(res.send).catch(next)
})
```

在即将发布的 Express@5 开始，直接返回 Promise 的 reject 或抛出异步错误，会和同步错误一样，默认被 express 捕获处理。

```js
// express@5.x 抛出同步错误
app.get("/", (req, res) => {
  throw new Error("BROKEN")
})

// express@5.x 抛出异步错误
app.get("/user/:id", async (req, res, next) => {
  return Promise.reject("BROKEN")
})
```

但在目前普遍使用 Express@4 时，要捕获 promise 错误，可以有以下几种方式

##### 主动捕获 try-catch / promise catch

使用 `try-catch` 或 `catch` 主动捕获错误，并传入 `next(error)`

```js
import { readFile } from "node:fs/promise"
// promise => catch
app.get("/", (req, res, next) => {
  readFile("/file-does-not-exist").then(res.send).catch(next)
})

// async-await => catch
app.get("/", async (req, res, next) => {
  const data = await readFile("/file-does-not-exist").catch(next)
  return res.send(data)
})

// async-await => try-catch
app.get("/", async (req, res, next) => {
  try {
    const data = await readFile("/file-does-not-exist")
    return res.send(data)
  } catch (err) {
    next(err)
  }
})
```

##### 自定义 tryCatch 包装函数

像上面每个路由程序都有一点模板代码，代码看起来比较繁琐，所以可以手动定义一个包装函数

```js
function tryCatch(fn) {
  return function tryCatchMiddleware(req, res, next) {
    const ret = fn.call(this, req, res, next)
    // 检查执行结果是否是一个 Promise，并对 Promise 异常进行处理。
    if (ret && ret.catch) ret.catch((err) => next(err))
    return ret
  }
}

// 使用
app.get(
  "/",
  tryCatch(async (req, res, next) => {
    const data = await readFile("/file-does-not-exist")
    return res.send(data)
  })
)
```

##### 使用 express-async-errors 包

express-async-errors 包原理同 tryCatch 函数，但是它不需要业务逻辑中手动调用包装函数，而是直接劫持改写了 express 内部源码的 Router 中 Layer 原型上的方法。

```js
// 使用
import "express-async-errors"

// 业务逻辑无任何侵入代码
app.get("/", async (req, res, next) => {
  const data = await readFile("/file-does-not-exist")
  return res.send(data)
})
```

源码实现

```js
const Layer = require("express/lib/router/layer")
const Router = require("express/lib/router")

const last = (arr = []) => arr[arr.length - 1]
const noop = Function.prototype

function copyFnProps(oldFn, newFn) {
  Object.keys(oldFn).forEach((key) => {
    newFn[key] = oldFn[key]
  })
  return newFn
}

function wrap(fn) {
  const newFn = function newFn(...args) {
    const ret = fn.apply(this, args)
    const next = (args.length === 5 ? args[2] : last(args)) || noop
    if (ret && ret.catch) ret.catch((err) => next(err))
    return ret
  }
  Object.defineProperty(newFn, "length", {
    value: fn.length,
    writable: false,
  })
  return copyFnProps(fn, newFn)
}

function patchRouterParam() {
  const originalParam = Router.prototype.constructor.param
  Router.prototype.constructor.param = function param(name, fn) {
    fn = wrap(fn)
    return originalParam.call(this, name, fn)
  }
}

Object.defineProperty(Layer.prototype, "handle", {
  enumerable: true,
  get() {
    return this.__handle
  },
  set(fn) {
    fn = wrap(fn)
    this.__handle = fn
  },
})

patchRouterParam()
```

> 补充 next 行为
> express 注册的中间件函数都是串行的，根据注册的先后顺序执行，执行控制权由 next 函数分配。
>
> - 不调用 `next()`，此时中间件函数需要调用 res 对象进行响应来结束请求，不然请求会被挂起。
> - `next()` 调用没有实参时，表示顺序执行下一个中间件函数
> - `next('route')`跳出当前路由中间件队列，执行下一个路由程序匹配。类似循环中的 continue 指令
> - `next('router')` 中断所有路由中间件的执行，执行最终回调函数，一般是 express 内置的错误处理程序响应 404 Not Found，或 app 直接作为中间件函数调用时传入的第三个参数cb `app(req,res,cb)`
> - `next(err)` err 表示除 route 或 router 外的任何内容 ，表示中断后续正常中间件函数，转入注册的错误中间件队列中执行。

### 捕获错误

#### 默认错误处理 finalhandler

express 路由处理程序中，如果不是主动调用 `next(err)`，那不管抛出是同步错误还是异步错误，都会在内部被 try-catch 捕获，然后调用 `next(err)`，最后通过调用 `done(err)` 由 finalhandler 处理。

比如，在路由程序中抛出同步错误

```js
app.get("/", (req, res) => {
  throw new Error("BROKEN") // Express will catch this on its own.
})
```

express 路由器源码中，通过 try-catch 捕获同步错误，然后调用 `next(err)`。

```js
// express/lib/router/layer.js
Layer.prototype.handle_request = function handle(req, res, next) {
  var fn = this.handle

  if (fn.length > 3) {
    // 实参数量大于3个，即 (err, req, res, next) => {}，透传，最终会到错误处理中间件
    return next()
  }

  try {
    fn(req, res, next)
  } catch (err) {
    // 捕获错误到 done(err) 处理，即 finalhandler 处理。
    next(err)
  }
}
```

然后中 router 的 next 函数中调用 `done(err)`

```js
// express/lib/router/index.js
// 省略了无关主题的代码

function next(err) {
  var layerError = err === "route" ? null : err

  // signal to exit router
  if (layerError === "router") {
    setImmediate(done, null)
    return
  }

  // get pathname of request
  var path = getPathname(req)

  if (path == null) {
    return done(layerError)
  }

  // find next matching layer
  var layer
  var match
  var route

  while (match !== true && idx < stack.length) {
    layer = stack[idx++]
    match = matchLayer(layer, path)
    route = layer.route

    if (typeof match !== "boolean") {
      // hold on to layerError
      layerError = layerError || match
    }

    if (match !== true) {
      continue
    }

    if (!route) {
      // process non-route handlers normally
      continue
    }

    if (layerError) {
      // routes do not match with a pending error
      match = false
      continue
    }

    var method = req.method
    var has_method = route._handles_method(method)

    // don't even bother matching route
    if (!has_method && method !== "HEAD") {
      match = false
    }
  }

  // no match
  if (match !== true) {
    return done(layerError)
  }

  // this should be done for the layer
  self.process_params(layer, paramcalled, req, res, function (err) {
    if (err) {
      next(layerError || err)
    } else if (route) {
      layer.handle_request(req, res, next)
    } else {
      trim_prefix(layer, layerError, layerPath, path)
    }

    sync = 0
  })
}
```

上述代码中的 done 函数，就是在 `const app = express(cb)` 创建应用时传入的回调，如果缺省，Express 会使用一个默认的错误处理中间件来兜底处理 finalhandler。

```js
// express.js
// const app = express()，此时即 next = undefined
var app = function (req, res, next) {
  app.handle(req, res, next)
}

/**
 * application.js
 * const fn = finalhandler(req, res, options) 作为响应HTTP请求的最后一步，返回客户端 html 格式的错误信息。
 */
var finalhandler = require("finalhandler")

app.handle = function handle(req, res, callback) {
  var router = this._router

  // final handler
  // app=express() 时，callback=undefined，即调用 finalhandler 返回值 fn，入参 error
  var done =
    callback ||
    finalhandler(req, res, {
      env: this.get("env"),
      onerror: logerror.bind(this),
    })

  // no routes
  if (!router) {
    debug("no routes defined on app")
    done()
    return
  }

  router.handle(req, res, done)
}
```

上述 done 函数即 finalhandler 函数返回值，接受一个形参：`fn(err)`, 并且始终将 error 以 HTML 形式响应给客户端。

具体逻辑为：如果形参 err 如果为假值 falsely，则响应 404。如果为真值 truly，执行以下逻辑：

1. res.statusCode 从 err 对象中深度读取err.status(或error.statusCode)。如果该值超出4xx或5xx范围，则将其设置为500。
2. res.statusMessage 根据状态码响应标准 HTTP message。
3. 如果 env 是'production'，除了正常响应错误信息的 HTML 外，还将错误信息入参调用传入的回调 onerror。
4. res.headers 尝试从 err.headers 读取响应头，但Content-Type会被重置为 `'text/html; charset=utf-8'`。
5. 最后解除 req 对象上的任何管道 `unpipe(req)` 和 `req.resume()`。

#### 自定义错误处理中间件

通过上面错误捕获的内容，总结 express 中错误的捕获方式：

- 同步错误，express 内置逻辑会捕获，并转到错误中间件处理
- 异步错误，express@4.x 版本可以借助 express-async-errors 包进行捕获，转到错误中间件处理。如果使用 express@5.x 版本和同步错误处理一致。

express 中约定错误处理的中间件函数需要四个形参，并且错误对象作为第一个形参 `fn(err, req, res, next){}`。

express 注册的中间件函数都是串行的，根据注册的先后顺序执行，执行控制权由 next 函数分配。所以注册错误中间件时，确保是在其它正常中间件之后，才会被执行到。

> 区别于 koa 错误中间件要先于其它中间件注册。

```js
// 其它一系列路由处理程序或正常处理中间件之后注册
app.use((err, req, res, next) => {
  console.error(err.stack)
  // 这里可以自行处理响应，也可以将错误对象传入 next，由 express 内部 finalhandler 程序响应
  res.status(500).send("Something broke!")
  // 或
  next(err)
})
```

#### 全局错误处理回调

express 调用时传入回调处理错误。

```js
function errHandler(req, res) {
  return handleError(err) {
    // 处理逻辑
  }
}

const app = express()

const server = http.createServer((req, res) => {
  app(req, res, errHandler(req, res))
})
```

但最佳实践是使用后置的错误中间件进行处理。

### express@5.x Router 差异

express@4.x 中 router 中 Layer 实现

```js
Layer.prototype.handle_error = function handle_error(error, req, res, next) {
  var fn = this.handle

  if (fn.length !== 4) {
    // not a standard error handler
    return next(error)
  }

  try {
    fn(error, req, res, next)
  } catch (err) {
    next(err)
  }
}

Layer.prototype.handle_request = function handle(req, res, next) {
  var fn = this.handle

  if (fn.length > 3) {
    // not a standard request handler
    return next()
  }

  try {
    fn(req, res, next)
  } catch (err) {
    next(err)
  }
}
```

express@5.x 中 router 源代码分离到一个独立仓库，依赖于 [router@v2.0.0-beta.1](https://github.com/pillarjs/router/blob/v2.0.0-beta.1/lib/layer.js)

差别在于进行了 Promise 判断，并捕获了 reject 的错误。

```js
// router/lib/layer.js
Layer.prototype.handleError = function handleError(error, req, res, next) {
  var fn = this.handle

  if (fn.length !== 4) {
    // not a standard error handler
    return next(error)
  }

  try {
    // invoke function
    var ret = fn(error, req, res, next)

    // wait for returned promise
    if (isPromise(ret)) {
      ret.then(null, function (error) {
        next(error || new Error("Rejected promise"))
      })
    }
  } catch (err) {
    next(err)
  }
}

Layer.prototype.handleRequest = function handleRequest(req, res, next) {
  var fn = this.handle

  if (fn.length > 3) {
    // not a standard request handler
    return next()
  }

  try {
    // invoke function
    var ret = fn(req, res, next)

    // wait for returned promise
    if (isPromise(ret)) {
      ret.then(null, function (error) {
        next(error || new Error("Rejected promise"))
      })
    }
  } catch (err) {
    next(err)
  }
}
```

## Koa

Koa@2.x 框架的中间件机制是支持 Promise 语法的。所以它能捕获同步错误和异步错误。

koa 框架中错误异常处理机制，示意图。

```
   ctx.throw    ctx.assert      throw error    Promise.reject     next(err) 无效
          +        +                 +              +                  x
          |        |                 |              |
          |        v                 |              |
          |    http-assert           |              |
          |        +                 |              |
          |        |                 |              |
          v        v                 |              |
          http-errors                |              |
              +                      |              |
              |                      |              |
              v                      v              v
              +----------------+-----+--------------+
                               |
                               v
compose.js                try-catch
                               +
                               |
                               v
koa/lib/application.js   handleRequest => onerror
                               +
                               |
+------------------------------v-----------------------------+
| koa/lib/context.js        onerror                          |
|                              +                             |
|                              |                             |
|                              v                             |
|                          this.app.emit('error', err, this) |
|                              +                             |
|                              |                             |
|                              v                             |
|                          headerSend -----> return          |
|                              +       true                  |
|                              | false                       |
|                              v                             |
|                          res.end(msg)                      |
+------------------------------------------------------------+
```

### 抛出错误

koa 中抛出错误几种方式：

- `ctx.throw([status], [msg], [properties])`
- `ctx.assert(value, [status], [msg], [properties])`
- `throw error`
- `Promise.reject`

> 注意区别于 express 能捕获 `next(error)`，在 koa 中使用 `next(error)` 并不会抛出错误，是正常调用下一个中间件，传入参数会被忽略。

#### ctx.throw

如果想直接响应 HTTP 错误，Koa 提供了两个便捷方式之一就是: `ctx.throw([status], [msg], [properties])`。内部是由 `http-errors` 依赖包提供支持，并且 Koa 也暴露了该包提供的 HttpError 方法用于自定义处理逻辑时匹配该错误 `err instanceof HttpError`。

使用方式：

```js
this.throw() // 默认 500
this.throw(403)
this.throw(400, "name required")
this.throw("something exploded")
this.throw(new Error("invalid"))
this.throw(400, new Error("invalid"))
```

以上任一方式中都可以在未尾再提供一对象，比如可以传入自定义响应的 header，会 content-type 会被强制覆盖为 text/plain

```
throw(400, {expose: true, headers: {'x-error-by': 'http-errors'}, custom_field: 'xxx'})
```

传入对象的属性都会附加到 error 对象上，在捕获错误时可以通过 error.custom_field 获取。

##### ctx.throw 实现源码

```js
// koa/lib/context.js

const createError = require('http-errors')
throw (...args) {
  throw createError(...args)
}

// koa/lib/application.js
const { HttpError } = require('http-errors')
module.exports.HttpError = HttpError
```

#### ctx.assert

直接响应 HTTP 错误，另一个便捷方式之一：`ctx.assert(value, [status], [msg], [properties])`，如果 value 为假值，则抛出一个 HTTP 响应错误。该错误也是 `HttpError` 实例类型。

并且该函数对象还导出了一系列辅助函数：`ok`、`fail`、`equal`、`notEqual`、`strictEqual`、`notStrictEqual`、`deepEqual`、`notDeepEqual`。这里可以从函数名看出来对应的功能，模拟了 node 中 assert 模块部分功能。其中 ok 与直接调用 assert 函数效果相同，fail 直接抛 error，三组 equal 的区别在于判断方式不同：

- equal & notEqual：使用 == 判断。
- strictEqual & notStrictEqual：使用 === 判断。
- deepEqual & notDeepEqual：调用 deep-equal 库判断，这是一个判断相等的库，可以对两个对象的内容进行递归比较。

使用方式

```js
// 除了 value 值入参外，其它参数调用方式同 ctx.throw
ctx.assert(ctx.state.user, 401, "User not found. Please login!") // 如果 user 不存在，直接响应 401 错误。
```

##### ctx.assert 实现源码

```js
// koa/lib/context.js
const httpAssert = require('http-assert')

assert: httpAssert,
```

http-assert 源码

```js
// http-assert.js
var createError = require("http-errors")
var eql = require("deep-equal")

module.exports = assert

function assert(value, status, msg, opts) {
  if (value) return
  throw createError(status, msg, opts)
}

assert.ok = function (value, status, msg, opts) {
  assert(value, status, msg, opts)
}

assert.fail = function (status, msg, opts) {
  assert(false, status, msg, opts)
}

assert.equal = function (a, b, status, msg, opts) {
  assert(a == b, status, msg, opts) // eslint-disable-line eqeqeq
}

assert.notEqual = function (a, b, status, msg, opts) {
  assert(a != b, status, msg, opts) // eslint-disable-line eqeqeq
}

assert.ok = function (value, status, msg, opts) {
  assert(value, status, msg, opts)
}

assert.strictEqual = function (a, b, status, msg, opts) {
  assert(a === b, status, msg, opts)
}

assert.notStrictEqual = function (a, b, status, msg, opts) {
  assert(a !== b, status, msg, opts)
}

assert.deepEqual = function (a, b, status, msg, opts) {
  assert(eql(a, b), status, msg, opts)
}

assert.notDeepEqual = function (a, b, status, msg, opts) {
  assert(!eql(a, b), status, msg, opts)
}
```

#### throw / reject

除了直接抛出对应的错误外，也可以直接使用 `throw` 或 Promise 的 `reject`

```js
router.get("/throw", (ctx) => {
  throw new Error("custom error")
})

router.get("/reject", async (ctx) => {
  return Promise.reject("promise reject error")
})
```

### 捕获错误

koa 捕获错误主要有两种方式：

- 自定义错误处理中间件
- 对 app 的 error 事件进行监听

#### 自定义错误中间件

koa 的中间件模型是洋葱模式，自定义错误中间件主要是在 `await next()` 之后捕获错误，所以需要注册在正常处理中间件之前。

```js
import Koa, { HttpError } from "koa"
import Router from "@koa/router"

const app = new Koa()
const router = new Router({ prefix: "/error" })

router.get("/ctx-throw", (ctx) => {
  ctx.throw("throw Http Error")
})

app.use(async (ctx, next) => {
  await next().catch((error) => {
    console.log("promise catch error >>>", error instanceof HttpError) // true
    ctx.status = error.status
    ctx.body = error.message
  })
})
```

koa 错误中间件与 express 错误中间件区别：

- 形参不同：koa 是 `(ctx, next)`，express 是 `(err, req, res, next)`
- next 作用不同，koa 的 next 纯粹是调用下一个中间件功能，会忽略入参。express 中 next 接爱一个实参，并判断参数是不是 Error 对象，决定是调用下一个中间件，还是响应错误。
- koa 基于洋葱模型的中间件机制，捕获错误中间件需要注册到其它中间件之前。express 中间件顺序执行，捕获错误中间件注册到其它中间件之后。虽然在 express 中间件使用 `async/await` 后，调用 `await next()` 的效果和 Koa 一样，但源码中对 next 函数的处理方式不同，导致错误捕获中间件的注册顺序仍是不同的。
- express 中错误中间件可以注册多个，但 koa 只会被第一个捕获。

#### 监听应用 error 事件

koa 捕获错误的另一种方式，是 koa 的应用提供了一个 error 事件供业务逻辑使用。

```js
const app = new Koa()
const router = new Router({ prefix: "/error" })

router.get("/ctx-throw", (ctx) => {
  ctx.throw("throw Http Error")
})

app.on("error", (err, ctx) => {
  console.log("promise catch error >>>", error instanceof HttpError) // true
  ctx.status = error.status
  ctx.body = error.message
})
```

koa 错误捕获，采用注册错误中间件还是采用 error 事件监听，只能使用其一，并且多次相同处理也只被第一个捕获。

koa 触发 error 事件和执行 onerror 事件源码：

```js
// koa/lib/application.js

// const app = new Koa()
// 省略无关代码
class Application extends Emitter {
  listen (...args) {
    debug('listen')
    const server = http.createServer(this.callback())
    return server.listen(...args)
  }

  callback () {
    const fn = this.compose(this.middleware)

    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res)
      return this.handleRequest(ctx, fn)
    }

    return handleRequest
  }

  handleRequest (ctx, fnMiddleware) {
    const res = ctx.res
    res.statusCode = 404
    const onerror = err => ctx.onerror(err)
    const handleResponse = () => respond(ctx)
    onFinished(res, onerror)
    return fnMiddleware(ctx).then(handleResponse).catch(onerror)
  }
}


// koa/lib/context.js
onerror (err) {
  // don't do anything if there is no error.
  // this allows you to pass `this.onerror`
  // to node-style callbacks.
  if (err == null) return

  // When dealing with cross-globals a normal `instanceof` check doesn't work properly.
  // See https://github.com/koajs/koa/issues/1466
  // We can probably remove it once jest fixes https://github.com/facebook/jest/issues/2549.
  const isNativeError =
    Object.prototype.toString.call(err) === '[object Error]' ||
    err instanceof Error
  if (!isNativeError) err = new Error(util.format('non-error thrown: %j', err))

  let headerSent = false
  if (this.headerSent || !this.writable) {
    headerSent = err.headerSent = true
  }

  // 先触发 onerror 事件
  this.app.emit('error', err, this)

  // node 中 Http 的 response.headerSent 表示请求是否已响应，布尔值
  if (headerSent) {
    return
  }

  const { res } = this

  // first unset all headers
  /* istanbul ignore else */
  if (typeof res.getHeaderNames === 'function') {
    res.getHeaderNames().forEach(name => res.removeHeader(name))
  } else {
    res._headers = {} // Node < 7.7
  }

  // then set those specified
  this.set(err.headers)

  // force text/plain
  this.type = 'text'

  let statusCode = err.status || err.statusCode

  // ENOENT support
  if (err.code === 'ENOENT') statusCode = 404

  // default to 500
  if (typeof statusCode !== 'number' || !statuses[statusCode]) statusCode = 500

  // respond
  const code = statuses[statusCode]
  const msg = err.expose ? err.message : code
  this.status = err.status = statusCode
  this.length = Buffer.byteLength(msg)
  res.end(msg)
}
```

## nestjs

koa 中基于 http-errors 响应 HTTP 异常。而 Nestjs 中内建了一个基于 Error 的 HTTP 异常类 HttpException 供业务逻辑使用。并且同 http-errors 一样，将常见的 HTTP 异常包装成基于 HttpException 的子类，可直接使用。

```
                             +--------+
                             | Error  |
                             +----^---+
                                  |
                                  | 继承
                          +-------+-------+
                          | HttpException |
                          +--^--------^---+
                             |        |
                             |  继承   |
+----------------------------+--+  +--+----------------------+
| 内置 HTTP 异常                  |  |             自定义业务异常 |
|                               |  |                         |
|      +---------------------+  |  | +--------------+        |
|      | BadRequestException |  |  | | 参数异常      |        |
|      +---------------------+  |  | +--------------+        |
|                               |  |                         |
|      +---------------------+  |  | ...其它业务逻辑异常        |
|      | NotFoundException   |  |  |                         |
|      +---------------------+  |  |                         |
|                               |  |                         |
|        ...其它内建异常          |  |                         |
+-------------------------------+  +-------------------------+

```

nestjs 内建的 HTTP 错误的子类，继承自 HttpException 的标准异常，代表了许多最常见的 HTTP 异常。

```
BadRequestException               无效请求                   400
UnauthorizedException             未授权                     401
ForbiddenException                禁止访问指定资源             403
NotFoundException                 未找到资源                  404
MethodNotAllowedException         accept 头中不可接受的请求方式 405
NotAcceptableException accept     头中未在列的响应内容          406
RequestTimeoutException           请求超时                    408
ConflictException                 冲突异常                    409
GoneException                     请求资源不再可用             410
PreconditionFailedException       请求头中给定的前提条件false   412
PayloadTooLargeException          提交请求的载荷（数据）过大     413
UnsupportedMediaTypeException     不支持的媒体类型             415
ImATeapotException                Teapot                    418
UnprocessableEntityException      无法处理的实体               422
HttpVersionNotSupportedException  HTTP版本不支持              505
InternalServerErrorException      内部服务器错误（一般错误）     500
NotImplementedException           不支持的功能                 501
BadGatewayException               上游服务的异常导致            502
ServiceUnavailableException       服务不可用                   503
GatewayTimeoutException           网关相应超时                 504

```

随意查看一个内建的异常源代码：

```ts
export class UnauthorizedException extends HttpException {
  constructor(
    objectOrError?: string | object | any,
    description = "Unauthorized"
  ) {
    super(
      HttpException.createBody(
        objectOrError,
        description,
        HttpStatus.UNAUTHORIZED
      ),
      HttpStatus.UNAUTHORIZED
    )
  }
}
```

入参一个错误对象和描述信息，通过父类 HttpException 提供的静态方法 createBody 构建错误详情，得到某一个具体的子类型异常对象。

另外，nestjs 也提供了一个 HTTP 标准状态码的检举 HttpStatus。

HttpException 源代码，省略一些不紧要的代码。

```ts
export class HttpException extends Error {
  constructor(
    private readonly response: string | Record<string, any>,
    private readonly status: number,
    private readonly options?: HttpExceptionOptions
  ) {
    super()
    this.initMessage()
    this.initName()
    this.initCause()
  }

  public cause: unknown

  public initCause(): void {
    if (this.options?.cause) {
      this.cause = this.options.cause
      return
    }
  }

  public initName(): void {
    this.name = this.constructor.name
  }

  public initMessage() {
    if (isString(this.response)) {
      this.message = this.response
    } else if (
      isObject(this.response) &&
      isString((this.response as Record<string, any>).message)
    ) {
      this.message = (this.response as Record<string, any>).message
    } else if (this.constructor) {
      this.message =
        this.constructor.name.match(/[A-Z][a-z]+|[0-9]+/g)?.join(" ") ?? "Error"
    }
  }

  public static createBody<Body extends Record<string, unknown>>(
    arg0: null | HttpExceptionBodyMessage | Body,
    arg1?: HttpExceptionBodyMessage | string,
    statusCode?: number
  ): HttpExceptionBody | Body {
    if (!arg0) {
      return {
        message: arg1,
        statusCode: statusCode,
      }
    }

    if (isString(arg0) || Array.isArray(arg0)) {
      return {
        message: arg0,
        error: arg1 as string,
        statusCode: statusCode,
      }
    }

    return arg0
  }
}
```

可以看出，createBody 的第一个参数可以是一个含有 message 属性的对象，也可以是字符串。

- 如果是字符串，输出的 message 字段就是 arg0，error 字段对应 arg1，并带有 statusCode
- 如果是对象，HttpException 从对象上读取 message 属性输出为错误描述消息，其它由开发者决定输出的信息内容；

### 抛出错误

直接抛出错误，默认响应 500

```js
throw new Error('unknown error');

// 响应结果
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

如果想抛出指定的 HTTP 错误，可以直接使用内建的异常类进行实例化后抛出。

```js
throw new HttpException("没有文章的操作权限", HttpStatus.UNAUTHORIZED)
throw new UnauthorizedException("没有文章的操作权限")

// 响应结果
{
  "statusCode": 401,
  "message": "没有删除文章的操作权限",
}
```

如果想抛出更多的错误信息，可以利用 createBody 构建一个对象传入。

```js
const errorBody = HttpException.createBody({
  message: "没有删除文章的操作权限",
  operation: "delete",
  operator: "lisa",
})
throw new HttpException(errorBody, HttpStatus.UNAUTHORIZED)
throw new UnauthorizedException(errorBody)

// 响应结果：
{
  "message": "没有删除文章的操作权限",
  "operation": "delete",
  "operator": "lisa"
}
```

### 捕获错误

Nestjs 在中间件的基础上，抽象了一个异常处理层，称为异常过滤器 ExceptionFilter，所以异常都会通过这一层处理，这样可以让开发者在这里捕获到业务逻辑异常，然后可以接管 nestjs ，自主设定响应的内容。

一个基本的异常过滤器的写法：

```js
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  // 如果有日志服务，可以在constructor,中挂载logger处理函数
  constructor(private readonly logger: Logger) {}

  // 实现 ExceptionFilter 接口必须要实现 catch 方法
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); // 获取请求上下文
    const request = ctx.getRequest(); // 获取请求上下文中的request对象
    const response = ctx.getResponse(); // 获取请求上下文中的response对象

    // 也可以一次性提取所有参数，视不同上下文类型返回不同参数，下面是 http 的参数
    // const [request, response, next] = host.getArgs()
    // 等同于
    // const request = host.getArgByIndex(0)
    // const response = host.getArgByIndex(1)
    // const next = host.getArgByIndex(2)

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR; // 获取异常状态码

    // 设置错误信息
    const message = exception.message
      ? exception.message
      : `${status >= 500 ? '服务器错误（Service Error）' : '客户端错误（Client Error）'}`;

    const nowTime = new Date().getTime();

    const errorResponse = {
      data: null,
      message,
      code: -1,
    };

    // 将异常记录到logger中
    this.logger.error(
      `【${nowTime}】${request.method} ${request.url} query:${JSON.stringify(request.query)} params:${JSON.stringify(
        request.params,
      )} body:${JSON.stringify(request.body)}`,
      JSON.stringify(errorResponse),
      'HttpExceptionFilter',
    );
    // 设置返回的状态码， 请求头，发送错误信息
    response.status(status);
    response.header('Content-Type', 'application/json; charset=utf-8');
    response.send(errorResponse);
  }
}
```

上面几个关键的参数

- `@Catch` 装饰器是用于告诉Nest，当前的类是一个异常过滤器。可以带有一个异常类型的入参，告诉 nestjs 这个特定的过滤器只处理指定的异常类型。也可以入参逗号分隔的列表来指定多个异常类型 `@Catch([UnauthorizedException, CustomException])`，也可不设参数，则所有的异常都会经此过滤器。
- `ArgumentsHost` 一个抽象的上下文对象(`http/ws/rpc`)。相关接口定义如下。

```ts
export interface ArgumentsHost {
  getArgs<T extends Array<any> = any[]>(): T
  getArgByIndex<T = any>(index: number): T
  switchToRpc(): RpcArgumentsHost
  switchToHttp(): HttpArgumentsHost
  switchToWs(): WsArgumentsHost
  getType<TContext extends string = ContextType>(): TContext
}

export type ContextType = "http" | "ws" | "rpc"
export interface HttpArgumentsHost {
  getRequest<T = any>(): T
  getResponse<T = any>(): T
  getNext<T = any>(): T
}
export interface WsArgumentsHost {
  getData<T = any>(): T
  getClient<T = any>(): T
}
export interface RpcArgumentsHost {
  getData<T = any>(): T
  getContext<T = any>(): T
}
```

过滤器定义之后，需要进行注册，按注册的位置不同，作用域也不同。

- 全局过滤器，有两种注册方式
  - `app.useGlobalFilters(new HttpExceptionFilter())` 这种方式需要手动进行实例化
  - `Provider 形式` 可以在 `app.module.ts`中注入 `providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],`，这是推荐的方式。
- `@UserFilters(HttpExceptionFilter)` 注册，可以装饰在控制器或方法上。

这里需要注意的是，如果要接管中间件抛出的异常，则必须使用全局异常过滤，控制器或者方法层面的过滤器是不对中间件起作用的。

### 轻量逻辑的过滤器

如果是某个简单的需求，比如只是记录下异常日志，并无其它复杂逻辑，异常的处理依旧由 nestjs 内部处理，可以利用 nestjs 提供的 `BaseExceptionFilter` 过滤器。

```ts
import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common"
import { BaseExceptionFilter } from "@nestjs/core"

@Catch() // 没有参数时将捕获所有类型的异常
export class AllExceptionFilter<T> extends BaseExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    console.log("some exceptions occurred")
    super.catch(exception, host)
  }
}
```

`super.catch(exception, host)` 则是将当前的控制权又还给Nest框架，执行框架内置的异常处理逻辑。

## 统一处理错误

在实现项目中，不管是 express 还是 koa 项目，不管是正常响应还是错误响应，一般都会保持固定的响应数据结构。

设计一个符合业务规范的数据返回对象

```js
{
  code: '', // 业务响应码
  msg: '', //	错误消息，正确响应时可为 null
  data: '', // 正常响应数据，或错误时响应错误堆栈信息
}
```

### 定义业务响应码

```js
/**
 *  @description 业务错误代码
 *
 * HTTP:     00000-09999，比如 00404 00500
 * 数据：     10000-10099
 * 用户及认证：10100-10199
 * 角色：     10200-10299
 * 资源（菜单、按钮）：10300-10399
 * 预期之外错误 10500-10599
 */
export class BizStatus {
  constructor(code, msg) {
    this.code = code
    this.msg = msg
  }

  static OK = new BizStatus(10000, "ok")
  static FAIL = new BizStatus(10500, "Internal Server Error")
  static PARAM_INVALID = new BizStatus(10001, "参数无效")
  static ACCESS_FORBIDDEN = new BizStatus(10002, "拒绝访问")
  static USER_EXISTING = new BizStatus(10101, "用户已存在")
  static USER_NOT_FOUND = new BizStatus(10102, "用户不存在")
  static USER_PASSWORD_INVALID = new BizStatus(10103, "密码无效")
  static USER_TOKEN_INVALID = new BizStatus(10104, "token 无效")
  static ROLE_NOT_FOUND = new BizStatus(10201, "角色不存在")
  static RESOURCE_NOT_FOUND = new BizStatus(10301, "资源不存在")
}
```

### 自定义的业务错误类

用于区分捕获的错误类型

```js
export class BizException extends Error {
  constructor(code, msg) {
    let _code = null
    if (code instanceof BizStatus) {
      _code = code.code
      msg = code.msg
    }

    super(msg)

    this.code = _code || code
    this.msg = msg
    this.data = null

    // 捕获构造点的堆栈跟踪，具体使用见 http://nodejs.cn/api/errors.html#errors_error_capturestacktrace_targetobject_constructoropt
    Error.captureStackTrace(this)
  }
}
```

还可以扩展具体的业务逻辑异常，比如

```js
export class UserNotFoundBizException extends BizException {
  constructor() {
    super(BizStatus.USER_NOT_FOUND)
  }
}
```

### node 中使用

node 中实现的路由器，在 06-router 章节并没有处理错误。所以需要完善下路由逻辑，可以处理错误中间件。

代码实现见 [lib/router.js]('../node/src/lib/router.js')

```js
import { STATUS_CODES, createServer } from "node:http"
import { createRouter } from "../src/lib/router.js"
import {
  UserNotFoundBizException,
  BizException,
} from "../src/utils/biz.exception.js"

const router = createRouter()

router.get("/error", (req, res) => {
  throw new Error("throw error")
})

router.get("/error/user", () => {
  throw new UserNotFoundBizException()
})

router.use((err, req, res, next) => {
  if (err instanceof BizException) {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify(err))
  } else {
    if (process.env.NODE_ENV !== "production") {
      console.error(err.stack || err.toString())
    }

    res.writeHead(500, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        code: err.code || 500,
        msg: err.msg || err.message || STATUS_CODES[500],
        data: null,
      })
    )
  }
})

const app = createServer(router)
app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
```

### express 中使用

```js
import { STATUS_CODES } from 'node:http'
import express from express
import {
  BizException,
  UserNotFoundBizException,
} from "./src/utils/biz.exception.js"
import 'express-async-errors'

const app = express()

app.get("/error", (req, res) => {
  throw new Error("throw error to error middleware")
})

app.get("/error/user", () => {
  throw new UserNotFoundBizException()
})

app.use((err, req, res, next) => {
  console.log("🚀 ~ app.use ~ next(err) 1:")
  next(err)
})

app.use((err, req, res, next) => {
  console.log("🚀 ~ app.use ~ response err 2:")

  if (err instanceof BizException) {
    res.type("json")
    res.status(200).send(err)
  } else {
    if (req.app.get("env") !== "production") {
      console.error(err.stack || err.toString())
    }
    res.type("json")
    res.status(500).send({
      code: err.code || 500,
      msg: err.msg || err.message || STATUS_CODES[500],
      data: null,
    })
  }
})
app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
```

### koa 中使用

```js
import { STATUS_CODES } from "node:http"
import Koa, { HttpError } from "koa"
import Router from "@koa/router"
import {
  BizException,
  UserNotFoundBizException,
} from "./src/utils/biz.exception.js"

const router = new Router({ prefix: "/error" })

router.get("/", async (ctx) => {
  throw new Error("throw error")
})

router.get("/user", async (ctx) => {
  throw new UserNotFoundBizException()
})

const app = new Koa()

app.use(router.routes()).use(router.allowedMethods())

app.on("error", (err, ctx) => {
  const res = ctx.res
  if (err instanceof BizException) {
    res.status = 200
    res.type = "json"
    res.end(JSON.stringify(err))
  } else {
    if (ctx.get("env") !== "production") {
      console.error(err.stack || err.toString())
    }
    res.status = 500
    res.type = "json"
    res.end(
      JSON.stringify({
        code: err.code || 500,
        msg: err.msg || err.message || STATUS_CODES[500],
        data: null,
      })
    )
  }
})

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
```

### nestjs 中使用

Nest的基本异常类 HttpException 扩展自Error对象，也只有 HttpException 或者继承自它的异常对象，才能被Nest识别并处理之。除了上述预设的那些 HTTP 异常类外，也可以基于 HttpException 自定义项目的业务逻辑异常。

```ts
// biz-status.enum.ts
/**
 * @description 业务错误代码
 *
 * HTTP:     00000-09999，比如 00404 00500
 * 数据：     10000-10099
 * 用户及认证：10100-10199
 * 角色：     10200-10299
 * 资源（菜单、按钮）：10300-10399
 * 预期之外错误 10500-10599
 */
export enum BizCode {
  OK = 10000,
  FAIL = 10500,
  PARAM_INVALID = 10001,
  ACCESS_FORBIDDEN = 10002,
  USER_EXISTING = 10101,
  USER_NOT_FOUND = 10102,
  USER_PASSWORD_INVALID = 10103,
  USER_TOKEN_INVALID = 10104,
  ROLE_NOT_FOUND = 10201,
  RESOURCE_NOT_FOUND = 10301,
}

export enum BizMsg {
  OK = "ok",
  FAIL = "Internal Server Error",
  PARAM_INVALID = "参数无效",
  ACCESS_FORBIDDEN = "拒绝访问",
  USER_EXISTING = "用户已存在",
  USER_NOT_FOUND = "用户不存在",
  USER_PASSWORD_INVALID = "密码无效",
  USER_TOKEN_INVALID = "token 无效",
  ROLE_NOT_FOUND = "角色不存在",
  RESOURCE_NOT_FOUND = "资源不存在",
}
```

然后自定义业务异常类

```ts
import { HttpException, HttpStatus } from "@nestjs/common"
import { BizCode, BizMsg } from "./biz-status.enum"

export class BizException extends HttpException {
  constructor(code: BizCode, message: string) {
    // 业务异常的统一响应对象
    const errorBody = HttpException.createBody({
      code,
      message,
      data: null,
    })
    super(errorBody, HttpStatus.OK)
  }
}

export class UserNotFoundBizException extends BizException {
  constructor(message?: string) {
    super(BizCode.USER_NOT_FOUND, message || BizMsg.USER_NOT_FOUND)
  }
}

// 其它 USER_EXISTING USER_PASSWORD_INVALID 类似
```

使用时可以直接抛出对应的业务异常

```ts
// user.service.ts
findOne(id: string) {
  const user = this.userModel.findOne(id)

  if (!user) {
    throw new UserNotFoundBizException()
  } else {
    return user
  }
}
```

此时可以搭配 BaseExceptionFilter 过滤器自定义一个捕获全局所有异常过滤器来记录日志。可以避免异常过滤器处理过重的逻辑。
