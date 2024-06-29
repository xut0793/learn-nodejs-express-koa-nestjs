# diagnostis_channel

Diagnostics Channel 模块提供了一个发布-订阅（pub-sub）机制，允许你创建命名通道并在这些通道上发布和订阅消息。这对于应用程序和库的诊断或调试非常有用。

## 基础概念：

- Channel（通道）: 在 diagnostics_channel 模块中，一个 Channel 表示一条命名的消息通道，开发者可以通过它发送和接收消息。
- Publisher（发布者）: 发布者会向特定的 Channel 发送消息。任何时候当你的应用程序执行了某些可能值得关注的动作时，就可以发布一条消息。
- Subscriber（订阅者）: 订阅者会监听 Channel 上的消息。当有新消息时，它们可以做出相应的反应，例如记录日志、收集统计信息或触发其他操作。

> Nodejs 的 EventEmitter 也是一个订阅和发布机制。

## 基本用法

- diagnostics_channel
  - `diagnostics_channel.hasSubscribers(name)` 判断某个通道名称上是否有订阅者
  - `diagnostics_channel.channel(name)` 创建一个命名通道
  - `diagnostics_channel.subscribe(name, onMessage)` 订阅 name 通道，`onMessage(message, name)` 参数是一个函数，它接受两个参数：message 是发布到通道的数据，而 name 是通道的名称。
  - `diagnostics_channel.unsubscribe(name, onMessage)` 取消订阅 name 通道
- 类：Channel
  - `channel.hasSubscribers` 当前通道上是否有订阅者
  - `channel.publish(message)` 发布消息
  - `channel.subscribe(onMessage)` 直接订阅通道
  - `channel.unsubscribe(onMessage)` 取消订阅

```js
// a.js
import diagnostics_channel from "node:diagnostics_channel"

// 创建一个特定的通道实例
const channel = diagnostics_channel.channel("my-channel")

// 只有当有订阅者时才发布消息，以提高性能
if (channel.hasSubscribers) {
  // 发布消息，通知该通道的所有订阅者
  channel.publish({
    some: "data",
  })
}
```

全局范围内的其它模块中， 只要知道通道名称，就可以订阅该通道消息

```js
// b.js
import diagnostics_channel from "node:diagnostics_channel"

function onMessage(message, name) {
  // Received data
  console.log(`Received message on ${name}:`, message)
}

// 只要知道通道名称，就可以订阅该通道消息
diagnostics_channel.subscribe("my-channel", onMessage)

// 视业务需求，通过 unsubscribe 方法取消订阅
if (false) {
  diagnostics_channel.unsubscribe("my-channel", onMessage)
}
```

## 与 EventEmitter 不同点

通过这种方式，Diagnostics Channel 提供了一个灵活的机制，允许不同部分的代码相互沟通，但是又不需要直接依赖对方。这使得代码更加模块化、可维护，实现了模块的松耦，更容易地进行监控和调试。并且 Channel 内部会自动判断，仅当该通道存在订阅者时才应发布事件。

如果是 EventEmitter 来实现事件的订阅和触发，需要依赖于同一个事件对象。

```js
// b.js
import { EventEmitter } from "node:events"

class MyEmitter extends EventEmitter {}

export const myEmitter = new MyEmitter()

function onMessage(...args) {
  // Received data
  console.log(`Received message args:`, args)
}

myEmitter.on("my-event", onMessage)

// 视业务需求，通过 unsubscribe 方法取消订阅
if (false) {
  myEmitter.off("my-event", onMessage)
}
```

另一个模块，需要导入该事件对象，在需要的条件下，触发事件，使监听器被调用

```js
// a.js
import { myEmitter } from "./b.js"

// 如果该事件对象上的事件名称上已经有监听器，则触发
if (myEmitter.listeners("my-event")?.length) {
  myEmitter.emit("my-event", { some: "data" })
} else {
  consoel.log("my-event 事件上暂无监听器")
}
```

## 通道名称和内置通道

