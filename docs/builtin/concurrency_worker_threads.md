# worker_threads 工作线程

## What 线程是什么

线程是什么，见 [程序、进程、线程、协程、阻塞I/O、非阻塞I/O、同步、异步、并发](./concurrency_index.md)

## Why 为什么需要线程

Node.js 的底层架构非常独特，它基于 V8 引擎和 libuv 库，采用“单线程事件循环 + 异步非阻塞 I/O”模型。这意味着它的 JavaScript 执行层（V8）是单线程的，非常适合处理高并发的 I/O 密集型任务（如网络请求、数据库查询）；但在面对 CPU 密集型任务（如图像处理、复杂加密、大数据计算）时，单线程会导致事件循环阻塞，进而影响整个服务的响应。

所以 nodejs 提供了 worker_threads / child_process / cluster 等模块来能很好解决此类 CPU 密集型任务。

其中 worker_threads 与 child_process / cluster 衍生新的子进程不同，worker_threads 工作线程仍然工作在 nodejs 主进程中，可以与 nodejs 程序执行的主线程共享当前进程的内存资源。它们通过传输 ArrayBuffer 实例或共享 SharedArrayBuffer 实例来实现。

Worker Threads 允许你创建额外的线程，运行 JavaScript 和 Node.js 的 API，而不必阻塞主线程。这意味着你可以在后台线程中执行计算或其他任务，而主线程继续响应用户请求或其他 I/O 操作。

## worker_threads 模块

worker_threads 模块的核心对象、属性及方法

| 对象/属性/方法     | 类型   | 说明                                                                                      |
| :----------------- | :----- | :---------------------------------------------------------------------------------------- |
| Worker             | 类     | 代表一个独立的 JavaScript 执行线程。主线程通过它来创建工作线程。                          |
| isMainThread       | 布尔值 | 如果当前代码不在 Worker 线程内运行则为 `true`，用于区分主线程与工作线程。                 |
| parentPort         | 对象   | 在工作线程中可用，是一个 `MessagePort`，用于与父线程（主线程）进行双向消息通信。          |
| workerData         | 任意值 | 包含初始化 Worker 时传入的数据副本，在工作线程中可以直接读取。                            |
| postMessage()      | 方法   | 用于在线程之间异步发送消息。数据会通过结构化克隆算法进行序列化（大对象会有性能开销）。    |
| SharedArrayBuffer  | 对象   | 允许在多个线程之间共享原始二进制数据，实现真正的零拷贝共享内存（需配合 `Atomics` 使用）。 |
| worker.terminate() | 方法   | 用于强制终止工作线程的执行并释放相关资源。                                                |

## 基本使用

假设我们正在开发一个服务，该服务需要处理大量图片的压缩。如果我们只使用 Node.js 的单个主线程来执行这项任务，那么在处理这些耗时的操作时，我们的应用将无法同时处理其他任何事情（如响应用户请求）。这会导致用户体验非常差，尤其是在高负载时。

下面通过一个计算斐波那契数列的经典 CPU 密集型任务，来演示主线程与工作线程的交互：

1. 创建工作线程逻辑 (fibonacciWorker.js)

```js
const { parentPort, workerData } = require("worker_threads")

// 模拟耗时的 CPU 密集型计算
function calculateFibonacci(n) {
  if (n <= 1) return n
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2)
}

// 监听来自主线程的消息，并返回计算结果
parentPort.on("message", (n) => {
  const result = calculateFibonacci(n)
  parentPort.postMessage({ n, result })
})
```

2. 主线程调用 (main.js)

