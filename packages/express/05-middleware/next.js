/*
 * @Date         : 2024-01-06 12:21:17 星期6
 * @Author       : xut
 * @Description  : 测试 express 中 next 执行顺序
 *
 * 以下程序输出：
 *
 * app use router start before
 * cb1 before
 * cb2
 * cb1 after
 * app use router start after
 *
 * 这样的话，同 koa 中间件的洋葱执行顺序基本一样了。
 */

import expires, { Router } from "express"

const app = expires()
const router = Router()

router.get(
  "/index",
  async (req, res, next) => {
    console.log("cb1 before")
    await next()
    console.log("cb1 after")
  },
  async (req, res, next) => {
    console.log("cb2")
    res.send("测试 next 执行")
  }
)

app.use(async (req, res, next) => {
  console.log("app use router start before")
  await next()
  console.log("app use router start after")
})

app.use("/next", router)

app.use(async (req, res, next) => {
  console.log("app use router end before")
  await next()
  console.log("app use router end after")
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
