# SSE

SSE（Server-sent Events）规范是 HTML 5 规范的一个组成部分。该规范比较简单，主要由两个部分组成：

1. 第一个部分是服务器端与浏览器端之间的 SSE 通讯协议。
2. 第二部分则是在浏览器端实现 EventSource 接口。

## SSE 通讯协议

```
Content-Type: text/event-stream // SSE 协议规定推送事件流的 MIME 类型为 text/event-stream。
Cache-Control: no-cache // 必须指定浏览器不缓存服务端发送的数据，以确保浏览器可以实时显示服务端发送的数据。
Connection: keep-alive // SSE 是一个一直保持开启的 TCP 连接
```

1. 服务器端的响应的内容类型必须是`"Content-Type": "text/event-stream"`
2. 基于纯文本的简单协议，响应文本的内容可以看成是一个事件流，由不同的事件所组成。
   1. 每个事件由**类型**和**数据**两部分组成，同时每个事件可以有一个可选的**标识符**。
   2. 不同事件的内容之间通过仅包含回车符和换行符的空行（“\r\n”）来分隔。
   3. 每个事件的数据可以是一行，也可以由多行组成。
   4. 如果未指明事件类型，默认事件名 message。
   5. 对于每一行来说，冒号（“:”）前面表示的是该行的类型，冒号后面则是对应的值。
   6. 如果某行仅以冒号开头，则该行为注释行，浏览器会忽略，注释行可以用来防止请求连接超时，服务端可以定期向浏览器发送一条消息注释行，以保持连接不断。
3. 如果服务器端返回的数据中包含了事件的标识符id，浏览器会记录最近一次接收到的事件的标识符。如果与服务器端的连接中断，当浏览器端再次进行连接时，会通过 HTTP 头“Last-Event-ID”来声明最后一次接收到的事件的标识符，这样服务器端的逻辑可以读取标识符来确定从哪个事件开始来继续数据传输。
4. 服务端无法主动关闭连接，但可以自定义消息格式，提示客户端关闭。

```
data: first event

data: second event
id: 100

event: custom_event
data: third event
id: 101

: this is a comment
data: fourth event
data: fourth event continue

retry: 1000
```

- 类型为空白，表示该行是注释，会在处理时被忽略。
- 类型为 data，表示该行包含的是数据。以 data 开头的行，可以出现多次，以换行符结尾。所有这些行都是该事件的数据。
- 类型为 event，表示该行用来声明事件的类型。浏览器在收到数据时，会产生对应类型的事件。
- 类型为 id，表示该行用来声明事件的标识符。
- 类型为 retry，表示该行用来声明浏览器在连接断开之后进行再次连接之前的等待时间，单位毫秒 ms。如果该字段不是整数值，会被忽略。

## EventSource 接口

EventSource 接口使用的是标准的 DOM 事件监听器方式，只需要在对象上添加相应的事件处理方法即可。
EventSource 提供了三个标准事件:

1. open 当成功与服务器建立连接时触发
2. message 当收到服务器发送的默认事件类型时触发
3. error 当连接出现错误时错误， evt.target.readSTate 值可能是 0 1 2，对应 evt.targe.CONNECTING、evt.target.OPEN 或 evt.target.CLOSED

```js
var es = new EventSource("events", { withCredentials: false })

es.addEventListener("open", function (e) {}, options / useCapture)
es.addEventListener("message", function (e) {}, options / useCapture)
es.addEventListener("error", function (e) {}, options / useCapture)
es.addEventListener("custom_event", function (e) {}, options / useCapture)

/**
 * options = {
 *    capture: 表示 listener 会在该类型的事件捕获阶段传播到该 EventTarget 时触发，同 useCapture
 *    once: 表示 listener 在添加之后最多只调用一次。如果为 true，listener 会在其被调用之后自动移除。
 *    passive: 设置为 true 时，表示 listener 永远不会调用 preventDefault()。如果 listener 仍然调用了这个函数，客户端将会忽略它并抛出一个控制台警告。
 *    signal: 该 AbortSignal 的 abort() 方法被调用时，监听器会被移除
 * }
 */
```

## 实践

### 基本示例 HelloWorld

服务端

```js
import { Router } from "express"

export const router = Router()

router.get("/sse/hello", (req, res) => {
  res.type("text/event-stream")

  const arr = "hello world!".split("")

  let timer = null

  timer = setInterval(() => {
    const content = `data:${arr.shift()}\n\n`
    res.write(content)

    if (arr.length === 0) {
      res.write("data:done\n\n")
      res.end()
      clearInterval(timer)
    }
  }, 1000)
})
```