```js
const { Worker } = require("worker_threads")

console.log("主线程开始，准备分配任务...")

// 创建一个新的工作线程，并传入初始化数据
const worker = new Worker("./fibonacciWorker.js", {
  workerData: { num: 40 }, // 传入初始参数
})

// 监听工作线程发来的消息
worker.on("message", (data) => {
  console.log(`工作线程计算完成：第 ${data.n} 个斐波那契数为 ${data.result}`)
})

// 监听工作线程的错误
worker.on("error", (err) => {
  console.error("工作线程发生错误:", err)
})

// 监听工作线程退出
worker.on("exit", (code) => {
  if (code !== 0) {
    console.error(`工作线程异常退出，退出码: ${code}`)
  } else {
    console.log("工作线程正常退出")
  }
})

// 向工作线程发送计算指令
worker.postMessage(40)

console.log("主线程继续处理其他 I/O 任务，未被阻塞...")
```

## isMainThread

`isMainThread` 主要用于程序代码判断当前是运行在主线程还是子线程中。

比如上述独立的 `image-compress.js` 文件，可能在图片压缩完成后，向外发出处理完成的通知。该文件可以直接在主线程中被执行，也可以加载到子线程中执行，所以在 image-compress.js 文件内部的通知逻辑需要判断，当处于不同执行环境时通知不同的处理方式。

```js
const { isMainThread, parentPort } = require("node:worker_threads")

if (isMainThread) {
  // 在主线程中直接被执行，直接在控制台输出压缩完成的消息
  console.log("Compression task completed.")
} else {
  // 在子线程中被执行，则需要通知主线程，图片已压缩完成。在主进程中通过 `worker.on('message', (msg) => {})` 接收消息
  parentPort.postMessage("Compression task completed.")
}
```

## 线程退出

- 在主线程中，调用持有的 worker 对象的 `worker.terminate()` 退出，返回 promise ，让子线程尽快停止执行，并在结束时触发 exit 事件，并将 promise 置为 resolved 状态。
- 在子线程中，直接调用 `process.exit(0)` 退出。

在主线程中可以调用 `worker.terminate()` 主动让子线程退出。并且在主线程中可以监听子线程的 exit 事件。

```js
// main.js
import { Worker } from "node:worker_threads"

const worker = new Worker("./worker.js")

worker.on("message", (message) => {
  console.log(`main thread received: `, message)
})

worker.on("exit", (exitCode) => {
  console.log("on exit: ", exitCode)
})

// setTimeout(() => {
//   worker.terminate()
// }, 1000)
```

在子线程中，直接调用 `process.exit(0)` 退出。

```js
import { parentPort, threadId } from "node:worker_threads"

// 5s秒定时任务执行完才能退出
setTimeout(() => {
  parentPort.postMessage(`thread ${threadId} done`)
  process.exit(0)
}, 5000)

// let start = hrtime.bigint()
// let count = 0
// // 进行一亿次计算
// for (let i = 0; i < 1e8; i++) {
//   count += i
// }

// let end = hrtime.bigint()

// let duration = (end - start) / 1000n / 1000n
// parentPort.postMessage(
//   `thread ${threadId} calculation done: ${count}, time: ${duration} ms`
// )
// process.exit(0)
// // 1s【秒】 = 1000ms【毫秒】   1ms【毫秒】 = 1000μs【微秒】    1μs【微秒】 = 1000ns【纳秒】   1ns 【纳秒】= 1000ps【皮秒】
```

上述中如果打开主线程主动关闭子线程，则没有接收到子线程 `thread 1 done` 的消息，这是因为主线程主动关闭worker时，worker子线程里处于等待的宏任务不会再执行了，所以setTimeout里的log也不会打印出来。但是如果是非宏任务，则会在处理完毕后再退出。

> TODO：但是用一个长时间的计算任务，好像也是不会输出，而是直接关闭了。可以认为主应用调用 worker.terminate() 是直接就让子线程终止的。

## 通信

通信的目的主要是进行消息传递，有以下几种方式：

- workerData 主线程在创建子线程间时，在 new Worker 时通常第二个选项对象时传入，子线程通过导入 workerData 对象接收
- EnvironmentData 和 SHARE_ENV 通过环境变量传递数据
- MessageChannel 消息通道。
  - 特点的一点是，在创建一个线程时，默认就开通了一个消息通道用于主线程和子线程间通信。在主线程中通过持有的 worker 对象向子线程发送消息和监听消息，子线程中通过导入 parentPort 对象向主线程发送消息和监听消息。
