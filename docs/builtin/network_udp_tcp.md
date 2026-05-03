# TCP / UDP

TCP / UDP 是实现计算机网络的核心协议，位于传输层层（Transport Layer），负责信息数据的传输。

## UDP

UDP (User Datagram Protocol) 一种无连接、不可靠但高效的传输层协议。它就像寄信，只管发出，不保证对方一定能收到，也不保证收到的顺序。

核心特性

- 无连接：发送数据前无需建立连接（无三次握手），直接发送，延迟极低。
- 不可靠：不保证数据包的送达、顺序，也无重传机制。如果数据包丢失或损坏，UDP协议本身不会处理。
- 面向数据报：保留应用层消息的边界。发送方调用一次sendto()，接收方就必须用一次recvfrom()来完整接收，否则数据可能被截断或丢弃。
- 开销小：协议头部固定为8字节，比TCP的20字节以上要小得多，传输效率高。
- 支持广播/多播：可以向网络中的多个或所有主机同时发送数据。
- 64KB限制：单个UDP数据报的最大长度为65535字节（包括8字节头部），实际可用数据约为64KB。传输更大数据需要在应用层手动分片。
- 可靠性需自行实现：如果业务需要可靠性，必须在应用层自行添加序列号、确认应答(ACK)和超时重传等机制。

## TCP

TCP (Transmission Control Protocol) 一种面向连接、可靠的、基于字节流的传输层协议。它就像打电话，通信前必须先建立连接，并保证通话内容准确无误地传达。

核心特性：

- 面向连接：通信前必须通过“三次握手”建立连接，通信结束后通过“四次挥手”断开连接。
- 可靠传输：通过序列号、确认应答(ACK)、超时重传等机制，确保数据无差错、不丢失、不重复且按序到达。
- 面向字节流：不保留应用层消息边界。发送方多次发送的数据，接收方可能一次性读取；反之，一次发送的大数据，接收方也可能分多次读取。这会导致“粘包”和“拆包”问题。
- 流量控制与拥塞控制：通过滑动窗口机制，防止发送方淹没接收方，并根据网络状况调整发送速率。

### 三次握手 (建立连接)：

客户端 -> 服务器 (SYN)：客户端发送一个SYN包，请求建立连接。
服务器 -> 客户端 (SYN+ACK)：服务器收到请求后，回复一个SYN+ACK包，表示同意建立连接。
客户端 -> 服务器 (ACK)：客户端收到服务器的同意后，再发送一个ACK包进行确认。至此，连接建立成功。

### 四次挥手 (断开连接)：

客户端 -> 服务器 (FIN)：客户端发送FIN包，表示数据已发送完毕，请求关闭连接。
服务器 -> 客户端 (ACK)：服务器收到FIN后，先回复一个ACK包进行确认。此时，服务器可能还有数据要发送。
服务器 -> 客户端 (FIN)：服务器数据发送完毕后，也发送一个FIN包，请求关闭连接。
客户端 -> 服务器 (ACK)：客户端收到服务器的FIN后，回复ACK包进行确认。连接正式关闭。

## Socket

Socket 就是网络通信的“插座”，应用程序（微信、浏览器等）装到电脑上，需要通过这个“插座”与操作系统的网络连接，就好比房子（操作系统）买了个家电（应用程序）需要插上电才能正常工作一样。

从本质上讲，Socket 是应用层与 TCP/IP 协议族通信的中间抽象层，表现为一组编程接口（API）。它屏蔽了底层网络硬件和协议（如三次握手、数据包分片）的复杂实现，为程序员提供了一个统一的接口来发送和接收数据。

- 进程间通信（IPC）：它不仅支持不同计算机（跨网络）的进程通信，也支持同一台计算机内部的进程通信（如 Unix 域套接字）。
- 数据传输的桥梁：它是应用程序（如 Python 代码）与操作系统内核（网络协议栈）之间的桥梁。应用层通过 Socket 将数据写入内核缓冲区，由操作系统负责将数据发送到网络。
- 抽象与解耦：它让开发者无需关心数据是如何在光纤、路由器之间传输的，只需关注“发给谁”和“发什么”。

