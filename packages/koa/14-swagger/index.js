/*
 * @Date         : 2024-01-26 23:07:08 星期5
 * @Author       : xut
 * @Description  :
 */
import Koa from "koa"
import swaggerRouter from "./utils/swagger.js"
import router from "./router/index.js"

const app = new Koa()
app.use(swaggerRouter.routes()).use(swaggerRouter.allowedMethods())
app.use(router.routes()).use(router.allowedMethods())

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
