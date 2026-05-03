# HTTP

Node.js 的 http 模块是构建网络应用的基石，它提供了底层的、非阻塞的 I/O 能力。

按照 HTTP 遵循的请求（客户端）-响应（服务端）模型进行通信。

作为一名资深 Node.js 开发工程师，很高兴为你深入梳理 Node.js 中 HTTP 模块的核心知识点。

Node.js 的 `http` 模块是构建网络应用的基石，它提供了底层的、非阻塞的 I/O 能力。我们可以将其分为两大核心板块：**HTTP 服务端（Server）**与**HTTP 客户端（Client）**。

## HTTP 服务端（Server）

在 Node.js 中，我们通过 `http.createServer()` 来创建一个 Web 服务器。

它的核心在于事件驱动，通过监听请求流（Request）并返回响应流（Response）来处理业务。

### 核心类与方法总结

| 核心对象/方法          | 类型     | 作用与描述                                                                                    |
| :--------------------- | :------- | :-------------------------------------------------------------------------------------------- |
| `http.createServer()`  | 方法     | 创建并返回一个 `http.Server` 实例，接收一个 `(req, res)` 回调函数。                           |
| `server.listen()`      | 方法     | 让服务器实例在指定的主机和端口上开始监听连接。                                                |
| `http.IncomingMessage` | 类 (req) | 表示客户端发来的请求。它是一个可读流（Readable Stream），包含请求的元数据。                   |
| `http.ServerResponse`  | 类 (res) | 表示服务器返回给客户端的响应。它是一个可写流（Writable Stream），用于发送状态码、头和响应体。 |

### `req` (IncomingMessage) 常用属性和方法：

| 类型      | 名称                 | 作用与描述                                                             |
| :-------- | :------------------- | :--------------------------------------------------------------------- |
| 属性      | `req.method`         | 获取请求的 HTTP 方法（如 'GET', 'POST', 'PUT', 'DELETE'）。            |
| 属性      | `req.url`            | 获取请求的 URL 路径及查询字符串（如 `/api/user?id=1`）。               |
| 属性      | `req.headers`        | 获取客户端发送的请求头对象（包含 User-Agent, Cookie 等信息）。         |
| 属性      | `req.httpVersion`    | 获取客户端使用的 HTTP 协议版本（通常是 "1.1" 或 "1.0"）。              |
| 属性      | `req.trailers`       | 获取 HTTP 请求的尾部（trailers）对象。                                 |
| 方法/事件 | `req.on('data', cb)` | 流式读取。当请求体数据到来时触发，回调函数接收数据块（chunk）。        |
| 方法/事件 | `req.on('end', cb)`  | 流式读取。当请求体数据全部传输完毕时触发，标志着可以开始处理完整数据。 |
| 方法/事件 | `req.setTimeout()`   | 设置请求的超时时间（毫秒）。                                           |

### `res` (ServerResponse) 常用属性和方法：

| 类型 | 名称                                   | 作用与描述                                                         |
| :--- | :------------------------------------- | :----------------------------------------------------------------- |
| 属性 | `res.statusCode`                       | 设置或获取 HTTP 响应的状态码（如 200, 404, 500）。                 |
| 属性 | `res.statusMessage`                    | 设置或获取与状态码对应的状态消息（如 "OK", "Not Found"）。         |
| 方法 | `res.setHeader(name, value)`           | 设置单个响应头的值（必须在 `res.end` 之前调用）。                  |
| 方法 | `res.getHeader(name)`                  | 读取已设置的指定响应头的值。                                       |
| 方法 | `res.removeHeader(name)`               | 移除已设置的指定响应头。                                           |
| 方法 | `res.writeHead(statusCode, [headers])` | 一次性向客户端发送响应状态码和响应头。                             |
| 方法 | `res.write(chunk)`                     | 向响应体中写入数据块。可以多次调用以发送连续的数据。               |
| 方法 | `res.end([data])`                      | 必须调用。结束响应过程。如果传入 data，相当于先 `write` 再 `end`。 |

### 服务端代码实战示例

下面是一个能够处理 GET 和 POST 请求的基础服务器：

```javascript
const http = require("http")

const server = http.createServer((req, res) => {
  // 处理 GET 请求
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ message: "欢迎访问 Node.js 服务端！" }))
  }
  // 处理 POST 请求（流式接收数据）
  else if (req.method === "POST" && req.url === "/submit") {
    let body = ""
    // 监听 data 事件接收数据块
    req.on("data", (chunk) => {
      body += chunk.toString()
    })
    // 监听 end 事件表示数据接收完毕
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "数据已接收", data: body }))
    })
  }
  // 处理 404
  else {
    res.writeHead(404, { "Content-Type": "text/plain" })
    res.end("404 Not Found")
  }
})

server.listen(3000, "127.0.0.1", () => {
  console.log("服务器运行在 http://127.0.0.1:3000/")
})
```

注意的问题：

- 必须先设置头，再发送体：HTTP 协议规定响应头必须在响应体之前发送。因此，res.setHeader() 或 res.writeHead() 必须在 res.write() 或 res.end() 之前调用，否则会报错或设置无效。
- res.end() 是必须的：如果不手动调用 res.end()，服务器会认为响应尚未完成，客户端的浏览器将一直处于“等待响应”的加载状态。
- 流式处理：req 和 res 都是流（Stream）。在处理大文件上传或下载时，利用 pipe() 管道或监听 data/end 事件进行流式处理，可以极大降低内存占用，这也是 Node.js 高性能的关键所在。

## HTTP 客户端（Client）

