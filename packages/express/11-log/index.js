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
import express from "express"
import cookieParser from "cookie-parser"
import userRouter from "./router/user.router.js"
import { BizException } from "../../node/src/utils/biz.exception.js"
import { loggerMiddleware } from "./middleware/logger.middleware.js"

const app = express()

app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// 假设这里有鉴权中间件，附加了 req.user 对象
app.use((req, res, next) => {
  req.user = { id: "lisa07975", username: "lisa", role: "ADMIN" }
  next()
})

app.use(loggerMiddleware)
app.use("/user", userRouter)

// 错误中间件中记录错误日志
app.use((err, req, res, next) => {
  req.logger.error(err)

  if (err instanceof BizException) {
    res.type("json")
    res.status(200).send(err)
  } else {
    if (req.app.get("env") !== "production") {
      console.error(err.stack || err.toString())
    }
    res.type("json")
    res.status(500).send({
      code: err.code || 500,
      msg: err.msg || err.message || STATUS_CODES[500],
      data: null,
    })
  }
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
