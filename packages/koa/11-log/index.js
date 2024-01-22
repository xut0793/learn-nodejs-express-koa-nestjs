/*
 * @Date         : 2024-01-06 19:36:04 星期6
 * @Author       : xut
 * @Description  : winston.config.npm.levels
  {
    error: 0, // 严重错误
    warn: 1, // 警告
    info: 2, // 信息
    http: 3, // http
    verbose: 4, // 冗长的，详细的
    debug: 5, // 调试
    silly: 6 // 临时的，随意的
  }
 */
import koa from "koa"
import { koaBody } from "koa-body"
import userRouter from "./router/user.router.js"
import { loggerMiddleware } from "./middleware/logger.middleware.js"
import { BizException } from "../../node/src/utils/biz.exception.js"

const app = new koa()

app
  .use(koaBody())
  .use(loggerMiddleware)
  .use(userRouter.routes())
  .use(userRouter.allowedMethods())

app.on("error", (err, ctx) => {
  ctx.logger.error(err)

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
