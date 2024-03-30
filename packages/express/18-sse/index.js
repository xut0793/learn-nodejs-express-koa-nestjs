/*
 * @Date         : 2024-03-30 08:42:26 星期6
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import express from "express"
import { create } from "express-handlebars"
import { router as helloRouter } from "./router/hello.router.js"
import { router as jsonRouter } from "./router/json.router.js"
import { router as cronRouter } from "./router/cron.router.js"
import { router as eventRouter } from "./router/emit.router.js"
import { router as clientRouter } from "./router/client.router.js"
import { router as disconnectRouter } from "./router/disconnect.router.js"
import { router as lastEventIdRouter } from "./router/lastEventId.router.js"

const app = express()

const hbs = create({
  extname: "hbs",
  defaultLayout: false,
})

app.set("views", resolve(process.cwd(), "./18-sse/public")) // 配置视图读取的目录
app.set("view engine", "hbs") // 默认情况下，express 会根据文件名后缀读取对应的模板引擎 .pug => pug .hbs => hbs
app.engine("hbs", hbs.engine) // 默认情况下，express 会调用上面注册的 view engine 的值 hbs.__express 作为解析引擎，所以这里覆盖为自定义的 create 的值。

app.use("/static", express.static(resolve(process.cwd(), "./18-sse/public")))
app.use("/sse/hello", helloRouter)
app.use("/sse/json", jsonRouter)
app.use("/sse/cron", cronRouter)
app.use("/sse/event", eventRouter)
app.use("/sse/client", clientRouter)
app.use("/sse/disconnect", disconnectRouter)
app.use("/sse/lastEventId", lastEventIdRouter)

app.get("/hello", (req, res) => {
  res.render("hello")
})
app.get("/json", (req, res) => {
  res.render("json")
})
app.get("/cron", (req, res) => {
  res.render("cron")
})
app.get("/event", (req, res) => {
  res.render("emit")
})
app.get("/client", (req, res) => {
  res.render("client")
})
app.get("/disconnect", (req, res) => {
  res.render("disconnect")
})
app.get("/lastEventId", (req, res) => {
  res.render("lastEventId")
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
