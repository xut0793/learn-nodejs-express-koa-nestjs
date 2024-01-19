/*
 * @Date         : 2024-01-06 16:32:06 星期6
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { createRouter } from "../src/lib/router.js"

const router = createRouter()

router.use(async (req, res, next) => {
  console.log("router use before")
  await next()
  console.log("router use after")
})

router.get(
  "/user/login",
  async (req, res, next) => {
    console.log("cb1 before")
    await next()
    console.log("cb1 after")
  },
  async (req, res, next) => {
    console.log("cb2")
    res.writeHead(200)
    res.end("/user/login 测试 node 自定义 router 执行")
  }
)

router.get("/order/query", async (req, res, next) => {
  res.writeHead(200)
  res.end("/order/query 测试 node 自定义 router 执行")
})

router.get("/error", () => {
  throw new Error("throw error")
})

router.use((err, req, res, next) => {
  console.log("🚀 ~ router.use ~ err:", err)
  next(err)
})

const app = createServer(router)

app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
