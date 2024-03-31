/*
 * @Date         : 2024-03-31 21:53:57 星期0
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { WebSocketServer } from "ws"

const server = createServer((req, res) => {
  if (req.url === "/emit") {
    wss.clients.forEach((c) => {
      c.send("服务器推送的数据")
    })
    res.statusCode = 200
    res.end()
  } else {
    res.statusCode = 200
    res.end("Hello World! url:" + req.url)
  }
})

const wss = new WebSocketServer({ server, path: "/ws" })

wss.on("connection", function connection(ws) {
  ws.on("error", console.error)

  ws.on("message", function message(data) {
    console.log("received: %s", data)
  })

  ws.send("something")
})

server.listen(9000, () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
