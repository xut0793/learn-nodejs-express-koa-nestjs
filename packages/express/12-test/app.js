/*
 * @Date         : 2024-01-23 16:58:59 星期2
 * @Author       : xut
 * @Description  :
 */
import { STATUS_CODES } from "node:http"
import express from "express"
import { responseMiddleware } from "./common/middleware/response.middleware.js"
import userRouter from "./user/user.router.js"

import { BizException } from "../../node/src/utils/biz.exception.js"

const app = express()

app.use(express.json())
app.use(responseMiddleware)
app.use("/user", userRouter)

app.use((err, req, res, next) => {
  if (err instanceof BizException) {
    res.type("json")
    res.status(200).end(JSON.stringify(err))
  } else {
    if (req.app.get("env") !== "production") {
      console.error(err.stack || err.toString())
    }
    res.type("json")
    res.status(500).end(
      JSON.stringify({
        code: err.code || 500,
        msg: err.msg || err.message || STATUS_CODES[500],
        data: null,
      })
    )
  }
})

export default app
