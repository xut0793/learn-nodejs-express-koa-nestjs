/*
 * @Date         : 2024-06-26 11:20:34 星期3
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { EventEmitter, errorMonitor } from "node:events"

// 创建一个自定义的 EventEmitter 实例
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter()

/**
 * 无论下方是 myEmitter.on('error') 还是 process.on('error') ，当前监听都会触发
 *
 * 监听 errorMonitor 上的错误，用于记录错误日志，上报监听系统等操作，但不会消费错误，不会干扰正常错误事件流程的执行
 */
myEmitter.on(errorMonitor, (err) => {
  console.error("通过 errorMonitor 监控到的错误:", err)
})

/**
 * 如果事件对象自身监听了 error 事件，那么下方 process.on('error') 不会触发
 */
myEmitter.on("error", (err) => {
  console.log("处理错误:", err)
})

/**
 * 如果 EventEmitter 自身监听了 error 事件，则当前进程上的 error 监听不会触发。
 * 可以注释上述 myEmitter.on('error‘) 时，会触发
 */
process.on("error", (err) => {
  console.log("🚀 ~ process.on error ~ args:", err instanceof Error)
})

process.on("uncaughtException", (err) => {
  console.log(
    "🚀 ~ process.on uncaughtException ~ args:",
    err instanceof Error, // throw 时 true， reject 时 false
    err
  )
})

// 模拟错误事件
myEmitter.emit("error", new Error("出错啦！"))

// // 创建 HTTP 服务器
// const server = createServer((req, res) => {
//   // 这里处理请求
//   res.end("Hello World")
// })

// server.listen(3000, () => {
//   console.log("服务器运行在 http://localhost:3000/")
// })
