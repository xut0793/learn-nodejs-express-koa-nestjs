/*
 * @Date         : 2023-12-27 10:54:36 星期3
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import {
  urlParser,
  queryParser,
  cookieParser,
  paramsParser,
} from "../src/parser/index.js"
import { bodyParser } from "../src/parser/body-parser.js"

export const app = createServer((req, res) => {
  const { search, pathname, method } = urlParser(req)
  queryParser(req, search)
  cookieParser(req)

  res.setHeader("Content-Type", "application/json")
  res.statusCode = 200

  if (method === "get" && pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("Hello World By Node HTTP")
    return
  } else if (method === "get" && pathname === "/url") {
    const resData = {
      method: req.method, // 原生是大写 GET POST
      url: req.url,
      protocol: req.protocol,
      hostname: req.hostname,
      pathname: req.pathname,
    }
    res.end(JSON.stringify(resData))
    return
  } else if (method === "get" && pathname === "/headers") {
    res.end(JSON.stringify(req.headers))
    return
  } else if (method === "get" && pathname === "/query") {
    res.end(JSON.stringify(req.query))
  } else if (method === "get" && pathname.startsWith("/params")) {
    const params = paramsParser(req, pathname, "/params/:id")
    res.end(JSON.stringify(params))
    return
  } else if (method === "post" && pathname === "/body/text") {
    const textParser = bodyParser.text()
    return textParser(req, res, (err) => {
      res.setHeader("Content-Type", "text/plain")
      if (err) {
        res.statusCode = 500
        res.end(err.message)
        return
      }
      res.statusCode = 200
      res.end(req.body)
    })
  } else if (method === "post" && pathname === "/body/urlencoded") {
    const urlencodedParser = bodyParser.urlencoded()
    return urlencodedParser(req, res, (err) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" })
        res.end(err.message)
        return
      }
      res.end(JSON.stringify(req.body))
    })
  } else if (method === "post" && pathname === "/body/json") {
    const jsonParser = bodyParser.json()
    return jsonParser(req, res, (err) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" })
        res.end(err.message)
      } else {
        res.end(JSON.stringify(req.body))
      }
    })
  } else if (method === "post" && pathname === "/body/raw") {
    const rawParser = bodyParser.raw()
    return rawParser(req, res, (err) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" })
        res.end(err.message)
        return
      }
      res.end("received raw success")
    })
  } else {
    res.writeHead(404)
    res.end("NOT FOUND")
  }
})

app.listen(9000, "0.0.0.0", () => {
  // console.log(`🚀 Server running at http://localhost:9000`)
})
