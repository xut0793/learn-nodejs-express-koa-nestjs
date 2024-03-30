/*
 * @Date         : 2024-01-07 16:27:58 星期0
 * @Author       : xut
 * @Description  :
 */
import express from "express"
import { resolve } from "node:path"
import { create } from "express-handlebars"
import { section } from "./view/helper/index.js"
import { mockList } from "./db/index.js"

// 配置视图模板
const viewPath = resolve(process.cwd(), "./07-render/view")
const hbs = create({
  extname: "hbs",
  defaultLayout: "main",
  layoutsDir: resolve(viewPath, "layout"),
  partialsDir: resolve(viewPath, "partial"),
  helpers: {
    section,
  },
})

const app = express()
app.set("views", resolve(viewPath, "page")) // 配置视图读取的目录
app.set("view engine", "hbs") // 默认情况下，express 会根据文件名后缀读取对应的模板引擎 .pug => pug .hbs => hbs
app.engine("hbs", hbs.engine) // 默认情况下，express 会调用上面注册的 view engine 的值 hbs.__express 作为解析引擎，所以这里覆盖为自定义的 create 的值。

app.get("/render", (req, res) => {
  res.send("render Hello World By Express")
})

app.get("/render/list", (req, res) => {
  res.render("renderList", { list: mockList })
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
