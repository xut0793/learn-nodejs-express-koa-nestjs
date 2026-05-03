# 日志集成

需求：

1. 日志以 json 格式写入本地文件
2. 并且 error 级别日志单独文件
3. 文件按天分割存储
4. 日志结构信息
   ```js
    {
      "server":"some_project",
      "env":"test",
      "scope":"order",
      "level": "DEBUG",
      "timestamp":"2024-01-20 16:57:30.809",
      "stage": "client-request",
      "reqId":"03babddsdscf5-d3f-8eea-26e56459b2",
      "uid":"xxxxxx",
      "cost":10,
      "res": { // 请求信息
        "ip":"9.9.9.9",
        "ua":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36",
        "method": "get",
        "path": "/api/test",
        "headers": "{}",
        "query": "{}",
        "cookies": "{}"
        "body": "{}",
      },
      "res": {}, // 响应信息
      "err": {}, // ERROR 级别日志，包含错误堆栈信息
    }
   ```
5. 开发环境提供一个简洁的输出日志记录器

## 配置全局 logger 实例

```js
// src/utils/logger
import * as winston from "winston"
import "winston-daily-rotate-file"

const NODE_ENV = process.env.NODE_ENV
const logDir = resolve(process.cwd(), "./11-log/logs")

const { combine, timestamp, json, errors } = winston.format
const errorLogFilter = winston.format((info, opts) =>
  info.level === "error" ? info : false
)

const errorFileRotateTransportOptions = {
  level: "error",
  format: combine(
    errorLogFilter(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    errors({ stack: true }),
    json()
  ),
  dirname: logDir,
  filename: "error-%DATE%.log", // %DATE% = datePattern 模式的值
  frequency: NODE_ENV === "development" ? "1m" : null, // 定时分割文件，如果为 null，则使用 datePattern 属性
  datePattern: "YYYY-MM-DD", // 默认值 YYYY-MM-DD，按天分割文件模式，以 moment.js 的时间格式表示，当 frequency 未启用时生效
  zippedArchive: false, // 默认值 false, 是否对存档的日志文件进行 gzip 压缩
  maxSize: "10M", // 默认值 null，当文件大小超过该值时，分割文件
  maxFiles: "30d", // 当日志文件超过 30 天后自动删除
}

const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), json()),
  defaultMeta: {
    service: "learn-winston",
    env: NODE_ENV,
  },
  transports: [
    new winston.transports.File({
      level: "debug",
      dirname: logDir,
      filename: "combined.log", // 默认 info
    }),
    new winston.transports.DailyRotateFile(errorFileRotateTransportOptions),
  ],

  // 记录全局异常日志
  exitOnError: true, // 默认true
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      ...errorFileRotateTransportOptions,
      filename: "exception-%DATE%.log",
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      ...errorFileRotateTransportOptions,
      filename: "rejection-%DATE%.log",
    }),
  ],
})

// 开发环境增加一个控制台输出
if (NODE_ENV === "development") {
  logger.add(
    new winston.transports.Console({
      level: "debug",
    })
  )
}

export default logger
```

## 封装中间件

在路由中间件前增加一个全局中间件，记录请求开始日志和响应结束日志。并且在每个请求中添加一个子记录器实例。

### node / express

```js
export function loggerMiddleware(req, res) {
  // 生成一个链接ID
  const reqId = randomUUID()
  const startTimestamp = Date.now()

  // 每个请求生成一个子记录器
  const childLogger = (req.logger = logger.child({
    reqId,
    uid: req.user.id,
    stage: "client-req",
    req: {
      ip: req.ip,
      ua: req.headers["user-agent"],
      method: req.method.toLowerCase(),
      path: req.url,
      headers: JSON.stringify(req.headers),
      query: JSON.stringify(req.query),
      cookies: JSON.stringify(req.cookies),
      body: req.is("json") ? JSON.stringify(req.body) : null,
    },
  }))

  childLogger.info("client-req")

  // 将链路 id 进行响应
  res.append("X-Request-Id", reqId)

  // 重写 res.json 方法，统一响应固定格式，并且打印响应日志
  const originalJson = res.json.bind(res)

  res.json = (data) => {
    const endTimestamp = Date.now()
    childLogger.info("client-res", {
      stage: "client-res",
      cost: endTimestamp - startTimestamp,
      res: {
        statusCode: res.statusCode,
        headers: JSON.stringify(res.getHeaders()),
        body: JSON.stringify(data),
      },
    })

    // 统一响应固定格式规范
    originalJson({
      code: 10000,
      msg: "success",
      data,
    })
  }

  next()
}
```

### koa

```js
export async function loggerMiddleware(ctx, next) {
  // 生成一个链接ID
  const reqId = randomUUID()
  const startTimestamp = Date.now()

  // 每个请求生成一个子记录器
  const childLogger = (ctx.logger = logger.child({
    reqId,
    uid: ctx.user?.id,
    stage: "client-req",
    req: {
      ip: ctx.ip,
      ua: ctx.request.headers["user-agent"],
      method: ctx.method.toLowerCase(),
      path: ctx.path,
      headers: JSON.stringify(ctx.headers),
      query: JSON.stringify(ctx.query),
      // cookies: JSON.stringify(ctx.cookies.get('TOKEN')), // TODO: koa 中如何获取所有请求 cookies 呢？
      body: ctx.is("json") ? JSON.stringify(ctx.request.body) : null,
    },
  }))

  childLogger.info("client-req")

  ctx.append("X-Request-Id", reqId)
  // 将链路 id 进行响应

  await next()

  const endTimestamp = Date.now()
  childLogger.info("client-res", {
    stage: "client-res",
    cost: endTimestamp - startTimestamp,
    res: {
      statusCode: ctx.status,
      headers: JSON.stringify(ctx.response.headers),
      body: ctx.type.includes("json") ? JSON.stringify(ctx.body) : null,
    },
  })
}
```

## 注册中间件

注册 logger 中间件，并且在错误中间件上输出日志。

node

```js
// src/router/index.js
import { loggerMiddleware } from "../middleware/logger.middleware.js"
router.use(loggerMiddleware)

router.use((err, req, res, next) => {
  // 错误中间件中记录错误日志
  req.logger.error(err)

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
```

express

```js
// src/index.js
import { loggerMiddleware } from "./middleware/logger.middleware.js"

const app = express()

app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(loggerMiddleware)
app.use("/user", userRouter)

app.use((err, req, res, next) => {
  // 错误中间件中记录错误日志
  req.logger.error(err)

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
```

koa

```js
// src/index.js
import { loggerMiddleware } from "./middleware/logger.middleware.js"

const app = new koa()

app
  .use(koaBody())
  .use(loggerMiddleware)
  .use(userRouter.routes())
  .use(userRouter.allowedMethods())

app.on("error", (err, ctx) => {
  ctx.logger.error(err)

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
```

## 在业务逻辑中使用

node / express

```js
// controller.js
export const userController = {
  // 省略其它
  debug(req, res) {
    req.logger.debug("user.controller debug message", {
      scope: "user.controller",
    })

    res.status(200).json({ debug: true })
  },
  error(req, res) {
    throw new Error("test logger error")
  },
}
```

koa

```js
// controller.js
export const userController = {
  // 省略其它代码

  debug(ctx) {
    ctx.logger.debug("user.controller debug message", {
      scope: "user.controller",
    })

    ctx.status = 200
    ctx.body = { debug: true }
  },
  error(ctx) {
    throw new Error("test logger error")
  },
}
```