不管是在 channel 或 traceChannel 中，通道应遵循一定的可预测的模式：

- `tracing:module.class.method:start` 或 `tracing:module.function:start`
- `tracing:module.class.method:end` 或 `tracing:module.function:end`
- `tracing:module.class.method:asyncStart` 或 `tracing:module.function:asyncStart`
- `tracing:module.class.method:asyncEnd` 或 `tracing:module.function:asyncEnd`
- `tracing:module.class.method:error` 或 `tracing:module.function:error`

比如 Nodejs 内置模块的提供的某些通道：

- HTTP Client
  - `http.client.request.start` 当客户端开始请求时触发。 订阅函数的入参 `request <http.ClientRequest>`
  - `http.client.response.finish` 当客户端收到响应时触发。订阅函数的入参 `request <http.ClientRequest> / response <http.IncomingMessage>`
- HTTP Server
  - `http.server.request.start` 当服务器收到请求时触发。订阅函数的入参 `request <http.IncomingMessage> / response <http.ServerResponse> / socket <net.Socket> / server <http.Server>`
  - `http.server.response.finish` 服务器发送响应时触发。订阅函数的入参 `request <http.IncomingMessage> / response <http.ServerResponse> / socket <net.Socket> / server <http.Server>`
- NET
  - `net.client.socket` 创建新的 TCP 或管道客户端套接字时触发。订阅函数的入参 `socket <net.Socket>`
  - `net.server.socket` 当接收到新的 TCP 或管道连接时触发。订阅函数的入参 `socket <net.Socket>`
  - `tracing:net.server.listen:asyncStart` 在实际设置端口或管道之前，调用 `net.Server.listen()` 时触发。订阅函数的入参 `server <net.Server> / options <Object>`
  - `tracing:net.server.listen:asyncEnd` 当 `net.Server.listen()` 完成并因此服务器准备好接受连接时触发。订阅函数的入参 `server <net.Server>`
  - `tracing:net.server.listen:error` 当 `net.Server.listen()` 返回错误时触发。订阅函数的入参 `server <net.Server> / error <Error>`
- UDP
  - `udp.socket` 创建新的 UDP 套接字时触发。访问函数的入参 `socket <dgram.Socket>`
- 进程
  - child_process 创建新进程时触发。订阅函数的入参 `process <ChildProcess>`
- 工作线程
  - worker_threads 创建新线程时触发。订阅函数的入参 `worker Worker`

HTTP Server 示例

```js
import { createServer } from "node:http"
import { subscribe, tracingChannel, channel } from "node:diagnostics_channel"

// 使用内置通道，访问 HTTP 服务请求进入时
subscribe(
  "http.server.request.start",
  ({ request, response, socket, server }, name) => {
    console.log("name >>>", name)
    console.log("request url >>>", request.method, request.url)
  }
)

const server = createServer((req, res) => {
  res.end("Hello Channel!")
})

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/")
})
```

## 应用场景

Diagnostics Channel 提供了一个灵活的机制，允许不同部分的代码相互沟通，但是又不需要直接依赖对方。这使得代码更加模块化、可维护，并且能够更容易地进行监控和调试。

- 监控和日志记录：你可以使用 diagnostics_channel 来收集关于你的应用程序性能和行为的信息，然后将其用于监控、警报或日志记录。
- 插件系统：如果你在构建一个支持插件的应用程序，diagnostics_channel 可以让插件作者订阅特定事件，而不必更改核心代码库。
- 调试和故障排除：在开发过程中，你可以订阅应用程序的关键部分的通道，以帮助理解流程和识别问题。

示例1：性能监控：你可以创建一个 performance-monitor 频道来发送应用的性能相关数据。这样，监控工具可以订阅这个频道，并实时接收性能数据进行分析。

