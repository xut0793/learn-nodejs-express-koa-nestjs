/*
 * @Date         : 2023-12-23 12:01:02 星期6
 * @Author       : xut
 * @Description  :
 */
import koa from "koa"

const app = new koa()

app.use(async (ctx) => {
  ctx.body = "Hello World By koa"
})

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
