/*
 * @Date         : 2024-01-06 19:36:04 星期6
 * @Author       : xut
 * @Description  :
 */
import express from "express"
import userRouter from "./router/user.router.js"

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use("/user", userRouter)

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