```js
import { channel } from "node:diagnostics_channel"

const perfChannel = channel("monitor:performance")

// 假设这个函数用于监测应用性能并且会周期性地被调用，以便发布当前应用信息
function monitorPerformance() {
  const performanceData = {
    cpuUsage: process.cpuUsage(),
    memoryUsage: process.memoryUsage(),
  }
  perfChannel.publish(performanceData)
}

// 开始监控应用性能
setInterval(monitorPerformance, 1000)
```

然后在 APM 模块中，可以监听该事件，收集性能数据作处理。

```js
import { subscribe } from "node:diagnostics_channel"
// 监控工具部分
subscribe("monitor:performance", (data) => {
  console.log("Monitoring data received:", data)
})
```

示例2：错误处理：你可以创建一个 error-logger 频道来发送错误日志。这样，错误日志系统可以订阅这个频道，当应用出错时接收错误信息并记录下来。

```js
import { channel } from "node:diagnostics_channel"

const errorChannel = channel("logger:error")

// 假设这个函数在应用中的某处，当发生错误时被调用
function handleError(error) {
  errorChannel.publish({ error: error.message, timestamp: new Date() })
}

// 模拟一个错误
try {
  // Code that might throw an error
  throw new Error("Something went wrong!")
} catch (error) {
  handleError(error)
}
```

然后在日志模块，监听该事件，收集错误日志数据作处理。

```js
// logger.js
import { subscribe } from "node:diagnostics_channel"
// 错误日志系统部分
subscribe("logger:error", (data) => {
  console.error("Error occurred:", data)
})
```

## 绑定 Store

> 上下文是指在编程中保存状态和变量的一种方式。例如，当你在应用程序中进行网络请求时，你可能需要保持用户的认证信息，这些信息就可以存储在一个上下文中。

- `channel.bindStore(store[, transform])` 给定的上下文数据将应用于绑定到通道的任何存储。如果存储已经绑定，则之前的 transform 功能将被替换为新功能。可以省略 transform 函数以将给定的上下文数据直接设置为上下文。
  - store 是一个存在 `run()` 方法的对象，你希望在整个异步操作期间保持可追踪和使用。
  - transform 是一个可选的函数，你可以通过它转换或过滤存储 runStore 方法中传递的 context 。
- `channel.unbindStore(store)` 解绑操作
- `channel.runStores(context, fn[, thisArg[, ...args]])` // `tracePromise / traceSync / traceCallback` 函数的内部实现就基于此方法。

store 可以让库的开发者和应用程序开发者在需要时共享上下文状态，而不需要显式传递参数。这对于跨越多个异步边界的复杂应用程序特别有用。