- BroadcastChannel 遵循 web BroadcastChannel 标准实现的消息通道，可以替代 MessageChannel 功能。
- postMessageToThread nodejs@v22.5.0 新增，子线程中向指定的另一个子线程发送消息。通往传入 worker.threadId 来指定，目标线程内通过监听 workerMessage 事件。

### workerData

worker.workerData 是在创建 Worker 线程时，通过 Worker 构造函数的第二个参数传入的数据的一个引用。这意味着，你可以在主线程发送数据到工作线程。

比如上述例子中，在创建图片压缩的工作线程时，需要将图片地址通过 workerData 传入。

基本使用方式：

1. 创建 Worker 线程时，通过 Worker 构造函数的第二个参数传入的数据
2. 在 worker 线程中接收数据，需要通过 worker_threads 模块导入 workerData

```js
const { isMainThread, parentPort, workerData } = require("node:worker_threads")

if (isMainThread) {
  const worker = new Worker(__filename, {
    workData: { imagePath: "/path/to/image.jpg" },
  })
} else {
  console.log("子线程接收到的图片地址 path: ", workerData.imagePath)
}
```

### EnvironmentData 和 SHARE_ENV

- `setEnvironmentData(key[, value])` 设置或更新环境变量的键值对数据。
- `getEnvironmentData(key)` 获取环境变量键 key 对应的值 value。

观察下面例子的输出结果

1. 分别新建三个线程文件 worker1.js worker2.js worker3.js，都接收主线程设置的 foo 环境变量，区别在于 worker2.js 中在当前自己的子线程上下文中设置了一个新的 bar 环境变量

```js
// worker2.js
import { getEnvironmentData, threadId, parentPort } from "node:worker_threads"
setTimeout(() => {
  const fooValue = getEnvironmentData("foo")
  const barValue = getEnvironmentData("bar")

  console.log(
    `Worker Thread ${threadId} get foo = ${fooValue}; bar = ${barValue}`,
  )

  parentPort.postMessage({ foo: fooValue, bar: barValue })
}, 2000)

// worker2.js
setEnvironmentData("bar", "bar")
const fooValue = getEnvironmentData("foo")

fooValue.foo = "456"

const barValue = getEnvironmentData("bar")

console.log(
  `Worker Thread ${threadId} get foo = ${fooValue}; bar = ${barValue}`,
)

parentPort.postMessage({ foo: fooValue, bar: barValue })

// worker3.js 相同代码

const fooValue = getEnvironmentData("foo")
const barValue = getEnvironmentData("bar")

console.log(
  `Worker Thread ${threadId} get foo = ${fooValue}; bar = ${barValue}`,
)

parentPort.postMessage({ foo: fooValue, bar: barValue })
```

1. 然后主线程中执行如下代码

```js
import { Worker, setEnvironmentData } from "node:worker_threads"

const worker1 = new Worker("./worker1.js")
const worker2 = new Worker("./worker2.js")

setEnvironmentData("foo", { foo: 123 })

const worker3 = new Worker("./worker3.js")

worker1.on("message", (data) => {
  console.log(`received thread ${worker1.threadId} message: `, data)
})

worker2.on("message", (data) => {
  console.log(`received thread ${worker2.threadId} message: `, data)
})

worker3.on("message", (data) => {
  console.log(`received thread ${worker3.threadId} message: `, data)
})
```

控制台输出结果：

```
Worker Thread 2 get foo = [object Object]; bar = bar
received thread 2 message:  { foo: { foo: '456' }, bar: 'bar' }
Worker Thread 3 get foo = [object Object]; bar = undefined
received thread 3 message:  { foo: { foo: 123 }, bar: undefined }
Worker Thread 1 get foo = undefined; bar = undefined
received thread 1 message:  { foo: undefined, bar: undefined }
```

从上述结果可以看出：