形象类比：如果把网络通信比作打电话，IP 地址相当于“对方的电话号码”，端口号相当于“分机号”，而 Socket 就是你手中的“电话机”。你不需要知道电话线内部是如何传输信号的（底层协议细节），只需要拿起电话（调用 Socket 接口）说话（发送数据）即可。

一个 Socket 由 IP 地址 和 端口号 唯一标识，`Socket = (IP地址 : 端口号)`。

TCP 像打电话，连接建立后双方直接通过“流”对话，代码中不需要关心对方的 IP 和端口。
UDP 像寄信，每次发送数据（`socket.send`）时，都必须用 `DatagramPacket` 明确指定对方的 IP 和端口。

## UDP

在 nodejs 中提供 `dgram` 模块，用于 UDP 通信。

| 核心类/方法                                                   | 描述                                                            |
| ------------------------------------------------------------- | --------------------------------------------------------------- |
| `dgram.createSocket(type[, callback])`                        | 创建 UDP 套接字，`type` 为 `'udp4'` 或 `'udp6'`。               |
| `socket.bind(port[, address][, callback])`                    | 将套接字绑定到指定端口和地址，开始监听数据。                    |
| `socket.send(msg, offset, length, port, address[, callback])` | 向指定目标端口和地址发送数据报。                                |
| `socket.close()`                                              | 关闭套接字，停止监听。                                          |
| `socket.setBroadcast(flag)`                                   | 设置或清除 `SO_BROADCAST` 套接字选项，用于开启广播。            |
| `socket.address()`                                            | 返回套接字地址信息，包含 `address`、`family`、`port` 三个属性。 |

socket 对象的事件：

| 事件名      | 触发时机                                            |
| ----------- | --------------------------------------------------- |
| `message`   | 接收到新的数据报时触发，回调参数为 `(msg, rinfo)`。 |
| `listening` | 套接字开始监听数据报消息时触发。                    |
| `error`     | 发生错误时触发。                                    |
| `close`     | 套接字通过 `close()` 关闭后触发。                   |

message 事件参数

- msg: Buffer 实例，包含数据报中的数据。
- rinfo: Object
  - address: string 套接字地址。
  - family: string 套接字地址族 'IPv4' 或 'IPv6'。
  - port: number 套接字端口。
  - size: number 数据报中的字节数。

1. UDP 接收端/服务端 (udp-server.js)

```js
import dgram from "node:dgram"

// 创建 UDP 套接字
const server = dgram.createSocket("udp4")

// 监听数据报
server.on("message", (msg, rinfo) => {
  console.log(`收到来自 ${rinfo.address}:${rinfo.port} 的消息: ${msg}`)
  // 向客户端回发消息
  server.send("服务器已收到消息", rinfo.port, rinfo.address)
})

server.on("listening", () => {
  const address = server.address()
  console.log(`UDP 服务器正在监听 ${address.address}:${address.port}`)
})

server.on("error", (err) => {
  console.error(`服务器发生错误:\n${err.stack}`)
  server.close()
})

// 绑定 4000 端口
server.bind(4000)
```

1. UDP 发送端/客户端 (udp-client.js)

```js
import dgram from "node:dgram"

const client = dgram.createSocket("udp4")
const message = Buffer.from("Hello, UDP Server!")

// 发送消息到服务器
client.send(message, 4000, "localhost", (err) => {
  if (err) {
    console.error("发送失败:", err)
  } else {
    console.log("消息已发送")
  }
})

// 接收服务器回传的消息
client.on("message", (msg, rinfo) => {
  console.log(`收到服务器回信: ${msg} 来自 ${rinfo.address}:${rinfo.port}`)
  client.close() // 接收完毕后关闭套接字
})

client.on("error", (err) => {
  console.error("客户端发生错误:", err)
})
```

## TCP

nodejs 中提供 `net` 模块，处理 TCP 通信。

