/*
 * @Date         : 2024-01-06 12:45:27 星期6
 * @Author       : xut
 * @Description  :
 */
import express from "express"
import orderRouter from "./order.router.js"
import userRouter from "./user.router.js"

const app = express()
app.use("/user", userRouter) // 匹配 /user/login
app.use("/order", orderRouter) // 匹配 /order/query

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
