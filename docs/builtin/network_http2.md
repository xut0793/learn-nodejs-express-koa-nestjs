# HTTP/2

Node.js 自 v8.4.0 版本起就提供了对 HTTP/2 协议的稳定支持，通过内置的 `http2` 模块即可实现。相比传统的 HTTP/1.1，HTTP/2 带来了显著的性能与安全性提升，其核心优势主要体现在以下三个方面：

- 多路复用 (Multiplexing)：打破了 HTTP/1.1 的队头阻塞限制，允许在单个 TCP 连接上并行传输多个请求和响应（流），极大地提高了传输效率。
- 头部压缩 (HPACK)：通过共享字典和动态表减少冗余的头部数据，显著降低了协议开销。
- 服务器推送 (Server Push)：允许服务器在客户端明确请求之前，主动将预期客户端需要的资源（如 CSS、JS 文件）推送给客户端，减少请求往返时间。

需要注意的是，在现代 Web 开发中，HTTP/2 通常强制要求连接必须加密（即基于 TLS/HTTPS）。

`http2` 核心类与方法总结：

| 核心类 / 方法                     | 作用与说明                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `http2.createSecureServer()`      | 创建安全的 HTTP/2 服务器。生产环境中必须使用此方法，需传入包含 `key` 和 `cert` 的 TLS 选项对象。 |
| `http2.connect()`                 | 创建 HTTP/2 客户端会话。用于发起 HTTP/2 请求，连接到指定的服务器。                               |
| `Http2ServerRequest` / `Response` | 兼容性 API。为了降低迁移成本，Node.js 提供了兼容 `http` 模块的 API，方便从 HTTP/1.1 平滑过渡。   |
| `Http2Session`                    | HTTP/2 会话类。代表客户端与服务器之间的持久连接，负责管理底层的 TCP/TLS 连接和流的生命周期。     |
| `Http2Stream`                     | HTTP/2 流类。代表会话中的一个双向流，每个 HTTP 请求/响应对都是一个独立的流。                     |
| `serverHttp2Session.pushStream()` | 服务器推送方法。允许服务器主动向客户端推送资源流。                                               |
| `http2stream.respondWithFile()`   | 快捷响应方法。可以直接将文件作为响应体发送给客户端，简化了文件传输的代码。                       |

示例代码

1. 搭建高性能的 HTTP/2 安全服务器

以下代码展示了如何创建一个支持服务器推送和文件响应的安全 HTTP/2 服务器：

```javascript
import http2 from "node:http2"
import fs from "node:fs"

// 必须提供有效的 SSL/TLS 密钥和证书文件
const server = http2.createSecureServer({
  key: fs.readFileSync("/path/to/server.key"),
  cert: fs.readFileSync("/path/to/server.crt"),
})

server.on("stream", (stream, headers) => {
  const path = headers[":path"]

  // 演示服务器推送：当客户端请求首页时，主动推送样式表
  if (path === "/" && stream.pushAllowed) {
    stream.pushStream({ ":path": "/style.css" }, (err, pushStream) => {
      if (!err) {
        pushStream.respondWithFile("./public/style.css", {
          "content-type": "text/css",
        })
      }
    })
  }

  // 响应客户端请求
  if (path === "/") {
    stream.respondWithFile("./public/index.html", {
      "content-type": "text/html",
    })
  } else if (path === "/style.css") {
    // 如果客户端自己请求了 CSS，正常响应
    stream.respondWithFile("./public/style.css", {
      "content-type": "text/css",
    })
  }
})

server.listen(8443, () => {
  console.log("HTTP/2 Secure Server running on https://localhost:8443")
})
```

1. 创建 HTTP/2 客户端发起请求

使用 Node.js 作为客户端去请求一个 HTTP/2 服务：

```javascript
import http2 from "node:http2"

const client = http2.connect("https://localhost:8443", {
  // 如果是自签名证书，测试时需忽略拒绝未授权证书的错误
  rejectUnauthorized: false,
})

const req = client.request({ ":path": "/" })

req.on("response", (headers, flags) => {
  console.log("状态码:", headers[":status"]) // 例如：200
  console.log("响应头:", headers)
})

let data = ""
req.setEncoding("utf8")
req.on("data", (chunk) => {
  data += chunk
})
req.on("end", () => {
  console.log("响应体:", data)
  client.close() // 请求结束后关闭客户端连接
})

req.end()
```

安全性与性能优化建议

- 强制 HTTPS 与 HSTS：在响应头中添加 `strict-transport-security`，强制客户端始终使用 HTTPS 连接，防止中间人攻击。
- 流控与防攻击：可以通过配置 `maxSendHeaderBlockLength` 等选项来限制请求头的大小，防止头部注入攻击或内存耗尽。
- 流优先级控制：利用 `stream.priority()` 方法，可以为重要的资源流设置更高的权重（weight），优化关键资源的加载速度。