| 核心类/方法                                         | 描述                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| `net.createServer([options][, connectionListener])` | 创建一个新的 TCP 服务器。                      |
| `net.createConnection(options[, connectListener])`  | 创建一个新的 TCP 客户端并连接到指定服务器。    |
| `server.listen(port[, host][, callback])`           | 启动服务器，监听指定端口和主机。               |
| `socket.write(data[, encoding][, callback])`        | 在套接字上发送数据。                           |
| `socket.end([data][, encoding][, callback])`        | 半关闭套接字，允许发送完缓冲区数据后断开连接。 |
| `socket.destroy([error])`                           | 确保此套接字上不再有 I/O 活动，立即销毁连接。  |

监听的事件

| 事件名       | 触发时机                                      |
| ------------ | --------------------------------------------- |
| `connection` | 当新连接建立时触发（服务器端）。              |
| `data`       | 当接收到数据时触发。                          |
| `end`        | 当连接的另一端发送 FIN 包（结束发送）时触发。 |
| `error`      | 发生错误时触发。                              |
| `close`      | 当连接完全关闭时触发。                        |

以下是一个经典的“客户端发一个消息，服务端回一个消息”的示例：

1. TCP 服务端 (tcp-server.js)

```js
import net from "node:net"

// 创建 TCP 服务器
const server = net.createServer((socket) => {
  console.log("客户端已连接")

  // 监听客户端发来的数据
  socket.on("data", (data) => {
    console.log(`收到客户端消息: ${data.toString()}`)
    // 向客户端回发消息
    socket.write("服务器已收到你的消息: " + data.toString())
  })

  // 监听连接断开
  socket.on("end", () => {
    console.log("客户端已断开连接")
  })

  // 错误处理
  socket.on("error", (err) => {
    console.error("连接发生错误:", err)
  })
})

// 监听 3000 端口
server.listen(3000, () => {
  console.log("TCP 服务器已启动，监听端口 3000")
})
```

1. TCP 客户端 (tcp-client.js)

```js
import net from "node:net"

// 创建 TCP 客户端并连接服务器
const client = net.createConnection({ port: 3000 }, () => {
  console.log("已连接到服务器")
  client.write("Hello, TCP Server!")
})

// 接收服务器回传的数据
client.on("data", (data) => {
  console.log(`收到服务器回信: ${data.toString()}`)
  client.end() // 发送完毕后断开连接
})

client.on("end", () => {
  console.log("已从服务器断开")
})
```

在实际的企业级开发中，仅仅写出上面的 Demo 是远远不够的，以下几点是生产环境中必须注意的：

- TCP 的粘包与拆包问题：TCP 是字节流协议，没有消息边界。如果客户端连续发送两个小包，TCP 可能会把它们合并成一个大包发送（粘包）；或者把一个大包拆成几个小包发送（拆包）。
  - 解决方案：在应用层定义协议格式，例如使用“固定长度”、“特殊分隔符（如 \n）”或“消息头+消息体（在消息头中指定长度）”的方式来解决。
- 资源管理与优雅关闭：网络IO打开的socket 都涉及操作系统底层的文件描述符和端口占用。使用完毕后，确保它们被关闭。

## 实现一个基于UDP的可靠的传输服务

UDP 本身是一个无连接且不可靠的协议，它只负责“尽力而为”地发送数据，不保证数据能到达、不保证顺序，也不防止重复。

要实现基于 UDP 的可靠传输（通常被称为 RUDP），核心思路就是在应用层手动模拟 TCP 的可靠性机制。简单来说，就是在你自己的代码里，把 TCP 协议栈帮你做的事情重新实现一遍。

以下是构建一个可靠 UDP 传输协议必须实现的四大核心机制：

### 序列号（Sequence Number）：解决“乱序”和“重复”

UDP 数据包在网络中可能会走不同的路径，导致先发的包后到。

- 实现原理：发送方在封装 DatagramPacket 时，给每个数据包打上一个递增的唯一编号（如 1, 2, 3...）。
- 接收端处理：接收方根据序列号对数据包进行排序。如果发现收到了重复的序列号，直接丢弃；如果发现序列号不连续（比如收到 1 和 3，缺了 2），则知道发生了丢包，可以将乱序的包暂时缓存在一个缓冲区中，等待缺失的包到来。

### 确认应答（ACK）：解决“丢失”