- 在子线程内部设置环境变量，只可以在当前子线程内使用，其它线程无法读取
- 在主线程内设置环境变量，则在设置之前的子线程内无法获取，即使延迟获取无法得到。但在设置之后创建的子线程可以读取到主线程设置的环境变量。
- 在主线程中，每当新建的 Worker 时，都会克隆一份当前主线程的环境变量的副本传给新建的子线程，不存在对象引用关系。

默认情况下，每个 Worker 线程在创建时有自己的环境变量副本，与父线程隔离。但如果你想让所有线程都能访问同样的环境变量，比如一些数据库等配置数据，就可以在创建线程时设置 SHARE_ENV，以便让子线程共享主线程的环境变量。

```js
import { parentPort } from "node:worker_threads"
if (isMainThread) {
  // 主线程
  process.env.SECRET_KEY = "mysecretkey" // 设置环境变量

  // 创建一个 Worker 线程，使用 SHARE_ENV 来共享环境变量
  const worker = new Worker(new URL(import.meta.url), { env: SHARE_ENV })

  worker.on("message", (msg) => console.log(`从 Worker 收到的秘密键: ${msg}`))
} else {
  // Worker 线程的代码
  parentPort.postMessage(process.env.SECRET_KEY) // 使用共享的环境变量
}
```

这种方式使得所有线程都能以一致的方式访问环境变量，无需额外的同步机制，从而简化了线程间共享配置信息的处理。尤其是需要共享配置数据时，提供了一个非常便利的解决方案。

### MessageChannel

MessageChannel 类是一个基于事件的双向通信通道。它供了一种通信机制，使得主线程和 Worker 线程或者不同的 Worker 线程之间可以互相发送消息。

MessageChannel 没有自己的方法，new MessageChannel() 产生具有 port1 和 port2 属性的对象，port1 和 port2 属性值是 MessagePort 类的实例，具有它上面的属性和方法。

```
类：MessagePort
port.postMessage(value[, transferList])
port.start()
port.close()
port.ref()
port.unref()
port.hasRef()
事件：'close'
事件：'message' 接收对应 port 调用 postMessage 发送的消息
事件：'messageerror'
```

简单示例：

```js
const { MessageChannel } = require("node:worker_threads")

const { port1, port2 } = new MessageChannel()

port1.on("message", (message) => console.log("received", message))

port2.postMessage({ foo: "bar" })
// 输出: received { foo: 'bar' } from the `port1.on('message')` listener
```

在但实际使用时，port 对象可以通过在创建子线程时，通过 workerData 传入，在子线程内部使用。

示例：在主线程内创建一个消息通道，返回 port1 和 port2 分别传入子线程 worker1 和 worker2 中进行通信。

```js
// worker1.js
import { workerData, threadId } from "node:worker_threads"

const messagePort = workerData.port

messagePort.on("message", (message) => {
  console.log(`thread ${threadId} received: `, message)
})

setTimeout(() => {
  messagePort.postMessage("worker1")
}, 100)

// worker2.js
import { workerData, threadId } from "node:worker_threads"

const messagePort = workerData.port

messagePort.on("message", (message) => {
  console.log(`thread ${threadId} received: `, message)
})

setTimeout(() => {
  messagePort.postMessage("worker2")
}, 1000)
```

然后在主线程中创建消息通道，并传入到子线程。

```js
import { Worker, MessageChannel } from "node:worker_threads"

const { port1, port2 } = new MessageChannel()

const worker1 = new Worker("./worker1.js", {
  workerData: { port: port1 },
  transferList: [port1],
})

const worker2 = new Worker("./worker2.js", {
  workerData: { port: port2 },
  transferList: [port2],
})
```

MessageChannel 能用于线程间通信，自然也能用于主线程和子线程的通信。

```js
import {
  isMainThread,
  Worker,
  MessageChannel,
  workerData,
  threadId,
} from "node:worker_threads"

if (isMainThread) {
  const { port1, port2 } = new MessageChannel()

  const worker = new Worker(new URL(import.meta.url), {
    workerData: { port: port2 },
    transferList: [port2],
  })

  port1.on("message", (message) => {
    console.log(`main received: `, message)
  })
  port1.postMessage("main thread")
} else {
  const port = workerData.port

  port.on("message", (message) => {
    console.log(`thread ${threadId} received: `, message)
  })

  setTimeout(() => port.postMessage("worker thread"), 500)
}
```