客户端

```html
<h1>Server Send Event => Event Source</h1>

<button id="connect-btn">连接</button>

<h2>接收来自服务端的信息</h2>
<div id="received-msg"></>

```

```js
const receivedMsgWrapEl = document.getElementById("received-msg")
const connectBtnEl = document.getElementById("connect-btn")

function startEventSource() {
  const es = new EventSource("/sse/hello")
  es.addEventListener("message", (evt) => {
    const line = evt.data
    // 主动关闭连接
    if (/done/.test(line)) {
      es.close()
    }
    const info = document.createElement("span")
    info.textContent = line
    receivedMsgWrapEl.appendChild(info)
  })
}

connectBtnEl.addEventListener("click", () => startEventSource())
```

### 数据推送

#### JSON 数据

sse 基于文本传输，为了让单个消息包含更多数据，可以使用 JSON 对象，转为 JSON 字符串进行传输。

```js
// json.router.js
router.get("/", (req, res) => {
  res.type("text/event-stream")

  let timer = null

  timer = setInterval(() => {
    const obj = logs.shift()
    // 转为字符串
    const content = `data:${JSON.stringify(obj)}\n\n`
    res.write(content)

    if (logs.length === 0) {
      res.end()
      clearInterval(timer)
    }
  }, 1000)
})

const logs = [
  {
    level: "info",
    env: "development",
    traceId: "asdfre2324sf",
    method: "get",
    path: "/user/debug",
  },
  {
    level: "info",
    env: "development",
    traceId: "sdfsdfasdflk",
    method: "post",
    path: "/user/debug",
  },
]
```

客户端

```js
function startEventSource() {
  const es = new EventSource("/sse/json")
  es.addEventListener("message", (evt) => {
    const line = evt.data

    if (line === "undefined") {
      es.close()
      return
    }

    const info = JSON.parse(line)

    const content = Array.from(Object.entries(info)).reduce((ret, cur) => {
      ret += `<span>${cur[0]}: ${cur[1]}</span>; `
      return ret
    }, "")

    const liEl = document.createElement("li")
    liEl.innerHTML = `<li>${content}</li>`
    receivedMsgWrapEl.appendChild(liEl)
  })
}
```

#### 推送时机

- 短周期性事件流: 使用定时器，如 setInterval，见上面
- 长周期性事件流: 与定时任务 cron 结合
- 处理非周期性事件流：建立连接池，利用事件触发器进行推送

定时任务

```js
import { Router } from "express"
import { CronJob } from "cron"

export const router = Router()

let count = 0
const connectPools = new Set()
const job = CronJob.from({
  cronTime: "0/1 * * * * *", // 每隔一秒执行
  onTick: () => {
    count++
    for (const conn of connectPools) {
      conn.write(`data:${count}\n\n`)
    }
  },
  start: false,
})

router.get("/", (req, res) => {
  res.type("text/event-stream")
  connectPools.add(res)
  console.log("🚀 ~ 新增一个新连接...", connectPools.size)

  if (!job.running) {
    job.start()
  }

  req.on("close", () => {
    connectPools.delete(res)
    console.log("🚀 ~ 删除一个连接...", connectPools.size)
  })
})
```

事件触发

```js
import { Router } from "express"
import { EventEmitter } from "node:events"

export const router = Router()
export class ServerSendEvent extends EventEmitter {}

const sse = new ServerSendEvent()
let count = 0
const connectPools = new Set()
sse.on("SSE", (count) => {
  for (const conn of connectPools) {
    conn.write(`data:${count}\n\n`)
  }
})

router.get("/", (req, res) => {
  res.type("text/event-stream")
  connectPools.add(res)
  console.log("🚀 ~ 新增一个新连接...", connectPools.size)

  req.on("close", () => {
    connectPools.delete(res)
    console.log("🚀 ~ 删除一个连接...", connectPools.size)
  })
})

router.get("/emit", (req, res) => {
  sse.emit("SSE", count++)
  res.end()
})
```

#### 推送到指定用户侧

1. 保存每个用户标识对应的 response 对象，指定用户发送时，调用原生 res.write 写消息。
2. 监听每个用户标识对应的 request 对象的 close 事件，删除对应用户标识，避免内存爆炸。

用户认证：

