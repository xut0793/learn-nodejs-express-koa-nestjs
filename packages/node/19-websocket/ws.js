/*
 * @Date         : 2024-03-31 14:41:07 星期0
 * @Author       : xut
 * @Description  :
 */
// 开启 ws 服务端
import { WebSocketServer } from "ws"

const wss = new WebSocketServer({ port: 9000, path: "/ws" })

wss.on("connection", function connection(ws) {
  ws.on("error", console.error)

  ws.on("message", function message(data) {
    console.log("received: %s", data)
  })

  ws.send("something")
})
