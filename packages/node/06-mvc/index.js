/*
 * @Date         : 2024-01-06 18:32:12 星期6
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import router from "./router/index.js"

const hostname = "localhost"
const port = process.env.PROT || 9000

const server = createServer(router)

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://${hostname}:${port}`)
})