- 服务端推送消息时，可以自定义写入响应头; 但是浏览器连接时，无法自定义写入请求头。所以如果要实现身份验证，只能利用浏览器的一些默认行为：如 cookie 或者 url 查询参数上挂载验证信息。
- 如果要携带cookie，则在浏览器创建 eventSource 实例时传入第二个参数对象 `new EventSource(ulr, {withCredentials: true})`;

服务端

```js
import { Router } from "express"
import { EventEmitter } from "node:events"

export const router = Router()
export class ServerSendEvent extends EventEmitter {}

const sse = new ServerSendEvent()
let count = 0
const connectPools = new Map()

sse.on("SSE", (uid, count) => {
  const conns = connectPools.get(uid)

  for (const conn of conns) {
    conn.write(`data:${uid}:${count}\n\n`)
  }
})

router.get("/", (req, res) => {
  const uid = req.query.uid

  if (!uid) {
    res.status(403).end()
    return
  }
  if (connectPools.has(uid)) {
    const arr = connectPools.get(uid)
    connectPools.set(uid, [...arr, res])
  } else {
    connectPools.set(uid, [res])
  }

  res.type("text/event-stream")
  console.log("🚀 ~ 新增一个新连接...", connectPools.size)

  req.on("close", () => {
    connectPools.delete(uid)
    console.log("🚀 ~ 删除一个连接...", connectPools.size)
  })
})

router.get("/emit", (req, res) => {
  const uid = req.query.uid
  if (!uid) {
    res.status(403).end()
    return
  }
  sse.emit("SSE", uid, count++)
  res.end()
})
```

客户端

```js
const receivedMsgWrapEl = document.getElementById("received-msg")
const connectBtnEl = document.getElementById("connect-btn")
const closeBtnEl = document.getElementById("close-btn")
const emitBtnEl = document.getElementById("emit-btn")
let es = null
const uid = window.crypto.randomUUID()

function startEventSource() {
  es = new EventSource(`/sse/client?uid=${uid}`)
  es.addEventListener("message", (evt) => {
    const line = evt.data
    const info = document.createElement("div")
    info.textContent = line
    receivedMsgWrapEl.appendChild(info)
  })
}

connectBtnEl.addEventListener("click", () => startEventSource())
closeBtnEl.addEventListener("click", () => es && es.close())
emitBtnEl.addEventListener("click", () => {
  fetch(`/sse/client/emit?uid=${uid}`).then(() => {
    console.log("事件已发送")
  })
})
```

### event 自定义事件

1. 默认事件类型是 message
2. 如果需要自定义事件，则在服务端推送消息时，添加一行 event: custom_event，然后客户端监听此事件名 custom_event

例如，对于 SSE 连接，服务器无法主动关闭，只能由浏览器执行关闭连接。所以对于服务端，可以通过自定义事件，主动推送一个关闭连接的事件，浏览器监听后执行关闭。

```js
import { Router } from "express"
import { CronJob } from "cron"

export const router = Router()

let count = 0
const connectPools = new Set()
const job = CronJob.from({
  cronTime: "0/1 * * * * *", // 每隔一秒执行
  onTick: () => {
    count++
    for (const conn of connectPools) {
      conn.write(`data:${count}\n\n`)

      if (count >= 5) {
        // 自定义事件 disconnect
        conn.write(`event:disconnect\n`)
        conn.write(`data:\n\n`)
      }
    }
  },
  start: false,
})

router.get("/", (req, res) => {
  res.type("text/event-stream")
  connectPools.add(res)
  console.log("🚀 ~ 新增一个新连接...", connectPools.size)

  if (!job.running) {
    job.start()
  }

  req.on("close", () => {
    connectPools.delete(res)
    console.log("🚀 ~ 删除一个连接...", connectPools.size)
  })
})
```

客户端

```js
const receivedMsgWrapEl = document.getElementById("received-msg")
const connectBtnEl = document.getElementById("connect-btn")

function startEventSource() {
  const es = new EventSource("/sse/disconnect")
  es.addEventListener("message", (evt) => {
    const line = evt.data
    const info = document.createElement("div")
    info.textContent = line
    receivedMsgWrapEl.appendChild(info)
  })
  // 监听自定义事件
  es.addEventListener("disconnect", () => {
    es.close()
    const info = document.createElement("div")
    info.textContent = "连接已关闭"
    receivedMsgWrapEl.appendChild(info)
  })
}

connectBtnEl.addEventListener("click", () => startEventSource())
```

### last-event-id

