/*
 * @Date         : 2023-12-27 10:54:36 星期3
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { urlParser, cookieParser } from "../src/parser/index.js"

export const app = createServer((req, res) => {
  const { pathname, method } = urlParser(req)
  cookieParser(req)

  res.setHeader("Content-Type", "application/json")
  res.statusCode = 200

  if (method === "get" && pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("Hello World By Node HTTP")
    return
  } else if (method === "get" && pathname === "/cookie/set") {
    // 单个设置方式
    res.setHeader(
      "Set-Cookie",
      `c1=111;path=/;httpOnly;maxAge=${Date.now() + 1 * 60 * 60 * 1000}`
    )
    // 多个设置方式
    res.setHeader("Set-Cookie", [
      `c2=22;path=/;httpOnly;maxAge=${Date.now() + 1 * 60 * 60 * 1000}`,
      "c3=333",
    ])
    res.end("cookie set success")
    return
  } else if (method === "get" && pathname === "/cookie/get") {
    res.end(JSON.stringify(req.cookies))
    return
  } else {
    res.writeHead(404)
    res.end("NOT FOUND")
  }
})

app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
