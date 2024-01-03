/*
 * @Date         : 2024-01-03 10:18:13 星期3
 * @Author       : xut
 * @Description  : HTTP 响应
 *
 * 一、响应报文
 * HTTP/1.1 200 OK                             // 协议版本 状态码 状态描述
 * Content-Length: 1024
 * Content-Type: application/json
 *
 * {"code":200,"message":null,"data":"xxx"}
 *
 * 二、响应数据设置
 * 1.状态码和状态文本 res.statusCode / res.statusMessage
 * 2.响应头 res.setHeader / res.getHeaders / res.hasHeader / res.removeHeader / res.writeHead
 * 3.响应体 res.write / res.end
 */
import { createServer, STATUS_CODES } from "node:http"
import { createReadStream } from "node:fs"
import { resolve } from "node:path"

const server = createServer((req, res) => {
  const method = req.method
  const url = req.url

  if (method === "GET" && url === "/status-code") {
    /**
     * 1. res.statusCode 单独使用，缺省 res.statusMessage 时，则将使用状态码对应的标准消息。HTTP.STATUS_CODES
     * 2. res.statusCode 优先级低于 res.writeHead(code, message, headers)
     * 3. res.writeHead(code, message, headers) 虽然是最终生效的值，但此方法设置的 code 是直接写入网络通道，不会覆盖 statusCode 的值。
     *    所以最后再使用 res.statusCode。
     */
    res.writeHead(200, STATUS_CODES["200"], { "content-type": "text/plain" })
    res.statusCode = 400

    // 最佳实践，不建立更改 statusMessage
    // res.statusMessage = "custom message"

    // 此时 res.statusCode 仍然是 400，但客户端响应是 200
    res.end(STATUS_CODES[res.statusCode])
  } else if (method === "GET" && url === "/header") {
    /**
     * 1. 响应头的增删改查 res.setHeader res.getHeader res.getHeaders res.hasHeader res.removeHeader，不管是设置还是获取，都不区分大不写
     * 2. res.writeHead(code, message, headers) 设置的 header 会和 setHeader 设置的值进行合并，并以 writeHead 为准，此时调用 getHeaders 是合并后的值
     *    但是如果之前没有调用过 setHeader 则调用 getHeaders 是空值，不会返回 writeHead 设置的值。这点很迷惑，注意区别。
     * 3. res.writeHead 设置之后不能再调用 setHeader 设置任何响应头，否则会报错 [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
     *    这点与文档描述不符
     */
    res.setHeader("Content-Type", "text/html")
    res.setHeader("X-Power-By", "node")
    res.setHeader("X-Foo", "bar")

    if (res.hasHeader("x-foo")) {
      res.removeHeader("x-foo")
    }

    res.writeHead(200, { "Content-Type": "application/json" })
    // res.setHeader("Content-Type", "text/html") // writeHead 之后再设置会报错

    res.end(JSON.stringify(res.getHeaders())) // 如果 writeHead 之前未调用过 setHeader 则 getHeaders 为空对象 {}，如果之前有调用，则为setHeader 和 writeHead 合并后的值
  } else if (method === "GET" && url === "/cookie-set") {
    // 同上述 header 一样，既可以使用 res.setHeader 设置，也可以使用 res.writeHead 设置

    res.setHeader("Set-Cookie", "sessionID=abcdef;path=/;max-age=10000")
    res.writeHead(200, {
      "set-cookie": ["type=ninja;path=/", "language=javascript;httpOnly"],
    }) // 同样会覆盖 setHeader 的同名值
    res.end("set cookie success")
  } else if (method === "GET" && url === "/redirect") {
    const redirectUrl = "https://www.bing.com"
    res.statusCode = 302
    res.setHeader("Location", decodeURI(redirectUrl))
    res.end(STATUS_CODES[res.statusCode] + ". Redirecting to " + redirectUrl)
  } else if (method === "GET" && url === "/body/text") {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.write("Hello ")
    res.write("World ")
    // res.end()
    res.end("/body/text") // 最终响应内容会把 write 和 end 的数据进行合并
  } else if (method === "GET" && url === "/body/html") {
    res.writeHead(200, { "Content-Type": "text/html" })
    res.end("<h1>/body/html</h1>")
  } else if (method === "GET" && url === "/body/json") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ author: "lisa", createTime: Date.now() }))
  } else if (method === "GET" && url === "/body/download") {
    const filename = "test.txt"
    const filePath = resolve(process.cwd(), "../../public", filename)
    console.log("🚀 ~ file: index.js:86 ~ server ~ filePath:", filePath)
    const file = createReadStream(filePath, { encoding: "utf8" })
    // Content-Disposition 响应标头指示响应的内容在浏览器中以何种形式展示，是以内联的形式（即网页或者页面的一部分），还是以附件 attachment 形式下载并保存到本地。
    res.writeHead(200, {
      "Content-Disposition": `attachment; filename=${filename}`,
    })
    file.pipe(res)
  } else if (method === "GET" && url === "/body/file") {
    const filename = "test.txt"
    const filePath = resolve(process.cwd(), "../../public", filename)
    console.log("🚀 ~ file: index.js:86 ~ server ~ filePath:", filePath)
    const file = createReadStream(filePath, { encoding: "utf8" })
    res.writeHead(200, { "Content-Type": "application/octet-stream" })
    file.pipe(res)
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(9000, () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
