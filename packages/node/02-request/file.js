/*
 * @Date         : 2023-12-27 10:54:36 星期3
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { urlParser } from "../src/parser/index.js"
import { bodyParser } from "../src/parser/body-parser.js"

export const app = createServer((req, res) => {
  const { pathname, method } = urlParser(req)

  res.setHeader("Content-Type", "application/json")
  res.statusCode = 200

  if (method === "post" && pathname === "/file/single") {
    const fileParser = bodyParser.file({ maxCount: 1 })

    return fileParser(req, res, (err) => {
      if (err) {
        res.writeHead(500)
        res.end(err.message)
        return
      }

      return res.end(
        JSON.stringify({
          body: req.body,
          file: req.file,
        })
      )
    })
  } else if (method === "post" && pathname === "/file/multi") {
    const fileParser = bodyParser.file({
      field: "photos",
      multiple: true,
      maxCount: 2,
    })

    return fileParser(req, res, (err) => {
      if (err) {
        res.writeHead(500)
        res.end(err.message)
        return
      }

      return res.end(
        JSON.stringify({
          body: req.body,
          files: req.files,
        })
      )
    })
  } else if (method === "post" && pathname === "/file/fields") {
    const fileParser = bodyParser.file({
      multiple: true,
      fields: [
        { name: "avatar", maxCount: 1 },
        { name: "photos", maxCount: 1 },
      ],
    })
    return fileParser(req, res, (err) => {
      if (err) {
        res.writeHead(500)
        res.end(err.message)
        return
      }

      return res.end(
        JSON.stringify({
          body: req.body,
          files: req.files,
        })
      )
    })
  } else {
    res.writeHead(404)
    res.end("NOT FOUND")
  }
})

app.listen(9000, "0.0.0.0", () => {
  // console.log(`🚀 Server running at http://localhost:9000`)
})
