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

export function loggerMiddleware(req, res, next) {
  const requestIdHeaderName = "X-Request-Id"
  const requestIdHeader = req.get(requestIdHeaderName)
  const reqId = requestIdHeader ? requestIdHeader : randomUUID() // 生成一个链接ID
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
  res.append(requestIdHeaderName, reqId)

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