但是，主线程与子线程的通信，并不需要像上面一样，需要手动创建消息通道。nodejs 在 new Worker 时就会自动创建一个主线程与子线程的通信通道。

- worker：在主线程创建子线程时返回的线程实例，继承 MessagePort 类，所以可以监听消息和通过 `worker.postMessage` 向子线程发送消息。
- parentPort：在子线程中，可以通过引入 parentPort 对象，它也是一个 MessagePort 实例，可以用它来监听主线程消息和向主线程发送消息。

所以上述示例可以修改为这样：

```js
import { isMainThread, Worker, threadId, parentPort } from "node:worker_threads"

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url))
  worker.on("message", (message) => {
    console.log(`main received: `, message)
  })
  worker.postMessage("main message")
} else {
  parentPort.on("message", (message) => {
    console.log(`thread ${threadId} received: `, message)
  })

  setTimeout(() => parentPort.postMessage("worker thread"), 500)
}
```

上述通过 message 事件监听处理消息，可以说是自动接收，也可以说是被动接收。如果我们需要在处理一定逻辑之后，才开始接收消息，或者说每次处理完一定的逻辑后才接收下一条消息，等等情形，都是主动处理消息的情况。此时可以使用 `receiveMessageOnPort(port)` 方法。

```js
if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url))

  let count = 0
  let interval = setInterval(() => {
    worker.postMessage("main message: " + ++count)

    if (count >= 10) {
      clearInterval(interval)
    }
  }, 500)
} else {
  // 自动接收，或者说被动接收
  // parentPort.on("message", (message) => {
  //   console.log(`thread ${threadId} received: `, message)
  // })

  // 主动接收，每隔二秒读取一次消息
  let timer = setInterval(() => {
    const message = receiveMessageOnPort(parentPort)

    if (message) {
      console.log(`thread ${threadId} received: `, message) // 返回一个对象，包括 message 属性。 {message}
    } else {
      clearInterval(timer)
    }
  }, 2000)
}
```

> 在 web API 中，MessageChannel 用于两个不同的脚本运行在同一个文档的不同浏览器上下文中进行通讯。比如 两个 iframe之间，文档主体和一个 iframe之间，使用 SharedWorker 的两个文档之间，或者两个 worker 之间。
>
> Broadcast Channel API 允许浏览上下文（即 window、tab、frame 或 iframe）与同源的 worker 之间进行基本通信。

### BroadcastChannel

```
类：BroadcastChannel extends EventTarget
new BroadcastChannel(name)
broadcastChannel.close()
broadcastChannel.onmessage
broadcastChannel.onmessageerror
broadcastChannel.postMessage(message)
broadcastChannel.ref()
broadcastChannel.unref()
```

BroadcastChannel 是一个发布订阅模式，基于 Nodejs 事件 EventEmitter 机制，它允许不同的线程订阅和发布消息。当发布消息时，所有同频道的订阅者都会收到消息。

基本步骤：

1. 创建广播通道： 首先，在需要通信的各个工作线程中创建同名的BroadcastChannel。
2. 发送消息： 然后，任何一个线程都可以通过这个通道发送消息。
3. 接收消息： 其他所有订阅了该通道（即创建了同名BroadcastChannel）的线程都能接收到这个消息，并根据需要进行处理。

```js
// worker1.js
import { BroadcastChannel, threadId } from "node:worker_threads"

const channel = new BroadcastChannel("custom_channel")

channel.onmessage = (evt) => {
  console.log(`thread ${threadId} received: `, evt.data)
}

setTimeout(() => {
  channel.postMessage(`thread ${threadId} send message`)
}, 1000)
```

