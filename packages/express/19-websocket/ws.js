import { WebSocketServer } from "ws"

// webSocketServer 关闭了客户端追踪，改为自行管理
export const connectPools = new Map()

function heartbeat() {
  console.log("🚀 ~ heartbeat ~ heartbeat:")
  this.isAlive = true
}

export const wss = new WebSocketServer({
  path: "/ws",
  clientTracking: false,
  noServer: true,
})

wss.on("connection", function (ws, request) {
  ws.isAlive = true
  const userId = request.session.userId

  connectPools.set(userId, ws)

  ws.on("error", console.error)
  ws.on("pong", heartbeat)

  const interval = setInterval(function ping() {
    Array.from(connectPools.values()).forEach((client) => {
      if (client.isAlive === false) return client.terminate()

      client.isAlive = false
      client.ping()
    })
  }, 5000)

  ws.on("message", function (message) {
    // Here we can now use session parameters.
    Array.from(connectPools.values()).forEach((socket) => {
      socket.send(`Received message ${message} from user ${userId}`)
    })
  })

  ws.on("close", function () {
    connectPools.delete(userId)
    clearInterval(interval)
  })
})
