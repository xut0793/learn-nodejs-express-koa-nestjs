/*
 * @Date         : 2024-01-16 22:17:07 星期2
 * @Author       : xut
 * @Description  :
 */
import { STATUS_CODES } from "node:http"
import Koa from "koa"
import Router from "@koa/router"
import {
  BizException,
  UserNotFoundBizException,
} from "../../node/src/utils/biz.exception.js"

const router = new Router({ prefix: "/error" })

router.get("/", async (ctx) => {
  throw new Error("throw error")
})

router.get("/user", async (ctx) => {
  throw new UserNotFoundBizException()
})

const app = new Koa()

app.use(router.routes()).use(router.allowedMethods())

app.on("error", (err, ctx) => {
  const res = ctx.res
  if (err instanceof BizException) {
    res.status = 200
    res.type = "json"
    res.end(JSON.stringify(err))
  } else {
    if (ctx.get("env") !== "production") {
      console.error(err.stack || err.toString())
    }
    res.status = 500
    res.type = "json"
    res.end(
      JSON.stringify({
        code: err.code || 500,
        msg: err.msg || err.message || STATUS_CODES[500],
        data: null,
      })
    )
  }
})

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
