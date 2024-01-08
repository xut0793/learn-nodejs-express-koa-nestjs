/*
 * @Date         : 2024-01-08 20:58:15 星期1
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { resolve } from "node:path"
import { createRouter } from "../src/lib/router.js"
import staticServer from "../src/parser/static-server.js"

const router = createRouter()

router.get("/", (req, res) => {
  res.end("static server By node")
})

router.use(
  staticServer(resolve(process.cwd(), "./08-static"), {
    publicPath: "public",
    prefix: "static",
  })
)

const app = createServer(router)
app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
