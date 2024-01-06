/*
 * @Date         : 2024-01-06 19:36:04 星期6
 * @Author       : xut
 * @Description  :
 */
import koa from "koa"
import { koaBody } from "koa-body"
import userRouter from "./router/user.router.js"

const app = new koa()

app.use(koaBody()).use(userRouter.routes()).use(userRouter.allowedMethods())

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
