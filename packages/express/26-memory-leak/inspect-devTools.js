/*
 * @Date         : 2024-06-03 19:34:42 星期1
 * @Author       : xut
 * @Description  :
 */
import http from "node:http"

const requestLogs = []
const server = http.createServer((req, res) => {
  requestLogs.push({ url: req.url, date: new Date() })
  res.end(JSON.stringify(requestLogs))
})

server.listen(3000)
console.log("Server listening to port 3000. Press Ctrl+C to stop it.")
