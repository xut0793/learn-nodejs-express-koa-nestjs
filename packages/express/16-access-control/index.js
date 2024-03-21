/*
 * @Date         : 2024-02-27 15:38:29 星期2
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import express from "express"
import router from "./router/index.js"

const app = express()

app.use(
  "/static",
  express.static(resolve(process.cwd(), "./16-access-control/public"))
)
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use("/api", router)

app.listen(8080, () => {
  console.log(`🚀 Server running at http://localhost:8080`)
})