1. 如果服务器响应推送的数据行有 id:xxx，则客户端可以通过事件对象获取 event.lastEventId
2. 则当服务器主动断开连接后，浏览器会有自动重连的机制，大概3-5s，并且如里断开前服务端推送的数据有id行，则重连时会默认在请求头 Last-Event-Id 中带上断开前接收到的 id。这是浏览器实现的主动行为，用户无法干预。
3. 多路复用 id。sse 协议规定id是字符串，所以多路消息时，可以传入一个多路id信息的json字符串。 last-event-id="{a:xx,b:xx,c:xx}"，然后解析获取对应id.

示例：当浏览器已经连接时，重启服务器，再次连接，浏览器页面输出的数据还是连续的。

服务端

```js
import { Router } from "express"
import { CronJob } from "cron"

export const router = Router()

let count = 0
const connectPools = new Set()
const job = CronJob.from({
  cronTime: "0/1 * * * * *", // 每隔一秒执行
  onTick: () => {
    count++
    for (const conn of connectPools) {
      conn.write(`id:${count}\n`)
      conn.write(`data:数据${count}\n\n`)
    }
  },
  start: false,
})

router.get("/", (req, res) => {
  const lastEventId = req.headers["last-event-id"]
  console.log("🚀 ~ router.get ~ lastEventId:", lastEventId)

  if (lastEventId) {
    count = +lastEventId
  }

  res.type("text/event-stream")
  connectPools.add(res)
  console.log("🚀 ~ 新增一个新连接...", connectPools.size)

  if (!job.running) {
    job.start()
  }

  req.on("close", () => {
    connectPools.delete(res)
    console.log("🚀 ~ 删除一个连接...", connectPools.size)
  })
})
```

客户端

```js
const receivedMsgWrapEl = document.getElementById("received-msg")
const connectBtnEl = document.getElementById("connect-btn")

function startEventSource() {
  const es = new EventSource("/sse/lastEventId")
  es.addEventListener("message", (evt) => {
    const lastEventId = evt.lastEventId
    const line = evt.data
    const info = document.createElement("div")
    info.textContent = `ID: ${lastEventId}; DATA: ${line}`
    receivedMsgWrapEl.appendChild(info)
  })
}

connectBtnEl.addEventListener("click", () => startEventSource())
```

### retry 重试

在浏览器有内置的重试机制，它会在服务器正常关闭了套接字时，执行如下几步：

- 设置 readyState 值为 EventSource.CONNECTING
- 调用 error 事件处理程序
- 等待 retry 延时时间，然后尝试重新发起连接。这个重试等待时间默认是由浏览器决定的，大约是3-5秒，（不同浏览器实现不一致，chrome 源码 webkit 中设置是3秒，safari 源码 blink 中设置是3秒，firefox是5秒）。但服务器端也可以主动设置，通过添加消息行 `retry: 10000`，单位毫秒，当然也不能设置太长，不然其它网络节点，比如浏览器、中间代理服务器、负责均衡服务器等会把长时间的沉默当成丢失连接，那浏览器就会主动关闭连接了，大概在 15-40秒范围内设置重连时间。

```js
conn.write(`id:${count}\n`)
conn.write(`retry:10000\n`)
conn.write(`data:数据${count}\n\n`)
```

### 错误处理

1. 如果传输数据是json的数据文本，则在 JSON.parse 时 try watch 处理下，避免因解析错误导致应用崩溃
2. 监听 error 事件，从 e.target.readState == 2 或直接 e.target.CLOSED 连接关闭时，尝试重连

```js
es.addEventListener("message", (evt) => {
  const line = evt.data

  if (line === "undefined") {
    es.close()
    return
  }

  try {
    const info = JSON.parse(line)
  } catch (error) {
    console.error(error)
  }

  const content = Array.from(Object.entries(info)).reduce((ret, cur) => {
    ret += `<span>${cur[0]}: ${cur[1]}</span>; `
    return ret
  }, "")

  const liEl = document.createElement("li")
  liEl.innerHTML = `<li>${content}</li>`
  receivedMsgWrapEl.appendChild(liEl)
})

es.addEventListener("error", (evt) => {
  // 值是 CONNECTING（0）、OPEN（1）或 CLOSED（2）。
  if (evt.target.readState == 2 || evt.target.CLOSED) {
    // 重新连接
  }
})
```

### 长连接

浏览器内置的重试机制只能处理套接字正常关闭的情况，如果是其它错误导致服务器中断，比如服务器端代码逻辑错误、死循环、服务器离线、服务意外关闭连接、跨域访问拒绝等情况时导致没有正常关闭网络请求 socket 时，浏览器就不会主动发起重连。针对这种情况，在浏览器端就需要能检测到该情形，并显式发起连接，也就是长连接的机制。有两种方式同时实施：

