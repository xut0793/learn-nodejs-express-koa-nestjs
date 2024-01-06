/*
 * @Date         : 2024-01-06 12:56:33 星期6
 * @Author       : xut
 * @Description  :
 */
import Router from "@koa/router"
const router = new Router({ prefix: "/user" })

router.get("/login", (ctx) => {
  ctx.body = "user login"
})

export default router
