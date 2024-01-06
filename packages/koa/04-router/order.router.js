/*
 * @Date         : 2024-01-06 12:46:14 星期6
 * @Author       : xut
 * @Description  :
 */
import Router from "@koa/router"

const router = new Router({ prefix: "/order" })

router.get("/query", (ctx) => {
  ctx.body = "order query"
})

export default router
