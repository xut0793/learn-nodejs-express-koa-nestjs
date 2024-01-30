/*
 * @Date         : 2024-01-27 00:23:10 星期6
 * @Author       : xut
 * @Description  :
 */
import Router from "@koa/router"
import userRouter from "../user/user.router.js"

const router = new Router({ prefix: "/api" })

router.use(userRouter.routes()).use(userRouter.allowedMethods())

export default router