发送方必须知道对方是否真的收到了数据。

- 实现原理：接收方每收到一个有效的数据包，就立刻（或延迟一小段时间）回发一个极小的 UDP 数据包作为 ACK（确认包），里面包含已收到的序列号。
- 发送端处理：发送方维护一个“已发送但未确认”的数据包队列。

### 超时重传（Timeout & Retransmission）：解决“彻底丢失”

如果网络差，数据包或 ACK 都有可能半路丢失。

- 实现原理：发送方在发出一个数据包的同时，启动一个定时器（可以使用 Java 的 ScheduledExecutorService 或简单的延时线程）。
- 触发重传：如果在设定的时间（RTT，往返时间）内没有收到对应的 ACK，发送方就认为该包丢失，自动重新发送该数据包，并重置定时器。

### 滑动窗口（Sliding Window）：提升“传输效率”

如果发一个包就必须等一个 ACK（停等协议），网络带宽会被极大浪费。

- 实现原理：允许发送方在未收到 ACK 的情况下，连续发送多个数据包（例如最多连续发 10 个）。这 10 个包的容量就是“窗口”。
- 窗口滑动：每当收到一个 ACK，窗口就向前滑动，允许发送下一个新的数据包。这能极大地提高管道利用率。

### 约定数据包结构

我们需要在应用层定义一个简单的“数据包”结构，包含以下字段：

- seq (序列号)：给每个数据包编号，用于排序和确认。
- ack (确认号)：告诉发送方，我已经收到了哪个序列号之前的包。
- type (包类型)：区分是握手包(SYN)、确认包(ACK)还是数据包(DATA)。
- data (实际载荷)：传输的真实数据。

### 示例代码

