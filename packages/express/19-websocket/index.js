/*
 * @Date         : 2024-03-31 20:23:27 星期0
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import { createServer } from "node:http"
import express from "express"
import { create } from "express-handlebars"
import session from "express-session"
import { wss, connectPools } from "./ws.js"
import { router as authRouter } from "./router/auth.router.js"

const app = express()

const sessionParser = session({
  saveUninitialized: false,
  secret: "$eCuRiTy",
  resave: false,
})

const hbs = create({
  extname: "hbs",
  defaultLayout: false,
})

app.set("views", resolve(process.cwd(), "./19-websocket/public")) // 配置视图读取的目录
app.set("view engine", "hbs") // 默认情况下，express 会根据文件名后缀读取对应的模板引擎 .pug => pug .hbs => hbs
app.engine("hbs", hbs.engine) // 默认情况下，express 会调用上面注册的 view engine 的值 hbs.__express 作为解析引擎，所以这里覆盖为自定义的 create 的值。
app.use(
  "/static",
  express.static(resolve(process.cwd(), "./19-websocket/public"))
)
app.use(sessionParser)
app.use("/api", authRouter)

app.get("/ws/emit", (req, res) => {
  if (connectPools.size === 0) {
    console.log("暂无客户端建立链接 >>>")
  } else {
    Array.from(connectPools.values()).forEach((socket) => {
      socket.send("这是系统推送的通知")
    })
  }

  res.status(200).end()
})

const server = createServer(app)

function onSocketError(err) {
  console.error(err)
}
server.on("upgrade", function (request, socket, head) {
  socket.on("error", onSocketError)

  console.log("Parsing session from request...")

  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
      socket.destroy()
      return
    }

    console.log("Session is parsed!")

    socket.removeListener("error", onSocketError)

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit("connection", ws, request)
    })
  })
})

server.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
