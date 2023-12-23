/*
 * @Date         : 2023-12-23 11:52:59 星期6
 * @Author       : xut
 * @Description  : 开篇基本示例 Hello World
 */
import express from "express"

const app = express()

app.get("/", (req, res) => {
  res.send("Hello World By Express")
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