Node.js 不仅可以做服务器，还可以作为客户端向其他服务器发起 HTTP 请求。核心方法是 `http.request()` 和它的语法糖 `http.get()`。

### 核心类与方法总结

| 核心对象/方法                     | 类型 | 作用与描述                                                      |
| :-------------------------------- | :--- | :-------------------------------------------------------------- |
| `http.request(options, callback)` | 方法 | 发起任意类型的 HTTP 请求。需要手动调用 `req.end()` 来结束请求。 |
| `http.get(options, callback)`     | 方法 | 专门用于发起 GET 请求，会自动调用 `req.end()`。                 |
| `req.write(data)`                 | 方法 | 向请求体中写入数据块（常用于 POST/PUT 请求）。                  |
| `req.end()`                       | 方法 | 结束请求。极其重要，不调用则请求永远不会被发出。                |

### 客户端代码实战示例

基础 GET 请求：

```javascript
const http = require("http")

http
  .get("http://www.example.com", (res) => {
    let data = ""
    // 监听响应数据的 data 事件
    res.on("data", (chunk) => {
      data += chunk
    })
    // 监听响应结束的 end 事件
    res.on("end", () => {
      console.log("响应结束:", data)
    })
  })
  .on("error", (err) => {
    console.error("请求发生错误:", err.message)
  })
```

带请求体的 POST 请求：

```javascript
const https = require("https") // 如果是 https 地址需引入 https 模块

const postData = JSON.stringify({ title: "测试文章", body: "内容" })

const options = {
  hostname: "jsonplaceholder.typicode.com",
  path: "/posts",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
}

const req = https.request(options, (res) => {
  let response = ""
  res.on("data", (chunk) => {
    response += chunk
  })
  res.on("end", () => {
    console.log("服务器返回:", JSON.parse(response))
  })
})

req.on("error", (e) => {
  console.error("请求错误:", e.message)
})

// 写入请求体并结束请求
req.write(postData)
req.end()
```

### HTTP 客户端的选择

虽然 Node.js 内置的 `http/https` 模块提供了最底层的控制力，但在实际的企业级开发中，为了处理重定向、超时、自动 JSON 解析等复杂场景，我们通常会选择更上层的封装模块或第三方库。以下是常用方案的对比：

| 方案            | 特点与适用场景                                                                |
| :-------------- | :---------------------------------------------------------------------------- |
| 内置 http/https | 零依赖，性能极致，适合底层库开发或资源受限环境，但代码较冗长。                |
| 内置 fetch      | 将浏览器端的 `fetch` API 引入 Node.js，语法简洁，符合 Web 标准。              |
| Axios           | 基于 Promise，自动转换 JSON，支持请求/响应拦截器，是目前最主流的选择。        |
| Got / Undici    | 现代化、高性能的 HTTP 客户端，Undici 更是被官方推荐的高性能 HTTP/1.1 客户端。 |

### Fetch

在现代 Node.js（v18 及以上版本）中，确实已经原生内置了 fetch API，这意味着我们不再需要安装 axios 或 node-fetch 等第三方库，就可以像在前端浏览器中一样直接发起 HTTP 请求。

```js
// 1. 简单的 GET 请求
async function getUserInfo() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users/1")

    // 检查响应状态码是否在 200-299 范围内
    if (!response.ok) {
      throw new Error(`HTTP 错误！状态码: ${response.status}`)
    }

    const data = await response.json()
    console.log("GET 请求成功:", data.name, data.email)
  } catch (error) {
    console.error("GET 请求失败:", error.message)
  }
}

// 2. 带请求头和请求体的 POST 请求
async function createPost() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': 'Bearer your-token-here' // 如果有鉴权需求
      },
      // 注意：fetch 不会自动序列化对象，必须手动使用 JSON.stringify
      body: JSON.stringify({
        title: "Node.js 原生 fetch 测试",
        body: "这是一个使用内置 fetch 发起的 POST 请求",
        userId: 1,
      }),
    })

    const data = await response.json()
    console.log("POST 请求成功:", data)
  } catch (error) {
    console.error("POST 请求失败:", error.message)
  }
}

// 3. 带有超时控制的请求 (使用 AbortSignal)
async function fetchWithTimeout() {
  try {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/posts/1",
      {
        // 设置 500 毫秒超时，模拟请求超时的情况
        signal: AbortSignal.timeout(500),
      },
    )
    const data = await response.json()
    console.log("超时测试请求成功:", data)
  } catch (error) {
    // 如果超时，会抛出名为 'TimeoutError' 的错误
    console.error("请求超时或失败:", error.message)
  }
}

// 执行函数
getUserInfo()
createPost()
fetchWithTimeout()
```

核心要点总结：

- 无需安装：在 Node.js v18+ 环境中，fetch 是全局对象，可以直接使用，无需 require 或 import。
- 请求体序列化：与现代浏览器中的 fetch 一样，在 Node.js 中发送 JSON 数据时，必须手动调用 JSON.stringify() 将对象转为字符串，并设置 Content-Type: application/json 请求头。
- 超时控制：原生 fetch 不支持直接的 timeout 参数。现代 Node.js 提供了非常优雅的 AbortSignal.timeout(ms) 方法来实现超时中断，或者也可以使用 AbortController 进行更复杂的手动取消操作。
- 错误处理：fetch 只有在网络故障或请求被阻止时才会抛出异常（reject）。如果服务器返回了 404 或 500 等错误状态码，fetch 依然会 resolve，因此需要手动通过 response.ok 或 response.status 来判断业务逻辑是否成功。