- 浏览器端实现长连接：在上一次接收消息沉默了 15 秒后发一次重接连接。这种浏览端显式重连主要是为了应对连接异常中断的情况。
- 服务器端实现长连接：在推送一次消息后超过15秒后发送一个注释或空消息，也称为心跳机制。

### 心跳检测

当长时间数据推送时，为了避免其它网络节点不会因长时间连接沉默而中断连接的情况下，服务器可以定时推送一个数据包，好像是告诉终端浏览器连接正常，只是没什么数据需要通信而已。这也叫做“心跳”。有两种方式：

- 通过推送一个以分号开始的消息 `:xxx\n\n`，浏览器接收会懂得这是一个注释，消息事件会忽略，但连接会被保持。
- 别一种是推送一个空消息 `data:\n\n`，此时会触发浏览器端的消息处理事件，只是没有数据。

相比较 `data:\n\n` 会触发浏览器事件响应的逻辑，以分号开始的注释消息更好。

```js
import { Router } from "express"
import { EventEmitter } from "node:events"

export const router = Router()
export class ServerSendEvent extends EventEmitter {}

const sse = new ServerSendEvent()
let count = 0
const connectPools = new Map()

sse.on("SSE", (uid, count) => {
  const conns = connectPools.get(uid)

  for (const conn of conns) {
    conn.write(`data:${uid}:${count}\n\n`)
  }

  gotActivity()
})

let keepaliveTimer = null
const keepaliveSecond = 25 // 因为客户端设置了20s，所以服务端设置稍长一点，由客户端优先保活
function gotActivity() {
  if (keepaliveTimer) {
    clearTimeout(keepaliveTimer)
  }

  if (connectPools.size === 0) return

  keepaliveTimer = setTimeout(() => {
    console.log("🚀 ~ heartbeat ~")
    Array.from(connectPools.values()).forEach((conns) => {
      conns.forEach((conn) => {
        conn.write(":heartbeat")
      })
    })
  }, keepaliveSecond * 1000)
}

router.get("/", (req, res) => {
  const uid = req.query.uid

  if (!uid) {
    res.status(403).end()
    return
  }
  if (connectPools.has(uid)) {
    const arr = connectPools.get(uid)
    connectPools.set(uid, [...arr, res])
  } else {
    connectPools.set(uid, [res])
  }

  res.type("text/event-stream")
  gotActivity()

  req.on("close", () => {
    connectPools.delete(uid)
  })
})

router.get("/emit", (req, res) => {
  const uid = req.query.uid
  if (!uid) {
    res.status(403).end()
    return
  }
  sse.emit("SSE", uid, count++)
  res.end()
})
```

### 定期关闭和重连

想像一下，如果有几百上万的终端浏览器与服务器保持着长连接消息，但又没有数据推送，着实是一种浪费。所以如果业务是明确的周期性时，服务端可以通知终端，可以关闭连接，并在某个时间点时发起重新发起连接。比如证券数据推送，明确周未是休市没有数据需要推送的场景。

关于通知的形式：可以通过自定义事件，或者前后端约定的 json 数据，另外因为前后端时间可能不一致，所以服务端最好发送一个明确需要重试的时间戳。

```json
event:scheduled_shutdown
data:12344565
// 或者
data: '{"action": "scheduled_shutdown", "until_second": 123456432}'
```

然后浏览器解析时间时判断 `action===scheduled_shutdown`，则调用 `eventSource.close()` 关闭连接，并开启一个定时任务。 `setTimeout(start, until_second * 1000)`

1. 上面第一点方案中浏览器开启重连的时间点有点问题，几百上万的终端会在大约同一时间向服务器发起连接，瞬时流量会非常拥挤。所以更完善的方案是将终端重连的时间分散开来。有两种方案：一种是服务器下发的时间戳进行调整，一种是浏览器端定时时间调整。

```js
// 将终端重试的时间分散在 60 s内。
let millisecond = until_second * 1000
millisecond -= Math.ceil(Math.random() * 60000)
if (millisecond > 0) {
  setTimeout(start, millisecond)
}
```

### 跨域

1. 利用服务器推送时可以自定义请求头的优势，向浏览器写入对应的跨域需要的响应头。
2. 跨域 cookie 的携带，需要两步：
   1. 浏览器创建 eventSource 实例时传入第二个参数对象 `{withCredentials: true}`;
   2. 服务端响应时携带响应头 `Access-Control-Allow-Credentials: true`、Access-Control-Allow-Origin / Access-Control-Allow-Headers / Access-Control-Allow-Methods 的值需要为指定值，不能是通配符\*。

