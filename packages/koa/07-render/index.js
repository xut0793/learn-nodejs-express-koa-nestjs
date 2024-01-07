/*
 * @Date         : 2024-01-07 16:52:27 星期0
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import koa from "koa"
import Router from "@koa/router"
import hbs from "koa-handlebars-next"
import { section } from "./view/helper/index.js"
import { mockList } from "./db/index.js"

const app = new koa()

// 区别于 express 中配置，这里使用相对路径，相对 root，
// 并且布局模板中使用 @body 变量。
app.use(
  hbs({
    root: resolve(process.cwd(), "./07-render/view"), // 默认值 process.cwd()
    extension: "hbs", // 这是默认值
    defaultLayout: "main",
    viewsDir: "./page", // 默认值  views
    layoutsDir: "./layout", // 默认值是 layouts
    partialsDir: "./partial", // 默认值是 partials
    helpers: { section },
  })
)

const router = new Router()

router.get("/render", (ctx) => {
  ctx.body = "render Hello World By Koa"
})

router.get("/render/list", async (ctx) => {
  // 必须使用 async / await
  await ctx.render("renderList", { list: mockList })
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
