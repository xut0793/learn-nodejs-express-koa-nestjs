/*
 * @Date         : 2024-01-06 12:37:59 星期6
 * @Author       : xut
 * @Description  : 测试 koa 中 next 执行顺序
 *
 * 以下程序输出：
 * app use router start before
 * cb1 before
 * cb2
 * cb1 after
 * app use router start after
 */
import koa from "koa"
import Router from "@koa/router"

const app = new koa()
const router = new Router({ prefix: "/next" })

router.get(
  "/index",
  async (ctx, next) => {
    console.log("cb1 before")
    await next()
    console.log("cb1 after")
  },
  async (ctx, next) => {
    console.log("cb2")
    ctx.body = "测试 next 执行"
  }
)

app.use(async (ctx, next) => {
  console.log("app use router start before")
  await next()
  console.log("app use router start after")
})

app.use(router.routes()).use(router.allowedMethods())

app.use(async (ctx, next) => {
  console.log("app use router end before")
  await next()
  console.log("app use router end after")
})

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
