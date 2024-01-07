/*
 * @Date         : 2024-01-07 16:52:47 星期0
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { resolve } from "node:path"
import { createRouter } from "../src/lib/router.js"
import { create } from "../src/parser/render-parser.js"
import { section } from "./view/helper/index.js"
import { mockList } from "./db/index.js"

// 配置视图模板
const hbs = create({
  root: resolve(process.cwd(), "./07-render/view"),
  extname: "hbs",
  defaultLayout: "main",
  layoutsDir: "./layout",
  partialsDir: "./partial",
  viewsDir: "./page",
  helpers: {
    section,
  },
})

const router = createRouter()

router.get("/render", (req, res) => {
  res.end("Hello World By node")
})

router.get("/render/list", hbs, (req, res) => {
  res.render("renderList", { list: mockList })
})

const app = createServer(router)
app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
