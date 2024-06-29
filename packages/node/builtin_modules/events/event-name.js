/*
 * @Date         : 2024-06-25 19:59:22 星期2
 * @Author       : xut
 * @Description  : emitter.eventNames 返回的是已为其注册过监听器的事件列表
 */
import http from "node:http"

const server = http.createServer()

console.log("🚀 ~ createServer eventNames:", server.eventNames()) // [ 'connection', 'listening' ]

server.on("request", (req, res) => {
  console.log("on request url:", req.url)
  res.end("Hello World")
})

console.log("🚀 ~ request eventNames:", server.eventNames()) // [ 'connection', 'listening', 'request' ]

server.on("close", () => {
  console.log("server is closed")
})

console.log("🚀 ~ close eventNames:", server.eventNames()) // [ 'connection', 'listening', 'request', 'close' ]

server.listen(3000, () => {
  console.log("server running at http://localhost:3000/")
})

console.log("🚀 ~ listen eventNames:", server.eventNames()) // [ 'connection', 'listening', 'request', 'close' ]
