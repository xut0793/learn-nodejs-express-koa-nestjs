import { STATUS_CODES } from "node:http"
import express from "express"
import {
  BizException,
  UserNotFoundBizException,
} from "../../node/src/utils/biz.exception.js"

const app = express()

app.get("/error", (req, res) => {
  throw new Error("throw error to error middleware")
})

app.get("/error/user", () => {
  throw new UserNotFoundBizException()
})

app.use((err, req, res, next) => {
  console.log("🚀 ~ app.use ~ next(err) 1:")
  next(err)
})

app.use((err, req, res, next) => {
  console.log("🚀 ~ app.use ~ response err 2:")

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
