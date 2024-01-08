/*
 * @Date         : 2024-01-08 20:18:29 星期1
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import express from "express"

const app = express()

app.use(
  "/static",
  express.static(resolve(process.cwd(), "./08-static/public"), {
    dotfiles: "ignore",
    etag: false,
    extensions: ["htm", "html"],
    index: false,
    maxAge: "1d",
    redirect: false,
    setHeaders: function (res, path, stat) {
      res.set("x-timestamp", Date.now())
    },
  })
)

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