### 兼容方案

向后兼容方案：轮询、长轮询、长连接、xhr

## 重构

客户端逻辑

```js
/*
 * @Description  : 兼容 xhr 方式，并开启长轮询
 *
 * 为兼容 xhr 方式，统一使用本地缓存 last-event-id
 */

const defaultOptions = {
  keepaliveSecond: 20, // 长连接间隔 20s
  globalMessageSelector: "global-msg",
  messageSelector: "received-msg",
  withCredentials: false,
}

export class SSE {
  url = null
  globalMessageWrapper = null
  messageWrapper = null
  lastEventId = null

  // eventSource 方案
  es = null
  keepaliveTimer = null

  // 使用 xhr 长轮询 的兼容方案
  xhr = null
  longPollTimer = null

  constructor(url, options = {}) {
    this.url = url
    this.options = Object.keys(defaultOptions).reduce((ret, k) => {
      ret[k] = options[k] ?? defaultOptions[k]
      return ret
    }, {})

    this.globalMessageWrapper = document.getElementById(
      this.options.globalMessageSelector
    )
    this.messageWrapper = document.getElementById(this.options.messageSelector)
  }

  /**
   * 异常中断后，显式发起重连
   * 第一种：每次消息处理时都销毁旧定时器，然后开启新的定时器。
   * 第二种：要求服务端在消息中携带一个时间戳，浏览器在每次消息处理时进行更新。另外在本地开启一个每隔4、5秒左右的定时器 setInterval，去检查当前时间与缓存的时间戳比较有没有超过规定间隔，比如 20 秒。
   *
   * 第一种方式需要频繁的开启定时器，第二种需要维持一个长时间定时任务，但每次消息处理只需要更新一个变量值而已。
   * 就cpu 的开销时间，第一种是第二种的几百倍。但第一种的开销占cpu总开销比例也很小。所以并不会成为性能瓶颈，并且时间间隔更精确
   * 参考《HTML5数据推送应用开发》 P60
   */
  gotActivity() {
    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer)
    }
    console.log("🚀 启动长连接 gotActivity >>>")
    this.keepaliveTimer = setTimeout(() => {
      this.connect()
    }, this.options.keepaliveSecond * 1000)
  }

  /**
   * 使用 EventSource 开启 SSE 连接
   */
  startEventSource() {
    this.gotActivity()

    if (this.es) this.es.close()

    let url = this.url

    // 默认重连，浏览器自动会添加 last-event-id 请求。
    // 以下拼接查询参数主要为显示长连接的情形。
    const lastEventId = localStorage.getItem("LAST-EVENT-ID")
    if (lastEventId) {
      url = `${url}?last-event-id=${lastEventId}`
    }

    const es = (this.es = new EventSource(url, {
      withCredentials: this.options.withCredentials,
    }))
    es.addEventListener("open", this.handleOpen.bind(this))
    es.addEventListener("message", this.handleMessage.bind(this))
    es.addEventListener("error", this.handleError.bind(this))
    es.addEventListener("disconnect", this.disconnect.bind(this))
    es.addEventListener("custom_event", this.handleMessage.bind(this))
  }

  handleOpen() {
    console.log("event source open...")
  }

  handleError(evt) {
    console.log("event source error", evt.target)
    // 值是 CONNECTING（0）、OPEN（1）或 CLOSED（2）。
    if (evt.target.readState == 2 || evt.target.CLOSED) {
      this.gotActivity()
    }
  }

  handleMessage(evt) {
    if (evt.lastEventId) {
      this.lastEventId = evt.lastEventId
      localStorage.setItem("LAST-EVENT-ID", evt.lastEventId)
    }

    this.processOneLine(evt.data)
  }

  /**
   * 解析服务器推送过来的 json 消息
   * 约定格式：{acton, id, data}
   */
  processOneLine(line) {
    try {
      // 正常连接时，清除长连接检测的定时器
      this.gotActivity()

      const d = JSON.parse(line)

      switch (d.action) {
        case "info": {
          const info = document.createElement("li")
          info.textContent = `${d.id}: ${JSON.stringify(d.data)}`
          this.messageWrapper.appendChild(info)
          break
        }
        case "shutdown": {
          const msg = document.createElement("li")
          msg.textContent = `Scheduled shutdown from now. Come back at ${d.util} (in ${d.until_second} second)`
          this.globalMessageWrapper.appendChild(msg)

          this.temporarilyDisconnect(d.until_second)
          break
        }
        default:
          break
      }
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * 短暂休眠服务器指定时间后，重连
   * 要大于浏览器有默认的重连时间
   */
  temporarilyDisconnect(sec = 20000) {
    let millisecond = sec * 1000

    // 避免瞬时并发，这里客户端重连请求分散在 60s 内
    millisecond -= Math.ceil(Math.random() * 60000)

    if (millisecond < 0) return

    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer)
      this.keepaliveTimer = null
    }

    this.disconnect()
    this.keepaliveTimer = setTimeout(this.connect, millisecond)
  }

  /**
   * 向后兼容情况
   * - EventSource
   * - xhr
   */
  connect() {
    if (window.EventSource) {
      this.startEventSource()
    } else {
      this.startLongPoll()
    }
  }

  /**
   * 主动关闭连接
   */
  disconnect() {
    this.lastEventId = null

    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer)
      this.keepaliveTimer = null
    }

    if (this.es) {
      this.es.close()
      this.es.removeEventListener("open", this.handleOpen)
      this.es.removeEventListener("message", this.handleMessage)
      this.es.removeEventListener("error", this.handleError)
      this.es.removeEventListener("disconnect", this.disconnect)
      this.es.removeEventListener("custom_event", this.handleMessage)
      this.es = null
    }

    if (this.xhr) {
      this.xhr.abort()
      this.xhr = null
    }

    if (this.longPollTimer) {
      clearTimeout(this.longPollTimer)
      this.longPollTimer = null
    }
  }

  /**
   * 长轮询的兼容方案
   * 这里 XMLHttpRequest 1.0 版本方式。如果浏览器实现了 XMLHttpRequest 2.0，那必然实现了 eventSource 。
   */
  startLongPoll() {
    if (this.xhr) this.xhr.abort()
    if (window.XMLHttpRequest) {
      this.xhr = new XMLHttpRequest()
    } else {
      this.xhr = new ActiveXObject("Msxml2.XMLHTTP") // IE 兼容性
    }

    this.xhr.onreadystatechange = this.longPollOnReadyStateChange.bind(this)

    const url = `${this.url}?longpoll=1&t=${Date.now()}` // longpoll 标识方便后端识别请求方式，如果是 xhr，服务器推送数据后需要关闭连接，浏览器才能接收响应数据。t 加时间戳是为了避免浏览器缓存请求
    this.xhr.open("GET", url)

    const lastEventId = localStorage.getItem("LAST-EVENT-ID")
    if (lastEventId) {
      this.xhr.setRequestHeader("Last-Event-ID", lastEventId)
    }
    this.xhr.send(null)
  }

  longPollOnReadyStateChange() {
    if (this.readyState != 4) return

    if (this.xhr.status == 200) {
      this.longPollTimer = setTimeout(this.startLongPoll, 1000)
      this.processNonSSE(this.xhr.responseText)
      this.xhr = null
    } else {
      console.log("Connection failure")
      this.disconnect()
      this.longPollTimer = setTimeout(this.startLongPoll, 3000) // 这个时间的原则 ？？
    }
  }

  processNonSSE(resText) {
    // SSE 总是返回一条消息，但长轮询可能返回多条消息
    const lines = resText.split(/\n/)

    for (let line of lines) {
      if (line.length === 0) continue

      // 脏数据防御 json 字符串必须以 { 开头， } 结尾。
      if (line[0] !== "{") {
        line = line.substring(line.indexOf("{"))

        if (line.length === 0) continue
      }
      this.processOneLine(line)
    }
  }
}
```

