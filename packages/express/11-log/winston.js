/*
 * @Date         : 2024-01-19 21:11:32 星期5
 * @Author       : xut
 * @Description  :
 */
import winston, { Transport } from "winston"
import { createServer } from "node:http"
import { Writable } from "node:stream"

/*********************************************
 * 默认没有传输器，虽然会输出到控制台，但同时会提示：
 * [winston] Attempt to write logs with no transports, which can increase memory usage: {"level":"debug","message":"Hello winston debug"}
 * [winston] Attempt to write logs with no transports, which can increase memory usage: {"message":"Hello winston info","level":"info"}
 ***************************************************/
// winston.log("debug", "Hello winston debug")
// winston.info("Hello winston info")

/********************************************
 * 创建 logger 实例
 *
 * level 默认 info 级别，所以 silly 和 debug 的输出会被忽略
 ***********************************************/
// const logger = winston.createLogger({
//   transports: [new winston.transports.Console()],
// })

// logger.log("debug", "logger debug")
// logger.silly("logger silly")
// logger.info("logger info")
// logger.error("logger error")

/*************************************************
 * 格式化
 * 
  CLI
  Simple
  Printf
  PadLevels
  PrettyPrint
  JSON
  Logstash
  Errors
  Splat
  Align
  Timestamp
  Colorize
  Uncolorize
  Label
  Metadata
 ***********************************************/
// const formatLogger = winston.createLogger({
//   level: "silly",
//   transports: [new winston.transports.Console()],
//   format: winston.format.combine(
//     winston.format.colorize(),
//     winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:SSS" }),
//     winston.format.align(),
//     winston.format.printf(
//       (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
//     )
//   ),
// })

// formatLogger.log("debug", "logger debug")
// formatLogger.silly("logger silly")
// formatLogger.info("logger info")
// formatLogger.error("logger error")

/*************************************************
 * 传输器
  - Console : 将日志输出到 Node.js 控制台。
  - File : 将日志消息存储到一个或多个文件中。
  - HTTP : 将日志流式传输到某个远程的 HTTP 端点处理。
  - Stream : 将日志输出到任何 Node.js 流中传输
 ***********************************************/
// // 创建可写流
// const stream = new Writable({
//   objectMode: false,
//   write: (raw) => console.log("stream msg", raw.toString()),
// })

// // 创建http服务
// const server = createServer((req, res) => {
//   const arr = []
//   req
//     .on("data", (chunk) => arr.push(chunk))
//     .on("end", () => {
//       const msg = Buffer.concat(arr).toString()
//       console.log("http msg", msg)
//       res.end(msg)
//     })
// }).listen(8080)

// // 自定义传输器
// class CustomTransport extends Transport {
//   constructor(opts) {
//     super(opts)
//   }

//   log(info, callback) {
//     console.log("custom transport msg", info)
//     callback()
//   }
// }

// // 配置 4 种通道
// const logger = winston.createLogger({
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: "combined.log" }),
//     new winston.transports.Http({ host: "localhost", port: 8080 }),
//     new winston.transports.Stream({ stream }),
//     new CustomTransport(),
//   ],
// })

// // 打印日志
// logger.info("winston transports")

/*************************************************
 * 错误堆栈的输出，需要配合 winston.format.errors 格式
 ***********************************************/
// const errorLogger = winston.createLogger({
//   transports: [new winston.transports.Console()],
//   // format: winston.format.json(), // 只会输出 {"level":"error"}
//   format: winston.format.combine(
//     // winston.format.errors(), // 如果没有配置 stack，只会输出 {"level":"error","message":"throw error"}
//     winston.format.errors({ stack: true }), // 此时会有一个 stack 字段记录错误堆栈
//     winston.format.json()
//   ),
// })

// errorLogger.error(new Error("throw error"))

/*************************************************
 * 添加元信息输出
 * - defaultMeta
 * - child logger
 * - meta data
 ***********************************************/
// const logger = winston.createLogger({
//   transports: [new winston.transports.Console()],
//   defaultMeta: {
//     service: "winston-demo",
//     engine: "node.js",
//   },
// })
// // 输出： {"level":"info","message":"log defaultMeta","service":"winston-demo", "engine":"node.js"}
// logger.info("log defaultMeta")

// const childLogger = logger.child({ reqId: "f9ed4675f1c5", uid: "lisa9375" })
// // {"level":"info","message":"child log msg",""service":"winston-demo", "engine":"node.js", reqId":"f9ed4675f1c5", "uid":"lisa9375"}
// childLogger.info("child log msg")

// // {"level":"info","message":"extra info", "service":"winston-demo", "engine":"node.js", "reqId":"f9ed4675f1c5", "uid":"lisa9375", "query":"{\"authorId\":\"lisa\"}"}
// childLogger.info("extra info", {
//   query: JSON.stringify({ authorId: "lisa" }),
// })

/*************************************************
 * 记录时长 profile
 ***********************************************/
// const logger = winston.createLogger({
//   transports: [new winston.transports.Console()],
// })

// // start a timer
// logger.profile("test")

// setTimeout(() => {
//   // 输出 {"durationMs":1006,"level":"info","message":"test"}
//   logger.profile("test")
// }, 1000)

// const profiler = logger.startTimer()

// setTimeout(() => {
//   // {"durationMs":1008,"level":"info","message":"Log startTimer"}
//   profiler.done({ message: "Log startTimer" })
// }, 1000)

/*************************************************
 * 多记录器
 ***********************************************/
winston.loggers.add("service-a", {
  defaultMeta: { service: "service-a" },
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:SSS" }),
    winston.format.align(),
    winston.format.printf(
      (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
  ),
})

winston.loggers.add("service-b", {
  defaultMeta: { service: "service-b" },
  transports: [new winston.transports.Console()],
  format: winston.format.json(),
})

const serviceALogger = winston.loggers.get("service-a")
const serviceBLogger = winston.loggers.get("service-b")

serviceALogger.error("logging a")
serviceBLogger.warn("logging b")
