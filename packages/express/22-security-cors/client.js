/*
 * @Date         : 2024-04-12 10:24:52 星期5
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import express from "express"
import { create } from "express-handlebars"
import cookieParser from "cookie-parser"

const app = express()

const hbs = create({
  extname: "hbs",
  defaultLayout: false,
})

app.set("views", resolve(process.cwd(), "./22-security-cors/public")) // 配置视图读取的目录
app.set("view engine", "hbs") // 默认情况下，express 会根据文件名后缀读取对应的模板引擎 .pug => pug .hbs => hbs
app.engine("hbs", hbs.engine) // 默认情况下，express 会调用上面注册的 view engine 的值 hbs.__express 作为解析引擎，所以这里覆盖为自定义的 create 的值。
app.use(
  "/static",
  express.static(resolve(process.cwd(), "./22-security-cors/public"))
)

app.get("/", (req, res) => {
  res.render("index")
})

app.get("/cookie", cookieParser(), (req, res) => {
  console.log("🚀 ~ app.get", req.url)

  res.cookie("custom_11", "1111", { path: "/" })
  res.cookie("custom_sameSite", "2222", { path: "/", sameSite: "strict" })
  res.status(200).send("set-cookie ok")
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