> TODO 不明白有什么实际应用场景
> [Nodejs diagnostics_channel 模块源代码 ](https://github.com/nodejs/node/blob/main/lib/diagnostics_channel.js)

> 2024-06-29 bindStore 的作用之一，用于在多个异步任务之间保存数据，以及事件发布时可以获取以前发布时保存的数据。
> 因为 channel.push(message) 和 subscribe(onMessage) 只能单次发布和订阅之间传递 message。如果多次发布之前要共享以前发布的数据可以通过 bindStore 实现。

示例：通过共享 store 来记录每个请求对数据库的查询次数。

文件1：constants.js 定义一个通道名称常量

```js
// constants.js
export const REQUEST_CHANNEL = "http:server:request"
```

文件2：store.js 定义一个公共存储库，并绑定于特定的通道，用于共享数据

```js
// store.js
import { channel } from "node:diagnostics_channel"
import { REQUEST_CHANNEL } from "./constants.js"

const store = {
  count: 0,
  // 必须声明一个 run 方法
  run(ctx, publish) {
    // ctx 为 bindStore(store, transfer) 中 transfer 函数返回结棍
    this.count += ctx.count

    console.log(`累计数据库查询 ${this.count} 次`)

    // 是否在 runStore 的同时，接着进行发布
    // publish = () => {
    //   this.publish(ctx);
    //   return ReflectApply(fn, thisArg, args);
    // };
    publish()
  },
}

// 如果当前 REQUEST_CHANNEL 通道存在，刚直接返回当前通道实例
const requestChannel = channel(REQUEST_CHANNEL)

// channel.bindStore(store[, transform]) 源码中，transform 默认函数就是 (data) => { return data; }
requestChannel.bindStore(store, (ctx) => {
  return ctx
})
```

文件3：server.js

```js
import { handleRequest } from "./controller.js"

const server = createServer(async (req, res) => {
  await scheduler.wait(2000)

  // 假设 handleRequest 是一个异步函数，它内部可能执行多个数据库查询
  await handleRequest(req)

  res.end("Hello Channel BindStore")
})

server.listen(3000, () => {
  console.log("🚀 ~ Server running at http://localhost:3000/")
})
```

文件4：controller.js

```js
import { scheduler } from "node:timers/promises"
import { channel } from "node:diagnostics_channel"
import { REQUEST_CHANNEL } from "./constants.js"

export async function handleRequest(req) {
  let count = random(1, 5)

  for (let i = 0; i < count; i++) {
    await makeQuery()
  }

  // 获取当前通道，并将查询次数存入 store，并进行消息发布
  const reqChannel = channel(REQUEST_CHANNEL)
  reqChannel.runStores({ count: ++count }, () => {})
}

// 模拟进行数据库查询
async function makeQuery() {
  await scheduler.wait(2000)
}

// 生成随机数
function random(min, max) {
  return min + Math.floor(Math.random() * (max - min))
}
```

文件5：订阅事件

```js
import { channel } from "node:diagnostics_channel"

subscribe(REQUEST_CHANNEL, (message, name) => {
  console.log(name, message)
})
```

## tracingChannel

TracingChannel channels 实际上是用来定义一批成组的通道（channels），是多个 diagnostics_channels 的集合，表示单个可跟踪操作的执行生命周期中的各个特定阶段。

假设现在开发一个插件系统，自然要有一些生命周期的钩子函数暴露给应用者调用，比如插件执行的开始和结束阶段。那么我们可以创建开始通道和结束通道，外部开发者只需要监听这两个通道就可以获取插件对应阶段的信息。

约定通道名称为 `tracing:plugin:start / tracing:plugin:end`

```js
// plugin.js
import { channel } from "node:diagnostics_channel"

// 声明两个通道
const channelStart = channel("tracing:plugin:start")
const channelEnd = channel("tracing:plugin:end")

export function plugin() {
  console.time("plugin")
  // 开始通道发布消息
  channelStart.publish({ timestamp: Date.now() })

  // 插件逻辑
  for (let i = 0; i < 10000; i++) {}

  // 结束通道发布消息
  channelEnd.publish({ timestamp: Date.now() })
  console.timeEnd("plugin")
}
```

然后使用插件的应用中可以监听这两个通道

```js
// app.js
import { subscribe } from "node:diagnostics_channel"
import { plugin } from "./plugin.js"

subscribe("tracing:plugin:start", (message, name) => {
  console.log(name, message)
})

subscribe("tracing:plugin:end", (message, name) => {
  console.log(name, message)
})

plugin()
```

上述例子中，start 和 end 两个通道就可以视为成组的通道，此时可以用 TraceChannel 的方法来定义通道。插件内创建通道的代码重构如下：

```js
const tc = tracingChannel("plugin")

function plugin() {
  console.time("plugin")
  tc.start.publish({ timestamp: Date.now() })

  for (let i = 0; i < 10000; i++) {}

  tc.end.publish({ timestamp: Date.now() })
  console.timeEnd("plugin")
}

plugin()
```

所以 `diagnostics_channel.tracingChannel(nameOrChannels)` 方法用来创建一批成组的通道，并且约定了特定的事件类型 eventType 和通道名称 `tracing:${name}:${eventType}`：

- `start` 对应的通道名称 `tracing:${name}:start`，表示函数调用开始的时间点
- `end` 对应的通道名称 `tracing:${name}:end`，表示函数调用结束的时间点
- `asyncStart` 对应的通道名称 `tracing:${name}:asyncStart`，表示异步函数的回调函数开始调用，或者 Promise 对象的 resolve / reject 调用的时间点
- `asyncEnd(event)` 对应的通道名称 `tracing:${name}:asyncEnt`，表示异步函数的回调函数调用结束，或 Promise 对象返回 resolve / reject 结果的的时间点
- `error(event)` 对应的通道名称 `tracing:${name}:error`，表示跟踪的同步函数产生错误，或者 Promise 对象抛出 reject 结果。

这样做的目的是为了能够追踪 Node.js 应用中的特定活动，比如异步操作的开始和结束、性能瓶颈等。

并且 TracingChannel 类的实例还提供了三个便捷方法，用于跟踪一个同步函数，或 Promise 函数，或某个回调函数，被调用的生命周期。

- 类：TracingChannel
  - `tracingChannel.traceSync(fn[, context[, thisArg[, ...args]]])`
  - `tracingChannel.traceCallback(fn, position, context, thisArg, ...args)`
  - `tracingChannel.tracePromise(fn[, context[, thisArg[, ...args]]])`
  - `tracingChannel.subscribe(subscribers)`
  - `tracingChannel.unsubscribe(subscribers)`

下面以追踪一个 Promise 函数的调用，作为示例。

```js
import { tracingChannel, subscribe } from "node:diagnostics_channel"

async function fetchData(url) {
  // 模拟从网路获取数据的延迟
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url === "http://example.com") {
        resolve("data") // 假设获取数据成功
      } else {
        reject(new Error("Invalid URL")) // 假设URL无效导致数据获取失败
      }
    }, 1000)
  })
}

// 订阅 promiseFn 跟踪通道的事件
subscribe("tracing:promiseFn:start", (message, name) => {
  console.log(name, message)
})
subscribe("tracing:promiseFn:end", (message, name) => {
  console.log(name, message)
})
subscribe("tracing:promiseFn:asyncStart", (message, name) => {
  console.log(name, message)
})
subscribe("tracing:promiseFn:asyncEnd", (message, name) => {
  console.log(name, message)
})
subscribe("tracing:promiseFn:error", (message, name) => {
  console.log(name, message)
})

const tc = tracingChannel("promiseFn")

tc.subscribe({
  start(message) {
    console.log("🚀 ~ tracingChannel start ~ message:", message)
  },
  end(message) {
    console.log("🚀 ~ tracingChannel end ~ message:", message)
  },
  asyncStart(message) {
    console.log("🚀 ~ tracingChannel asyncStart ~ message:", message)
  },
  asyncEnd(message) {
    console.log("🚀 ~ tracingChannel asyncEnd ~ message:", message)
  },
  error(message) {
    console.log("🚀 ~ tracingChannel error ~ message:", message)
  },
})

// 使用 tracePromise 来跟踪 fetchData 函数
tc.tracePromise(
  fetchData,
  { description: "Fetching data" }, // context
  null, // thisArg
  "http://example.com" // args
)
  .then((data) => {
    console.log("Fetched data:", data)
  })
  .catch((error) => {
    console.error("Error fetching data:", error)
  })
```

输出结果：`subscribe` 和 `tc.subscribe` 的顺序，谁先订阅，就谁先调用。

```
tracing:promiseFn:start { description: 'Fetching data' }
🚀 ~ tracingChannel start ~ message: { description: 'Fetching data' }
tracing:promiseFn:end { description: 'Fetching data' }
🚀 ~ tracingChannel end ~ message: { description: 'Fetching data' }
tracing:promiseFn:asyncStart { description: 'Fetching data', result: 'data' }
🚀 ~ tracingChannel asyncStart ~ message: { description: 'Fetching data', result: 'data' }
tracing:promiseFn:asyncEnd { description: 'Fetching data', result: 'data' }
🚀 ~ tracingChannel asyncEnd ~ message: { description: 'Fetching data', result: 'data' }
Fetched data: data
```

这就是 tracingChannel 通道的作用，可以用于函数调试或 APM 的性能监控。