## nestjs 实现 SSE

[服务器发送的事件](https://nest.nodejs.cn/techniques/server-sent-events)

nestjs 提供了对应用装饰器实现 `@Sse`，响应的消息结构和数据文本不需要手动处理，直接返回对象形式。

```js
import {
  Controller,
  Sse,
  MessageEvent,
  Query,
  Req,
  Header,
} from '@nestjs/common';
import { Observable, interval, map, take } from 'rxjs';
import type { Request } from 'express';
import { Cookies } from 'src/common/decorator/cookie.decorator';

@Controller('sse')
export class SseController {
  count: number = 0;
  constructor(private readonly sseService: SseService) {}

  @Sse()
  @Header('Cache-Control', 'no-cache, must-revalidate') // 阻止浏览器缓存
  @Header('Expires', 'Sun, 31 Dec 2000 05:00:00 GMT') // 兼容性，设置过期时间为过去时
  sse(
    @Req() req: Request,
    @Query() query: Record<string, string>,
  ): Observable<MessageEvent> {
    /**
     * 1. 正常的退出，浏览器默认会发起重试，此时 last-event-id 在请求头里
     * 2. 用户侧主动发起长连接逻辑时，last-event-di 拼接在 url 的查询参数中
     */
    const lastEventId = req.headers['last-event-id'] || query['last-event-id'];

    /**
     * 通过 cookie 来配置用户信息
     */
    const cookie = req.cookies;
    console.log(
      '🚀 ~ file: sse.controller.ts:62 ~ SseController ~ cookie:',
      cookie,
    );

    // @Sse 在 nestjs 规定必须返回一个 observable 可观测对象。因为 nestjs 内部实现时对此对象添加了监听
    return interval(1000)
      .pipe(take(5))
      .pipe(
        map((_) => {
          if (lastEventId) {
            // 此时可以根据 lastEventId 执行一些续传的逻辑
            this.count = +lastEventId
          } else {
            this.count++
          }
          return {
            // FIX: 这里对 id, type, retry 设置在客户端没有用，全部作为 data 数据了，待找原因？？？
            id: this.count,
            type: 'custom_event', // 默认是 message 事件
            data: { action: 'info', id: id, data: { count:this.count } },
          } as MessageEvent;
        }),
      );
  }
```

> TODO
> @See 返回 {id, type, retry, data} 格式的 MessageEvent 接口数据，对客户端不起作用，全部作为 data 数据显示了，未知原因

处理非周期性事件流，利用事件触发器进行推送

```js
// sse.controller.ts
import { SseService } from './sse.service';
@Controller('sse')
export class SseController {
  count: number = 0;
  constructor(private readonly sseService: SseService) {}

  @Sse()
  @Header('Cache-Control', 'no-cache, must-revalidate') // 阻止浏览器缓存
  @Header('Expires', 'Sun, 31 Dec 2000 05:00:00 GMT') // 兼容性，设置过期时间为过去时
  sse(): Observable<MessageEvent> {
    return this.sseService.ssePushClient();
  }

  /**
   * 处理非周期性事件流，利用事件触发器进行推送
   */
  @Get('/send')
  send(
    @Query() query: Record<string, string>,
    @Cookies() cookies: Record<string, string>,
  ) {
    this.sseService.emit({...query, ...cookies});
  }
```

```js
// sse.service.ts
import { Injectable, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

@Injectable()
export class SseService {
  constructor(private readonly eventEmitter: EventEmitter2) {}
  ssePushClient(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'SSE_BROADCAST').pipe(
      map((data) => {
        return data as MessageEvent;
      }),
    );
  }

  emit(data: Record<string, string>) {
    this.eventEmitter.emit('SSE_BROADCAST', {data});
    return;
  }
}
```

## 项目问题

如果将 SSE 实际应用时，需要考虑的问题：

- 服务器端
  - 服务器必须保留响应对象，以便可以使用它来发送消息，如何存储？
  - 如果客户端出现故障，服务器不会收到任何通知。因此，保存的回复会无限期地徘徊。清理过时的连接是一个问题。
  - 客户端中的 EventSource 对象会不时地重新调用初始 url，从而生成一个新的响应对象。旧的响应对象现在已失效，必须替换为新的响应对象。
  - 解决这些问题的一种方法（此处采用的方式）是让服务器以某种方式将响应与请求者以及时间戳相关联。它可以定期检查该请求者联系它的时间。如果持续时间超过某个阈值，它可以假定连接已过时并将其删除。这又带来了另一个问题：如果你有 10,000 或 100,000 个侦听器，你不想在执行这些检查或全局通知时阻止服务器。因此，循环的构造方式必须使每次（成功）迭代后将控制权交还给服务器。
- 客户端
  - 当客户端创建 EventSource 对象时，它会传递一个侦听器对象。侦听器可以侦听消息，但在收到 open 回调之前无法触发消息。例如，如果您想使用“提交”按钮或其他事件触发任务，则会引入计时问题。
  - 如果服务器要将响应与连接相关联，则需要唯一标识符才能执行此操作。客户端必须保留唯一标识符，以便后续请求和关闭连接。

参考示例：[Server Event Group 实践示例](https://aphorica.github.io/server-event-docs/)

## 参考链接

[server send event 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events)
