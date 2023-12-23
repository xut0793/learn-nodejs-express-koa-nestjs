/*
 * @Date         : 2023-12-23 11:25:14 星期6
 * @Author       : xut
 * @Description  : 开篇基本示例 Hello World
 */
import http from "node:http"

const app = http.createServer((req, res) => {
  res.end("Hello World By Node")
})

app.listen(9000, () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
