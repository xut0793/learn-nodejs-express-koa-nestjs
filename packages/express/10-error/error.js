/*
 * @Date         : 2024-01-16 21:10:54 星期2
 * @Author       : xut
 * @Description  : express 错误默认响应 html
 */
import express from "express"
import { readFile } from "node:fs"
import { readFile as readFilePromise } from "node:fs/promises"
import "express-async-errors"

const app = express()
const router = express.Router()

router.get("/", (req, res) => {
  throw new Error("BROKEN")
})

router.get("/next", (req, res, next) => {
  next(new Error("throw error for next"))
})

router.get("/throw", (req, res) => {
  throw new Error("throw error")
})

router.get("/callback", (req, res, next) => {
  readFile("/file-does-not-exist", (err, data) => {
    if (err) {
      next(err)
    } else {
      res.send(data)
    }
  })
})

router.get("/promise", (req, res, next) => {
  readFilePromise("/file-does-not-exist").then(res.send).catch(next)
})

router.get("/reject", () => {
  return Promise.reject("throw promise reject")
})

router.get("/try-catch", (req, res) => {
  try {
    console.log("/try-catch >>>")
    throw new Error("throw try-catch error")
  } catch (error) {
    throw error
  }
})

router.get("/try-catch-next", (req, res, next) => {
  try {
    console.log("/try-catch-next >>>")
    throw new Error("throw try-catch error to next(error)")
  } catch (error) {
    next(error)
  }
})

app.use("/error", router)
app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
