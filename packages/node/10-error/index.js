/*
 * @Date         : 2024-01-16 21:08:18 星期2
 * @Author       : xut
 * @Description  :
 */
import { STATUS_CODES, createServer } from "node:http"
import { createRouter } from "../src/lib/router.js"
import {
  UserNotFoundBizException,
  BizException,
} from "../src/utils/biz.exception.js"

const router = createRouter()

router.get("/error", (req, res) => {
  throw new Error("throw error")
})

router.get("/error/user", () => {
  throw new UserNotFoundBizException()
})

router.use((err, req, res, next) => {
  if (err instanceof BizException) {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify(err))
  } else {
    if (process.env.NODE_ENV !== "production") {
      console.error(err.stack || err.toString())
    }

    res.writeHead(500, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        code: err.code || 500,
        msg: err.msg || err.message || STATUS_CODES[500],
        data: null,
      })
    )
  }
})

const app = createServer(router)
app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
