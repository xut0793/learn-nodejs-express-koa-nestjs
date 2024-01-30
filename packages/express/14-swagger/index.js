/*
 * @Date         : 2024-01-26 14:28:15 星期5
 * @Author       : xut
 * @Description  :
 */
import express from "express"
import router from "./router/index.js"
import swaggerRouter from "./utils/swagger.js"

const app = express()

app.use(express.json())
app.use(swaggerRouter)
app.use("/api", router)

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
