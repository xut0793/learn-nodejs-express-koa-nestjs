# https

[How HTTPS Works](https://howhttps.works/zh/)

Node.js 的 `https` 模块是构建安全 Web 服务的基础，它本质上是基于 TLS/SSL 的 HTTP 协议实现。

核心类与方法：

| 核心类 / 方法          | 作用与说明                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `https.createServer()` | **创建 HTTPS 服务器**。必须传入包含 TLS 私钥 (`key`) 和证书 (`cert`) 的 `options` 对象。 |
| `https.request()`      | **发起 HTTPS 客户端请求**。用于向安全的 Web 服务器发送各种方法（GET, POST 等）的请求。   |
| `https.get()`          | **发起 HTTPS GET 请求**。`https.request()` 的简化版，专门用于发送 GET 请求。             |
| `https.Agent`          | **管理连接池**。用于复用 HTTPS 客户端的底层 TCP 连接，提高请求性能。                     |
| `https.globalAgent`    | **全局默认代理**。所有 HTTPS 客户端请求在未指定 Agent 时，默认使用此全局代理对象。       |
| `rejectUnauthorized`   | **证书验证选项**。默认为 `true`，若设为 `false` 则接受无效的自签名证书（仅限测试环境）。 |

实战代码示例

1. 搭建基础的 HTTPS 服务器

与普通的 HTTP 服务器不同，创建 HTTPS 服务器必须提供 SSL/TLS 证书和私钥。

```javascript
import https from "node:https"
import fs from "node:fs"

// 加载 SSL/TLS 证书和私钥
const options = {
  key: fs.readFileSync("./path/to/server-key.pem"), // 私钥
  cert: fs.readFileSync("./path/to/server-cert.pem"), // 公钥证书
}

const server = https.createServer(options, (req, res) => {
  res.writeHead(200)
  res.end("Hello, secure world!\n")
})

server.listen(443, () => {
  console.log("HTTPS server is running on port 443")
})
```

1. 发起安全的 HTTPS 客户端请求

使用 `https.request()` 向第三方安全 API 发起请求，并处理响应数据：

```javascript
import https from "node:https"

const options = {
  hostname: "api.example.com",
  port: 443,
  path: "/data",
  method: "GET",
}

const req = https.request(options, (res) => {
  console.log("状态码:", res.statusCode)

  let data = ""
  res.on("data", (chunk) => {
    data += chunk
  })

  res.on("end", () => {
    console.log("响应数据:", data)
  })
})

// 捕获请求过程中的错误（如证书验证失败、网络错误等）
req.on("error", (e) => {
  console.error("请求出错:", e.message)
})

req.end()
```

安全性与生产环境建议

- 强制 HTTP 重定向到 HTTPS：为了确保所有流量都被加密，通常会同时启动一个普通的 HTTP 服务器，将所有 HTTP 请求通过 `301` 状态码重定向到 HTTPS 端口。
  ```javascript
  const http = require("http")
  // 将 HTTP 请求重定向到 HTTPS
  http
    .createServer((req, res) => {
      res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` })
      res.end()
    })
    .listen(80)
  ```
- 使用可信 CA 签发的证书\*\*：在开发和测试阶段可以使用自签名证书，但在生产环境中，必须使用由可信证书颁发机构（CA）签发的证书，否则浏览器和客户端会提示“连接不安全”。
- 禁用旧版协议和弱加密算法\*\*：在创建服务器时，可以通过 `secureOptions` 和 `ciphers` 选项强制使用高安全性的加密套件，并禁用 SSLv3、TLSv1 等存在安全隐患的旧版协议。
- 启用 HSTS (HTTP Strict Transport Security)\*\*：在响应头中设置 `Strict-Transport-Security`，强制浏览器在未来的一段时间内只通过 HTTPS 访问该网站，有效防御中间人攻击。