```js
// worker2.js
import { BroadcastChannel, threadId } from "node:worker_threads"

const channel = new BroadcastChannel("custom_channel")

channel.onmessage = (evt) => {
  console.log(`thread ${threadId} received: `, evt.data)
}
```

```js
import { BroadcastChannel, Worker } from "node:worker_threads"

const channel = new BroadcastChannel("custom_channel")

channel.onmessage = (evt) => {
  console.log("main thread received: ", evt.data)

  channel.postMessage("main thread send message")
}

const worker1 = new Worker("./worker1.js")
const worker2 = new Worker("./worker2.js")
```

此时消息输出

```
main thread received:  thread 1 send message
thread 2 received:  thread 1 send message
thread 1 received:  main thread send message
thread 2 received:  main thread send message
```

### MessageChannel 和 BroadcastChannel

这两个即是 Node Api，也是 Web Api。下面内容是 gpt 自动生成的，主要指 web Api。

MessageChannel 和 BroadcastChannel 都是 HTML5 提供的用于在不同环境或上下文之间进行通信的机制，但它们之间存在几个关键的区别，主要体现在通信范围、通信方式以及使用场景上。

- MessageChannel
  - 通信场景：它的通信范围主要限制在同一窗口或 Web Worker 内的不同上下文之间。例如，它可以在两个 Web Worker 之间、父级窗口与子级窗口（如 iframe）之间，或在同一个窗口内的不同脚本之间建立双向通信通道。
  - 通信方式：一对一，通过创建一个消息通道（MessageChannel），该通道包含两个 MessagePort 端口（port1 和 port2）。这两个端口可以相互发送和接收消息，从而实现双向通信。发送方使用 port.postMessage() 方法发送消息，接收方则通过为 MessagePort 添加 'message' 事件监听器来接收消息。
  - 劣势：无法跨越浏览器标签页进行通信，即它不支持在不同标签页或窗口之间的直接通信。此点在 nodejs 中不存在。
- BroadcastChannel
  - 通信场景：它的通信范围则更广泛，允许在同一域名下的多个浏览器窗口、标签页或 iframe 之间进行实时消息广播。例如，可以在一个标签页中更新数据，并实时将更新通知给所有其他连接到同一频道的标签页。
  - 通信方式：广播的方式一对多，通过创建一个广播频道（BroadcastChannel），并指定频道的名称来建立通信。所有连接到同一频道的窗口或标签页都能接收到发送的消息。发送方使用 channel.postMessage() 方法发送消息，而接收方则通过为 BroadcastChannel 实例添加 'message' 事件监听器来接收消息。

### ref / unref

不管是创建 MessageChannel 产生的 MessagePort 实例对象，还是 BroadcastChannel 产生的实例对象， 还是 worker 实例对象，都有 ref 和 unref 方法。

### ref / unref

每当你创建一个子进程时，Node.js 会在内部维护一个引用计数，以确保主程序只能在所有的子进程都已经结束了才能退出。

- `ref()`: 当你调用此方法时，它会增加内部的引用计数，确保 Node.js 的事件循环继续运行，等待该子线程或通道对象结束。即使没有其他活动保持事件循环运行，只要存在被 `.ref()` 过的子线程或通道对象引用，Node.js 程序就不会退出。
- `unref()`: 相反，调用这个方法会减少内部的引用计数，允许 Node.js 的事件循环在没有其他活动时退出，即使子线程或者通道对象还在运行。这意味着 Node.js 进程可以在所有的 unref 过的子线程或通道对象运行期间结束，而不需要等待它们完成。

## 克隆 clone、传输 transfer、共享 shared

在上面 new Worker 还是 new MessageChannel 的示例中，在向子线程传入 port 时，跟发送通道字符串消息时，有些区别。

```js
const { port1, port2 } = new MessageChannel()

const worker = new Worker("./worker1.js", {
  workerData: { port: port1 },
  transferList: [port1],
})

// 或者
worker.postMessage({ port: port1 }, [port1])
worker.postMessage({ message: "xxxx" })
```

这里就涉及到 js 中各类对象跨进程或者跨线程传递的区别。

