/*
 * @Date         : 2024-06-26 11:39:28 星期3
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { EventEmitter, captureRejectionSymbol } from "node:events"

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter({ captureRejections: true })

// 监听 'asyncEvent' 事件
myEmitter.on("asyncEvent", async () => {
  throw new Error("Oops! An error occurred.")
})

// myEmitter.on("error", (err) => {
//   console.error(`on error handler`, err)
// })

// 通过 `captureRejectionSymbol ` 单独捕获 rejected 错误，自行处理。
myEmitter[captureRejectionSymbol] = function (err, eventName) {
  console.error(`An error occurred in the listener for ${eventName}:`, err)
}

myEmitter.emit("asyncEvent") // 这里会产生一个未处理的Promise拒绝警告

// 创建 HTTP 服务器
const server = createServer((req, res) => {
  // 这里处理请求
  res.end("Hello World")
})

server.listen(3000, () => {
  console.log("服务器运行在 http://localhost:3000/")
})
