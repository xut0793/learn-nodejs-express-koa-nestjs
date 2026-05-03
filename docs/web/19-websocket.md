# WebSocket

## What

WebSocket 为 C/S 架构的客户端和服务端提供了实时交互通信的能力，即支持传统 HTTP 协议中客户端向服务端发送消息的能力，也允许服务器主动发送信息给客户端，是一种区别于 HTTP 的全新双向数据流协议。

> Socket 其实并不是一个标准的协议，而是应用层与 TCP/IP 协议族通信的中间软件抽象层，它是一组接口，工作位置基本在 OSI 模型会话层（第5层），是为了方便大家直接使用更底层协议（一般是 TCP 或 UDP ）而存在的一个抽象层。
>
> 拆文解字：websocket = web + socket。其中 socket 套接字的理解不限于此处的 websocket，也可以是 TCP / UDP，可以按插头理解。将服务端主机想象成一个布满各种插座的房间，每个插座都有一个编号，有的插座提供220伏交流电，有的提供手机直充的直流电，有的提供网络信息的端口。客户端软件通过 socket 套接字插头接入不同编号的插座，就可以得到不同的服务。
> 链接：[WebSocket原理和简单实现](https://github.com/DAC-hahaha/Frontend-LT/issues/13)

## Why

在websocket问世之前，如果需要及时获取服务端消息，比如即时消息，客户端与服务器通常采用http轮询，或Comet等方式保持长链接。

- 短轮询 polling：借助定时器等方式，客户端不断的发送请求并得到响应。这种做法比较简单，可以在一定程度上解决问题。不过对于轮询的时间间隔需要进行仔细考虑。轮询的间隔过长，会导致用户不能及时接收到更新的数据；轮询的间隔过短，会导致查询请求过多，增加服务器端的负担。
- 长轮询 long-polling：这是对短轮询的一种改进。客户端发出请求后，服务器端用 while(true) 等方式阻塞住请求，即暂时不进行响应，直到有可用数据才发送数据进行响应，而客户端收到响应后再发送下一个请求。
- 服务器流数据推送 Comet：相对于轮询请求的“拉 pull”数据，comet 技术基于流方式实现服务器的”推 push"形式，缺点是浪费带宽，cpu占用高。

于是 websocket 便诞生了，它不仅节省资源和带宽，更是能实现长连接作用，只需客户端主动与服务端握手一次，即可进行实时通信，实现推送技术。

WebSocket 在2008年被提出，其通信协议于2011被制定为标准。[websocket RFC6455][https://datatracker.ietf.org/doc/html/rfc6455]，[websocket 协议规范中文](https://websocket.xiniushu.com/)

## How

在实践中提到 websocket 通常包含两部分：通信协议和实现。

- websocket 通信协议
  - 握手的规则，基于 HTTP 的 Upgrade
  - 约定数据传输的方式和负载格式
- websocket 实现
  - 浏览器HTML5提供的 WebSocket 接口
  - 服务端基于协议实现的 websocket service

## websocket 通信协议

WebSocket协议是

这个协议主要包含两部分：

- 握手的规则: 基于HTTP协议的101 switch protocol来达到协议转换的，从HTTP协议切换成WebSocket通信协议。
- 约定数据传输的方式和负载格式: 基于Frame而非Stream的，也就是说，数据的传输不是像传统的流式读写一样按字节发送，而是采用一帧一帧的Frame，并且每个Frame都定义了严格的数据结构，因此所有的信息就在这个Frame载体中。

WebSocket是基于TCP的独立的协议。和HTTP的唯一关联就是HTTP服务器需要发送一个“Upgrade”请求。特点就是：

- 基于TCP协议
- 可以和HTTP Server共享同一port：与 HTTP 协议有着良好的兼容性。默认端口也是 80 和 443，并且握手阶段采用 HTTP 协议，因此握手时不容易被屏蔽，能通过各种 HTTP 代理服务器。
- 较少的控制开销：在连接创建后，服务器和客户端之间交换数据时，用于协议控制的数据包头部相对较小。在不包含扩展的情况下，对于服务器到客户端的内容，此头部大小只有2至10字节（和数据包长度有关）；对于客户端到服务器的内容，此头部还需要加上额外的4字节的掩码。相对于 HTTP 请求每次都要携带完整的头部，此项开销显著减少了。
- 更强的实时性：由于协议是全双工的，所以服务器可以随时主动给客户端下发数据。相对于HTTP请求需要等待客户端发起请求服务端才能响应，延迟明显更少；
- 长连接：与HTTP不同的是，Websocket需要先创建连接，这就使得其成为一种有状态的协议，之后通信时可以省略部分状态信息。而HTTP请求可能需要在每个请求都携带状态信息（如身份认证等）。
- 双向通信
- 更好的二进制支持

### 打开连接：握手

websocket 建立连接的第一步：握手。基本流程如下：

客户端代码在 `new WebSocket(url)` 时，浏览器会主动发起一个 HTTP 请求，必须包含几个特定的请求头字段：

- Upgrade: 这个请求头包含“Upgrade”字段，内容为“websocket”（upgrade字段用于说明转换 HTTP协议 到 websocket协议）
- Sec-WebSocket-Key: 这是一个随机的经过base64编码的字符串，像密钥一样用于服务器和客户端的握手过程。一旦服务器君接收到来自客户端的upgrade请求，便会将请求头中的“Sec-WebSocket-Key”字段提取出来，追加一个固定的“魔串”：258EAFA5-E914-47DA-95CA-C5AB0DC85B11，并进行SHA-1加密，然后再次经过base64编码生成一个新的key，作为响应头中的“Sec-WebSocket-Accept”字段的内容返回给浏览器。一旦浏览器接收到来自服务器的响应，便会解析响应中的“Sec-WebSocket-Accept”字段，与自己加密编码后的串进行匹配，一旦匹配成功，便有建立连接的可能了（因为还依赖许多其他因素）。
- Origin: 用来指明请求的来源，Origin头部主要用于保护Websocket服务器免受非授权的跨域脚本调用Websocket API的请求。也就是不想没被授权的跨域访问与服务器建立连接，服务器可以通过这个字段来判断来源的域并有选择的拒绝。

```sh
# 关键的请求头字段
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: ************==
Sec-WebSocket-Version: **
Origin: www.example.com

# 关键的响应头字段
Upgrade：websocket
Connnection: Upgrade
Sec-WebSocket-Accept: ******************
```

示例代码

```js
var http = require("http")
var crypto = require("crypto")

var MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

// HTTP服务器部分
var server = http.createServer(function (req, res) {
  res.end("websocket test\r\n")
})

// Upgrade 事件监听
server.on("upgrade", callback)

function callback(req, socket) {
  // 计算返回的key
  var resKey = crypto
    .createHash("sha1")
    .update(req.headers["sec-websocket-key"] + MAGIC_STRING)
    .digest("base64")

  // 构造响应头
  resHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    "Sec-WebSocket-Accept: " + resKey,
  ]
    .concat("", "")
    .join("\r\n")

  // socket 就是 TCP 协议的抽象，直接在上面监听已有的 data 事件和 close 事件这两个事件。
  socket.on("data", function (data) {
    // 添加通信数据处理
  })

  // 响应给客户端
  socket.write(resHeaders)
}

server.listen(3000)
```

上面的代码是等待客户端与之握手，当有客户端发出请求时，会按照“加密-编码-返回”的流程与之建立通信通道。既然连接已建立，接下来就是双方的通信了。

### 数据帧 Frame

客户端与服务器之间互相传输数据的的基本单位根据规格说明书里称为“Messages”。在实际网络中，这些Message由一个或多个Frame 帧的形式组成，就像TCP/UDP协议中的报文段Segment。

下面就是一帧 Frame 的格式，以 bit 为单位表示。

```
  0                   1                   2                   3
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-------+-+-------------+-------------------------------+
 |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 | |1|2|3|       |K|             |                               |
 +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 |     Extended payload length continued, if payload len == 127  |
 + - - - - - - - - - - - - - - - +-------------------------------+
 |                               |Masking-key, if MASK set to 1  |
 +-------------------------------+-------------------------------+
 | Masking-key (continued)       |          Payload Data         |
 +-------------------------------- - - - - - - - - - - - - - - - +
 :                     Payload Data continued ...                :
 + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 |                     Payload Data continued ...                |
 +---------------------------------------------------------------+

```

- FIN: 1bit，表示这是一个消息的最后的一帧。第一个帧也可能是最后一个。 %x0 还有后续帧，%x1 最后一帧。
- RSV1/2/3: 1bit each，除非一个扩展经过协商赋予了非零值以某种含义，否则必须为0，如果没有定义非零值，并且收到了非零的RSV，则websocket链接会失败。
- Opcode: 4bit，说明 “Payload data” 的用途/功能，如果收到了未知的opcode，最后会断开链接。定义了以下几个opcode值:
  - %x0 : 代表连续的帧
  - %x1 : text帧
  - %x2 ： binary帧
  - %x3-7 ： 为非控制帧而预留的
  - %x8 ： 关闭握手帧
  - %x9 ： ping帧
  - %xA : pong帧
  - %xB-F ： 为非控制帧而预留的
- Mask: 1bit，定义“payload data”是否被添加掩码，如果置1， “Masking-key”就会被赋值，所有从客户端发往服务器的帧都会被置1。
- Payload length： 7 bit | 7+16 bit | 7+64 bit。“payload data” 的长度如果在0~125 bytes范围内，它就是“payload length”，如果是126 bytes， 紧随其后的被表示为16 bits的2 bytes无符号整型就是“payload length”，如果是127 bytes， 紧随其后的被表示为64 bits的8 bytes无符号整型就是“payload length”。
- Masking-key： 0 or 4 bytes，所有从客户端发送到服务器的帧都包含一个32 bits的掩码（如果“mask bit”被设置成1），否则为0 bit。一旦掩码被设置，所有接收到的payload data都必须与该值以一种算法做异或运算来获取真实值。
- Payload data: (x+y) bytes，它是"Extension data"和"Application data"的总和，一般扩展数据为空。
- Extension data: x bytes，除非扩展被定义，否则就是0，任何扩展必须指定其Extension data的长度。
- Application data: y bytes，占据"Extension data"之后的剩余帧的空间。

以上这些数据都是以二进制形式表示的，而非ascii编码字符串。

对于 Frame 帖数据的构造和传输（发送和接收），参考以下链接：

- [学习WebSocket协议—从顶层到底层的实现原理（修订版）](https://github.com/abbshr/abbshr.github.io/issues/22)
- [WebSocket原理及简单实现](https://github.com/DAC-hahaha/Frontend-LT/issues/13)
- [MDN 编写 WebSocket 服务器](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)

## websocket 实践

### 浏览器 WebSocket

HTML5提供了 WebSocket 对象用于创建和管理 websocket 连接。

`const ws = new WebSocket(url[, sub_protocols])`

- url: 要连接的 URL；这应该是 WebSocket 服务器将响应的 URL。
- protocols: 可选，一个协议字符串或者一个包含协议字符串的数组。这些字符串用于指定子协议，这样单个服务器可以实现多个 WebSocket 子协议（例如，你可能希望一台服务器能够根据指定的协议（protocol）处理不同类型的交互）。如果不指定协议字符串，则假定为空字符串。

属性

- ws.url
- ws.protocol
- ws.readyState：当前连接状态 0 CONNECTING / 1 OPEN / 2 CLOSING / 3 CLOSED。

方法

- ws.close([code[, reason]]): 关闭当前连接。
  - 入参 code 一个数字状态码，它解释了连接关闭的原因。可以在 close 事件对象中获取。如果没有传这个参数，默认使用 1005，类似 HTTP statusCode ，具体的 code 编码见 [CloseEvent](https://developer.mozilla.org/zh-CN/docs/Web/API/CloseEvent)
  - reason 一个人类可读的字符串，它解释了连接关闭的原因。这个 UTF-8 编码的字符串不能超过 123 个字节。
- ws.send(data)：向服务端发送数据

事件

使用 addEventListener(eventName, cb) 或将一个事件监听器赋值给本接口的 oneventname 属性，

- open: 当一个 WebSocket 连接成功时触发。
- close: 当一个 WebSocket 连接被关闭时触发。
- error: 当一个 WebSocket 连接因错误而关闭时触发，例如无法发送数据时。
- message: 当通过 WebSocket 收到数据时触发。

简单示例

```js
// 客户端
var ws = new WebSocket('ws://localhost:9000/ws'); // ➊
ws.onerror = function (error) { ... } // ➋
ws.onclose = function () { ... } // ➌
ws.onopen = function () { // ➍
ws.send("Connection established. Hello server!"); // ➎
}
ws.onmessage = function(msg) { // ➏
  processText(msg.data);
}

// 1. 打开新的安全 WebSocket 连接(wss)
// 2. 可选的回调，在连接出错时调用
// 3. 可选的回调，在连接终止时调用
// 4. 可选的回调，在 WebSocket 连接建立时调用
// 5. 客户端先向服务器发送一条消息
// 6. 回调函数，服务器每发回一条消息就调用一次
```

### Node ws

在 node 端，有很多实现 websocket 通信协议的依赖包，较为广泛使用的有 ws / socket.io 等。

- ws 只提供 node 环境使用，可分别作为服务端和客户端。突出特点是性能较好，连接速度快。如果要在浏览器端使用相同代码，可以使用其它包装器的包，比如 isomorphic-ws。
- socket.io 支持node环境使用，也提供了浏览器中 WebSocket 对象的封装，在浏览器中作为客户端使用，对浏览器低版本不存在 WebSocket 对象时，会自动下降为长轮询方式提供服务。并且支持命名空间（类似房间的概念）功能，支持自定义事件 。

ws 和 socket.io 都可以单独作为 websocket 服务器，也可以集成到 express 等框架中，同时提供 web 和 websocket 服务的应用中。

[ws](https://github.com/websockets/ws/blob/HEAD/doc/ws.md)
[Socket.IO](https://socket.io/zh-CN/)

这里以 ws 包使用示例

#### ws 的客户端 WebSocket

客户端连接，如果在浏览器环境中可以使用 HTML5 提供的原生 WebSocket 对象。但如果是 nodejs 环境中，某个服务作为客户端调用，可以直接使用 ws 开启客户端连接。

```js
import WebSocket from "ws"

const ws = new WebSocket("ws://localhost:9000/ws")

ws.on("error", console.error)

ws.on("open", function open() {
  ws.send("something")
})

ws.on("message", function message(data) {
  console.log("received: %s", data)
})
```

`new WebSocket(address[, protocols][, options])` 形参：

- address {字符串|url.URL} 要连接到的 URL。
- protocols {字符串|Array} 子协议列表。
- options
  - autoPong {Boolean} 指定是否自动发送 pong 以响应 ping。默认值为 true。根据规范，当接收到Ping消息后Pong响应消息会自动发送。
  - allowSynchronousEvents {Boolean} 指定是否可以在同一刻度中多次发出任何 'message'、'ping' 和 'pong' 事件。为了提高与 WHATWG 标准的兼容性，默认值为 false。将其设置为 true 可略微提高性能。
  - finishRequest {Function} 一个函数，可用于在发送每个 HTTP 请求之前自定义其标头。请参阅下面的说明。
  - followRedirects {Boolean} 是否遵循重定向。默认值为 false。
  - generateMask {Function} 用于生成掩码键的函数。它需要一个 Buffer，该 Buffer 必须同步填充，并在发送消息之前为每条消息调用。默认情况下，缓冲区填充加密强度强的随机字节。
  - handshakeTimeout {Number} 握手请求的超时（以毫秒为单位）。每次重定向后都会重置此功能。
  - maxPayload {Number} 允许的最大消息大小（以字节为单位）。默认值为 100 MiB（104857600 字节）。
  - maxRedirects {Number} 允许的最大重定向数。默认值为 10。
  - origin {String} Origin 或 Sec-WebSocket-Origin 标头的值，具体取决于 protocolVersion。
  - perMessageDeflate {布尔|Object} 启用/禁用 permessage-deflate。
  - protocolVersion {Number} Sec-WebSocket-Version 标头的值。
  - skipUTF8Validation {Boolean} 指定是否跳过文本消息和关闭消息的 UTF-8 验证。默认值为 false。仅当服务器受信任时，才设置为 true。

#### 服务端 WebSocketServer

```js
// 开启 ws 服务端
import { WebSocketServer } from "ws"

const wss = new WebSocketServer({ port: 9000, path: "/ws" })

wss.on("connection", function connection(ws) {
  ws.on("error", console.error)

  ws.on("message", function message(data) {
    console.log("received: %s", data)
  })

  ws.send("something")
})
```

`new WebSocketServer(options)`中的选项对象：

- host {String} 要绑定服务器的主机名。
- port {Number} 要绑定服务器的端口。
- path {String} 仅接受与此路径匹配的连接。
- server {http.服务器|https。Server} 预先创建的 Node.js HTTP/S 服务器。
- noServer {Boolean} 不启用服务器模式。
- autoPong {Boolean} 指定是否自动发送 pong 以响应 ping。默认值为 true。
- handleProtocols {Function} 可用于处理 WebSocket 子协议的函数。
- allowSynchronousEvents {Boolean} 指定是否可以在同一刻度中多次发出任何 'message'、'ping' 和 'pong' 事件。为了提高与 WHATWG 标准的兼容性，默认值为 false。将其设置为 true 可略微提高性能。
- backlog {Number} 挂起连接队列的最大长度。
- clientTracking {Boolean} 指定是否跟踪客户端。
- maxPayload {Number} 允许的最大消息大小（以字节为单位）。默认值为 100 MiB（104857600 字节）。
- perMessageDeflate {布尔|Object} 启用/禁用 permessage-deflate。
- skipUTF8Validation {Boolean} 指定是否跳过文本消息和关闭消息的 UTF-8 验证。默认值为 false。仅当客户端受信任时，才设置为 true。
- verifyClient {Function} 可用于验证传入连接的函数。请参阅下面的说明。（不建议使用：请参阅问题 [#337](https://github.com/websockets/ws/issues/377#issuecomment-462152231)）
- WebSocket {Function} 指定要使用的 WebSocket 类。它必须从原来的WebSocket扩展而来。默认值为 WebSocket。

创建新的服务器实例，必须提供 port、server 或 noServer 中的一个，否则会引发错误。
如果设置了 port，则会自动创建、启动和使用 HTTP 服务器。
若要改用外部 HTTP/S 服务器，请仅指定 server 或 noServer。在这种情况下，必须手动启动 HTTP/S 服务器。
“noServer”模式允许 WebSocket 服务器与 HTTP/S 服务器完全分离。例如，这使得在多个 WebSocket 服务器之间共享同一个 HTTP/S 服务器成为可能。

比如，websocket 与 http server 集成使用。

```js
import { createServer } from "https"
import { WebSocketServer } from "ws"

const server = createServer()
const wss = new WebSocketServer({ server })

wss.on("connection", function connection(ws) {
  ws.on("error", console.error)

  ws.on("message", function message(data) {
    console.log("received: %s", data)
  })

  ws.send("something")
})

server.listen(8080)
```

多个 websocket 服务共享一个 HTTP 服务。

```js
import { createServer } from "http"
import { parse } from "url"
import { WebSocketServer } from "ws"

const server = createServer()
const wss1 = new WebSocketServer({ noServer: true })
const wss2 = new WebSocketServer({ noServer: true })

wss1.on("connection", function connection(ws) {
  ws.on("error", console.error)
  // ...
})

wss2.on("connection", function connection(ws) {
  ws.on("error", console.error)
  // ...
})

server.on("upgrade", function upgrade(request, socket, head) {
  const { pathname } = parse(request.url)

  if (pathname === "/foo") {
    wss1.handleUpgrade(request, socket, head, function done(ws) {
      wss1.emit("connection", ws, request)
    })
  } else if (pathname === "/bar") {
    wss2.handleUpgrade(request, socket, head, function done(ws) {
      wss2.emit("connection", ws, request)
    })
  } else {
    socket.destroy()
  }
})

server.listen(8080)
```

#### 认证

身份认证都是发生在握手阶段，因为是基于 HTTP 请求，所以可以通过客户端在请求 url 中附带认证的参数。比如淘宝的直播弹幕也是用这种方式做的身份认证 `ws://acs.m.taobao.com/accs/auth?token=AAewitad3...`。

在 ws 模块中，创建 Websocket 服务时，提供了 verifyClient 参数，用于编写认证逻辑，但此种方式已不被推荐。

```js
const wss = new WebSocket.Server({
  host: SystemConfig.WEBSOCKET_server_host,
  port: SystemConfig.WEBSOCKET_server_port,
  // 验证token识别身份
  verifyClient: (info) => {
    const token = url.parse(info.req.url, true).query.token
    let user
    console.log("[verifyClient] start validate")
    // 如果token过期会爆TokenExpiredError
    if (token) {
      try {
        user = jwt.verify(token, publicKey)
        console.log(`[verifyClient] user ${user.name} logined`)
      } catch (e) {
        console.log("[verifyClient] token expired")
        return false
      }
    }
    // verify token and parse user object
    if (user) {
      info.req.user = user
      return true
    } else {
      info.req.user = {
        name: `游客${parseInt(Math.random() * 1000000)}`,
        mail: "",
      }
      return true
    }
  },
})
```

ws/websocket-server 源码位置

```js
// ...
if (this.options.verifyClient) {
  const info = {
    origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
    secure: !!(req.connection.authorized || req.connection.encrypted),
    req,
  }

  if (this.options.verifyClient.length === 2) {
    this.options.verifyClient(info, (verified, code, message) => {
      if (!verified) return abortHandshake(socket, code || 401, message)
      this.completeUpgrade(extensions, req, socket, head, cb)
    })
    return
  }

  if (!this.options.verifyClient(info)) return abortHandshake(socket, 401)
}

this.completeUpgrade(extensions, req, socket, head, cb)
```

但在 ws 仓库中，verifyClient 的方式已不被推荐，讨论见 [issue#337](https://github.com/websockets/ws/issues/377#issuecomment-462152231)，主要原因在于对异步支持不友好，作为自已认为这是技术债，更推荐 noServer 的方式，这样验证逻辑的自主权更大。

下面示例是 ws 服务端结合 express 和 session 的验证逻辑。

```js
const session = require("express-session")
const express = require("express")
const http = require("http")
const uuid = require("uuid")
const { WebSocketServer } = require("ws")

function onSocketError(err) {
  console.error(err)
}

const app = express()
const map = new Map() // webSocketServer 关闭了客户端追踪，改为自行管理

const sessionParser = session({
  saveUninitialized: false,
  secret: "$eCuRiTy",
  resave: false,
})

app.use(express.static("public"))
app.use(sessionParser)

app.post("/login", function (req, res) {
  //
  // "Log in" user and set userId to session.
  //
  const id = uuid.v4()

  console.log(`Updating session for user ${id}`)
  req.session.userId = id
  res.send({ result: "OK", message: "Session updated" })
})

app.get("/logout", function (request, response) {
  const ws = map.get(request.session.userId)

  console.log("Destroying session")
  request.session.destroy(function () {
    if (ws) ws.close()

    response.send({ result: "OK", message: "Session destroyed" })
  })
})

// Create an HTTP server.
const server = http.createServer(app)

// Create a WebSocket server completely detached from the HTTP server.
const wss = new WebSocketServer({ clientTracking: false, noServer: true })

server.on("upgrade", function (request, socket, head) {
  socket.on("error", onSocketError)

  console.log("Parsing session from request...")

  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
      socket.destroy()
      return
    }

    console.log("Session is parsed!")

    socket.removeListener("error", onSocketError)

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit("connection", ws, request)
    })
  })
})

wss.on("connection", function (ws, request) {
  const userId = request.session.userId

  map.set(userId, ws)

  ws.on("error", console.error)

  ws.on("message", function (message) {
    // Here we can now use session parameters.
    console.log(`Received message ${message} from user ${userId}`)
  })

  ws.on("close", function () {
    map.delete(userId)
  })
})

// Start the server.
server.listen(8080, function () {
  console.log("Listening on http://localhost:8080")
})
```

#### 心跳检测

有时，服务器和客户端之间的链接可能会中断，使服务器和客户端都不知道连接的中断状态，在这些情况下，可以使用 ping 消息来验证远程终结点是否仍具有响应性。

```js
import { WebSocketServer } from "ws"

function heartbeat() {
  this.isAlive = true
}

const wss = new WebSocketServer({ port: 8080 })

wss.on("connection", function connection(ws) {
  ws.isAlive = true
  ws.on("error", console.error)
  // 服务端监控客户端自动响应的 pong 事件
  ws.on("pong", heartbeat)
})

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate()

    ws.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on("close", function close() {
  clearInterval(interval)
})
```

根据规范，接收端当接收到Ping消息后Pong响应消息会自动发送，无需手动发送消息。对应客户端代码可以监听 ping 事件，如果长时间未通信，直接结束连接。

```js
import WebSocket from "ws"

let pingTimer

function heartbeat() {
  clearTimeout(pingTimer)

  //使用' WebSocket#terminate() '，立即终止连接; 而不是' WebSocket#close() '，它会等待关闭定时器。
  //延迟应该等于你的服务器的时间间隔，发送ping加上一个保守的延迟假设。
  pingTimer = setTimeout(() => {
    this.terminate()
  }, 30000 + 1000)
}

const client = new WebSocket("ws://example.com/")

client.on("error", console.error)
client.on("open", heartbeat)
client.on("ping", heartbeat)
client.on("close", function clear() {
  clearTimeout(pingTimer)
})
```

#### 消息广播

如果创建服务器实例时，`clientTracking: true` 默认值 true 未改变。则可以通过 wss.clients 获取到所有连接的客户端，遍历向其广播消息。

```js
import WebSocket, { WebSocketServer } from "ws"
const wss = new WebSocketServer({ port: 8080 })

// 向所有连接的 WebSocket 客户端（包括其自身）广播消息。
wss.on("connection", function connection(ws) {
  ws.on("error", console.error)

  ws.on("message", function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary })
      }
    })
  })
})

// 排除自己
wss.on("connection", function connection(ws) {
  ws.on("error", console.error)

  ws.on("message", function message(data, isBinary) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary })
      }
    })
  })
})
```

也可以通过创建实例时，设置 `clientTracking: false`，然后自己通过连接池管理客户端，这样广播的业务逻辑自主性更强，比如针对某个客户端埋广播等操作。具体见上面验证中 express-session 的示例。

### nestjs 实践 websocket

nestjs 中实现 websocket 功能代码逻辑称为网关，它就是一个通过 @nestjs/websockets 包提供的 @WebSocketGateway() 装饰器注释的类。nestjs 抽象了 websocket 实现的接口，使它可以与 WebSocket 通信协议的具体实现无关，也就是说 nestjs 同时支持 ws 和 socket.io，或者其它符合 WebSocketAdapter 适配器接口的实现库。

这里以 ws 为例，安装依赖

```sh
pnpm add @nestjs/websokets @nestjs/platform-ws
```

注册 ws 适配器。

```ts
// main.ts
import { WsAdapter } from "@nestjs/platform-ws"

const app = await NestFactory.create<NestExpressApplication>(AppModule)
app.useWebSocketAdapter(new WsAdapter(app))
```

创建一个模块 `nest g mo ws`和网关 `nest g ga ws`

使用 `@WebSocketGateway` 装饰器创建 WebSocket 网关类。它充当 WebSocket 服务的中间人，负责处理客户端发起的连接请求，并定义处理不同类型消息订阅和广播。

```ts
// ws.gateway.ts
import { WebSocketGateway } from "@nestjs/websockets"

@WebSocketGateway()
export class wsGateway {
  // ...
}
```

装饰器 `@WebSocketGateway(80, options)`的入参：

- 端口号，如果不传默认和 http 服务的端口一样，也可以传入一个区别于 HTTP 端口的新端口号。
- options 配置对象，具体与实现平台的库有关。

然后在模块中注册。网关可以被视为provider,可以注入依赖项,也可以被其他类注入。

```ts
import { Module } from "@nestjs/common"
import { wsGateway } from "./ws.gateway"
@Module({
  providers: [wsGateway],
})
export class wsModule {}
```

#### 订阅消息

nestjs 提供装饰器 `@SubscribeMessage`，来监听客户端发送的消息。

```ts
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets"

@WebSocketGateway({ cors: { origin: "*" } })
export class WsGateway {
  @SubscribeMessage("message")
  handleMessage(@MessageBody() body: any) {
    console.log(body)
  }
}
```

`@SubscribeMessage(eventName)` 装饰器传入需要监听事件名称。默认 message 事件。这里需要注意的是，如果浏览器端使用原生的 WebSocket 向服务端发送消息，需要保持 `{event: eventName, data}` 的 JSON 字符串形式，这样 nestjs 中 SubscribeMessage 订阅的事件才会触发，并且 MessageBody 获取的 body 才是 data 中的值。

```js
// 浏览器 Websocket 以 { event, data } 格式发送
this.ws.send(JSON.stringify({ event: "custom_event", data }))
```

通过 `@MessageBody` 装饰器可以获取消息数据。如果不使用装饰器，需要通过监听处理函数的第二个参数获取数据。

```ts
@SubscribeMessage('message')
handleEvent(client: Socket, data: any): any {
  return data;
}
```

第一个参数是socket实例，第二个data是从客户端接受的消息，但是官方不推荐这种写法哈，因为它需要在每个单元测试中模拟 socket 实例。

#### 发布消息

`@SubscribeMessage(eventName)` 装饰器修饰的处理函数，如果有返回值，会默认响应给客户端，客户端监听 'message’ 事件接收响应。如果没有 return 语句或直接 return 空值，则不回应客户端，仅作接收消息。

如果需要响应客户端监听的对应事件，可以返回同样的 `{event: EventName, data}` 格式，然后客户端监听对应事件。这个针对同是node环境下的 ws 客户端而言。对浏览器端原生的 WebSocket 无用，需要自行从 data 数据中解析事件进行对应处理。

nestjs 提供装饰器 `@ConnectedSocket` 获取 websocket 连接的 socket 套接字对象，调用它的 emit 方法向客户端发送消息。

```ts
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets"
import type { WebSocket } from "ws"

@WebSocketGateway({ cors: { origin: "*" } })
export class WsGateway {
  @SubscribeMessage("message")
  handleMessage(
    @MessageBody() body: any,
    @ConnectedSocket() client: WebSocket
  ) {
    client.emit("message")
    console.log(body)
  }
}
```

同上面一样，如果监听函数的实参不用装饰器获取，第一参数就是 socket 对象，同样可以调用 emit 方法。但是这样触发响应，无法利用 Nestjs 自身的响应流程，比如拦截器和过滤器等。

```ts
@SubscribeMessage('getClient')
  getClient(client: WebSocket, data: string) {
    client.emit('message')
  }
```

另一种方法，可以通过 `@WebSocketServer` 装饰，获取 websocket 服务的实例对象。

```ts
// ws.gateway.ts
@WebSocketGateway()
export class WSGateway {
  @WebSocketServer()
  server: Server

  @SubscribeMessage("message")
  handleMessage(
    @MessageBody() body: any,
    @ConnectedSocket() client: WebSocket
  ) {
    // 向自己之外的其它客户端广播消息
    this.server.clients.forEach((socket) => {
      if (socket === client) return

      socket.emit("message", JSON.stringify(body))
    })
  }
}
```

#### 作为 provider 提供其它服务使用

```ts
import { WsGateway } from "./ws.gateway"

@Controller("user")
export class UserController {
  constructor(private readonly ws: WsGateway) {}

  @Delete(":id")
  deleteUser(@Param("id") id: string) {
    // 如果实现的是 ws 服务，则需要通过 this.ws.server.clients 拿到所有连接逐个触发。 clients 是一个 Set 对象。
    if (this.ws.server.clients.size === 0) {
      console.log("暂无客户端建立链接 >>>")
    } else {
      this.ws.server.clients.forEach((socket) => {
        socket.emit("message", `用户 ${id} 已被删除`)
      })
    }
  }
}
```

## 参考链接

[websocket 协议规范](https://websockets.spec.whatwg.org/#the-websocket-interface)
[websocket 协议规范中文](https://websocket.xiniushu.com/)
[ws](https://github.com/websockets/ws/blob/HEAD/doc/ws.md)
[Socket.IO](https://socket.io/zh-CN/)
[CloseEvent](https://developer.mozilla.org/zh-CN/docs/Web/API/CloseEvent)
[verifyClient 的方式已不被推荐，讨论见 issue#337](https://github.com/websockets/ws/issues/377#issuecomment-462152231)
[学习WebSocket协议—从顶层到底层的实现原理（修订版）](https://github.com/abbshr/abbshr.github.io/issues/22)
[WebSocket原理及简单实现](https://github.com/DAC-hahaha/Frontend-LT/issues/13)
[MDN 编写 WebSocket 服务器](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)