```js
// rudp.js (Reliable UDP)
import dgram from "node:dgram"
const PORT = 41234

// 模拟一个带有 seq, ack, type, data 的数据包结构
const createPacket = (type, seq, ack, data = "") => {
  return JSON.stringify({ type, seq, ack, data })
}

// ---------------------- 服务端逻辑 ----------------------
function startServer() {
  const server = dgram.createSocket("udp4")
  let clientInfo = null // 记录连接的客户端地址和端口
  let expectedSeq = 0 // 期望收到的下一个数据包的序列号

  server.on("message", (msg, rinfo) => {
    const packet = JSON.parse(msg.toString())
    console.log(
      `[Server] 收到包: Type=${packet.type}, Seq=${packet.seq}, Data=${packet.data}`,
    )

    // 1. 处理握手 (SYN)
    if (packet.type === "SYN") {
      clientInfo = rinfo
      expectedSeq = packet.seq + 1 // 握手包占用一个序列号
      // 回复 SYN-ACK
      const ackPacket = createPacket("SYN-ACK", 0, expectedSeq)
      server.send(ackPacket, rinfo.port, rinfo.address)
      console.log(`[Server] 虚拟连接已建立，准备接收数据。`)
      return
    }

    // 忽略非当前客户端的数据包
    if (
      !clientInfo ||
      rinfo.address !== clientInfo.address ||
      rinfo.port !== clientInfo.port
    )
      return

    // 2. 处理数据包 (DATA)
    if (packet.type === "DATA") {
      // 只有当收到的序列号等于期望的序列号时，才处理数据（保证有序）
      if (packet.seq === expectedSeq) {
        console.log(`[Server] ✅ 成功接收并处理数据: "${packet.data}"`)
        expectedSeq++ // 期望下一个序列号

        // 发送 ACK 确认包
        const ackPacket = createPacket("ACK", 0, expectedSeq)
        server.send(ackPacket, rinfo.port, rinfo.address)
      } else {
        // 收到乱序或重复的包，依然回复当前的期望ACK（帮助客户端快速重传）
        console.log(
          `[Server] ⚠️ 收到乱序包 (期望Seq=${expectedSeq}, 收到Seq=${packet.seq})，丢弃并重复发送ACK。`,
        )
        const ackPacket = createPacket("ACK", 0, expectedSeq)
        server.send(ackPacket, rinfo.port, rinfo.address)
      }
    }
  })

  server.bind(PORT, () => {
    console.log(`[Server] 可靠UDP服务端已启动，监听端口 ${PORT}`)
  })
}

// ---------------------- 客户端逻辑 ----------------------
function startClient() {
  const client = dgram.createSocket("udp4")
  let seq = 100 // 初始序列号
  let expectedAck = 101 // 握手后期望的ACK
  let is_connected = false

  // 发送数据包并处理超时重传
  const sendData = (data) => {
    const packetStr = createPacket("DATA", seq, 0, data)
    const timer = setTimeout(() => {
      console.log(`[Client] ⏳ 数据包(Seq=${seq})超时未收到ACK，正在重传...`)
      client.send(packetStr, PORT, "localhost")
    }, 1000) // 1秒超时

    client.send(packetStr, PORT, "localhost", (err) => {
      if (err) console.error(err)
    })

    // 临时监听一次message来获取ACK
    const onMessage = (msg) => {
      const packet = JSON.parse(msg.toString())
      if (packet.type === "ACK" && packet.ack === seq + 1) {
        clearTimeout(timer)
        console.log(`[Client] ✅ 数据包(Seq=${seq})发送成功，收到ACK。`)
        seq++ // 发送成功，序列号递增
        client.removeListener("message", onMessage)
      }
    }
    client.on("message", onMessage)
  }

  // 1. 发起握手 (SYN)
  const synPacket = createPacket("SYN", seq, 0)
  client.send(synPacket, PORT, "localhost", () => {
    console.log(`[Client] 发起虚拟连接握手...`)
  })

  // 监听服务端的 SYN-ACK
  client.on("message", (msg, rinfo) => {
    const packet = JSON.parse(msg.toString())

    // 握手成功
    if (packet.type === "SYN-ACK" && !is_connected) {
      console.log(`[Client] 虚拟连接建立成功！开始发送测试数据。`)
      is_connected = true
      seq++ // 握手包占用一个序列号

      // 模拟连续发送几条数据
      sendData("Hello")
      setTimeout(() => sendData("World"), 500)
      setTimeout(() => sendData("RUDP!"), 1000)
    }
  })
}

// ---------------------- 启动入口 ----------------------
// 仅作演示，将服务端和客户端逻辑写在一个文件中，通过命令行参数来区分启动角色。
const args = process.argv[2]
if (args === "server") {
  startServer()
} else if (args === "client") {
  startClient()
} else {
  console.log('请使用 "node rudp.js server" 或 "node rudp.js client" 来启动')
}
```

当你运行上述代码时，你会在控制台看到以下过程：

- 虚拟连接建立：客户端发送 SYN，服务端回复 SYN-ACK。此时双方确立了“连接”状态。
- 可靠传输：客户端发送 DATA 包（例如 Seq=101）。
- ACK确认：服务端收到 Seq=101 的包后，回复 ACK=102。
- 超时重传：如果你在代码中故意把服务端的 server.send 注释掉（模拟丢包），客户端的 setTimeout 会在 1 秒后触发，打印“超时未收到ACK，正在重传...”，并重新发送该数据包。
- 有序交付：如果客户端极快地发送了 Seq=101 和 Seq=102，但网络导致 Seq=102 先到达服务端，服务端会发现 102 !== expectedSeq(101)，从而丢弃该包并重复回复 ACK=101，直到正确的 101 到达为止。

这个简易实现已经具备了 TCP 的雏形，但真正的 TCP 协议还要复杂得多，如果你需要继续深入，可以研究以下机制：

- 滑动窗口：目前的实现是“停等协议”（发一个等一个ACK），效率极低。TCP 允许连续发送多个包而不必等待ACK。
- 流量控制与拥塞控制：根据网络状况和接收方的处理能力，动态调整发送速度（慢启动、拥塞避免等算法）。
- 连接释放：实现类似 TCP 四次挥手的机制，优雅地断开虚拟连接。

通过 dgram 实现 RUDP，能让你极其深刻地理解为什么 TCP 既“重”又“可靠”，以及 UDP 为什么是实时音视频、在线游戏和 QUIC（HTTP/3）的首选底层协议。
