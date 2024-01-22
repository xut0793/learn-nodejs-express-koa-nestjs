/*
 * @Date         : 2024-01-06 19:36:04 星期6
 * @Author       : xut
 * @Description  : winston.config.npm.levels
  {
    error: 0, // 严重错误
    warn: 1, // 警告
    info: 2, // 信息
    http: 3, // http
    verbose: 4, // 冗长的，详细的
    debug: 5, // 调试
    silly: 6 // 临时的，随意的
  }
 */
import { resolve } from "node:path"
import { randomUUID } from "node:crypto"
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

if (NODE_ENV === "development") {
  logger.add(
    new winston.transports.Console({
      level: "debug",
    })
  )
}

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