默认情况下，js 对象会以结构化克隆的算法进行拷贝，然后传递这个副本。此时内存里会存在两份相同的数据。

但有些情况下，这个对象可能是以下几种情形：

- value 可能包含循环引用。
- value 可能包含内置 JS 类型的实例，例如 Function、RegExp、BigInt、Map、Set 等。
- value 可能包含类型化数组，同时使用 ArrayBuffer、TypedArray 和 SharedArrayBuffer。
- value 可能包含 WebAssembly.Module 实例。
- value 在 nodejs 中可能不是 js 原生对象，而是一些封装 C++ 特性的对象，比如: CryptoKey, FileHandle, MessagePort, net.SocketAddress 等。
- value 在 Web 中可能是 DomMatrix Blob File 等。

这些对象，在进行拷贝时会报错。此时若需要在线程或进程间传递这些对象，有其它两种方式：

- 传输（Transfer）: 当你传输一个 Buffer 或 TypedArray 到另一个线程时，它实际上将那块内存的所有权从一个线程转移到了另一个线程。这意味着一旦传输完成，原线程中的那个 Buffer 或 TypedArray 将变得不再可用，因为它的内容已经被移动到了新线程。
  - 这种方法的好处是效率极高，因为它避免了复制数据带来的开销。这对于需要处理大量数据并且关注性能的场景非常有用。
- 共享（Shared）: 另一种选择是使用 SharedArrayBuffer，它允许在不同的工作线程之间共享内存。这意味着多个线程可以同时读写相同的内存区域，但这也引入了必须通过某种形式的同步机制来管理访问冲突的复杂性。
  - 共享内存可能对于某些需要高度协作的线程之间的数据交换场景更为合适，但它通常需要更细致的控制来避免问题。

> [MDN 结构化克隆算法 structuredCline()](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
>
> [MDN 可转移对象 Transferable object](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Transferable_objects)
>
> [MDN SharedArrayBuffer](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)

## 资源限制和线程池

虽然工作线程极大地增强了 Node.js 的能力，使其可以执行多任务并行处理，但也带来了新的挑战：资源管理。每个工作线程都会使用系统资源，比如内存。如果不加以限制，一个工作线程可能会使用过多的资源，从而影响到整个系统的性能，甚至导致系统崩溃。

`worker.resourceLimits` 是一个选项对象(option object)，当你创建一个新的工作线程时可以提供它。通过这个对象，你可以指定该工作线程所能使用的最大资源量，例如最大的内存使用量。Node.js v21.7.1 中支持的资源限制包括：

```
maxYoungGenerationSizeMb：用于控制年轻代（young generation，一种用于垃圾回收的内存空间）的最大大小（以 MB 为单位）。
maxOldGenerationSizeMb：用于控制老年代（old generation，另一种用于垃圾回收的内存空间）的最大大小（以 MB 为单位）。
codeRangeSizeMb：限制可用于存放代码的内存大小（以 MB 为单位）。
stackSizeMb：限制线程栈的大小（以 MB 为单位），这影响到递归调用的深度等。
```

示例：

```js
const { Worker } = require("worker_threads")

const worker = new Worker("./image-processing-task.js", {
  resourceLimits: {
    maxOldGenerationSizeMb: 512, // 将老年代内存限制为512MB
    maxYoungGenerationSizeMb: 256, // 将年轻代内存限制为256MB
  },
})
```

这样无论工作线程的具体任务如何，它都不会使用超过设定限制的内存资源。这有助于防止单个工作线程占用过多资源，从而保证应用的稳定运行。

上面是对单个线程资源使用的限制，另外一个场景是限制创建线程的个数。

在进程中创建一个新线程并不是没有代价的，会产生一些开销，当无限制的允许创建非常多个线程，同样会影响当前主线程的资源使用。所以有一种实践是，维护一个线程池，里面存放了固定数量的已创建好的线程，由主线程进行分配。如果当前线程池中的所有线程都在执行程序，就进行排队等待可分配线程。
