# Cluster 集群

javascript 程序是单进程单线程的应用，这种架构带来的缺点是不能很好地利用多核的能力，因为一个线程同时只能在一个核上执行。

child_process 模块一定程度地解决了这个问题，child_process 模块使得 Node.js 应用可以在多个核上执行。

而 cluster 模块在 child_process 模块的基础上更进一步的功能增强，使得多个进程可以监听同一个端口，实现 Web 服务器的多进程的集群架构，实现高负载均衡的能力。

比如，有一个 Node 应用程序，通常它会运行在单个 CPU 核心上。但如果你的服务器有多个核心，那么你可以用 Cluster 模块来利用这些额外的 CPU 核心，提高了计算机的资源利用率和应用的吞吐量。

如何工作：

- 当 Node.js 运行 cluster 模块并调用 `cluster.fork()` 方法时，它会启动一个与主进程（primary process）相同的新进程，这个新进程被称为工作进程（worker process）。
- 主进程不负责具体的业务处理，而是负责管理工作进程，并且可以根据需要创建多个工作进程。
- 所有工作进程都是独立的进程，它们在不同的 CPU 核心上运行，并且都有自己的 V8 实例和内存空间，这样它们就不会互相干扰。
- 这些工作进程通过 IPC（Inter-Process Communication，进程间通信）与主进程通信。
- 当一个工作进程死掉（比如由于错误崩溃），主进程可以检测到这个事件并重新启动一个新的工作进程来替代它。

## 创建集群的两种方式

方式一：

```js
import cluster from "node:cluster"
import { cpus } from "node:os"
import { createServer } from "node:http"

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`)

  // Fork workers
  const cpusLength = cpus().length
  console.log("🚀 ~ cpusLength:", cpusLength)
  for (let i = 0; i < cpusLength; i++) {
    // 每次 fork() 调用会触发 fork 事件
    cluster.fork()
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
  })
} else {
  //  worker可以共享任何TCP连接，
  const server = createServer((req, res) => {
    res.writeHead(200)
    res.end(`hello world from process ${process.pid} \n`)
  })

  // listen() 调用会触发工作进程和主进程中的 listening 事件监听
  server.listen(8000)

  console.log(`Worker ${process.pid} started`)
}
```

上面代码逻辑是将主进程和子进程的代码放在了一起，也可以利用 `setupPrimary([setting])` 属性分开文件书写。

方式二：

```js
// worker.js
import { createServer } from "node:http"
createServer((req, res) => {
  res.writeHead(200)
  res.end(`hello world from process ${process.pid} \n`)
}).listen(8000)

console.log(`Worker ${process.pid} started`)
```

然后主进程入口文件更为：

```js
import cluster from "node:cluster"
import { cpus } from "node:os"

/**
 * setPrimary 设置的值，后续可以通过 cluster.setting 获取。
 * setPrimary 函数调用会触发 setup 事件
 */
cluster.setupPrimary({
  exec: "worker.js",
  silent: true,
})

// Fork workers
const cpusLength = cpus().length
console.log("🚀 ~ cpusLength:", cpusLength)
for (let i = 0; i < cpusLength; i++) {
  cluster.fork()
}
```

## 集群的通信

因为工作进程也是独立的进程，进程间通信需要通过 IPC(Inter-Process Communication) 通道，Nodejs 是典型的 IPC 通信方式就是基于 `send()` 方法和 message 的事件监听。

主进程里：

- 向对应工作进程发送消息：`worker.send(message[, sendHandle[, options]][, callback])`
- 接收工作进程的消息：`worker.on('message', (message[, sendHandle]) => {})`

工作进程里：

- 向主进程发送消息：`process.send(message[, sendHandle[, options]][, callback])`
- 接收主进程的消息：`process.on('message', (message[, sendHandle]) => {})`

```js
import cluster from "node:cluster"
import { createServer } from "node:http"

if (cluster.isPrimary) {
  console.log(`主进程 ${process.pid} 正在运行`)

  const worker = cluster.fork()

  worker.on("message", (message) => {
    console.log(`主进程，接收到子进程 ${worker.id} 的消息： `, message)

    worker.send("消息已收到！")
  })
} else {
  createServer((req, res) => {
    res.writeHead(200)
    res.end("hello world\n")
    // 向主进程发送消息。
    process.send({ url: req.url })
  }).listen(8000)

  console.log(`工作进程 ${process.pid} 已启动`)

  process.on("message", (message) => {
    console.log("接收主进程的消息: ", message)
  })
}
```

## 关闭工作子进程

在主进程里：

- `worker.disconnect()` 调用后会触发 disconnect 事件。 当你想要平滑地停止一个 worker 进程时候，可以调用该方法。调用后，它会关闭 worker 进程中服务器的所有连接，并等待这些连接自然结束（即客户端完成请求并得到响应），再关闭 worker 进程。这样可以避免因为直接终止进程而导致正在处理的请求失败，提供了更加优雅的停机方式。
- `worker.kill([signal])` 立即停止工作进程，会触发 exit 事件。

在子进程里：

- `process.exit([exitCode])`

如果子进程里执行报错等情况意外退出，主进程里可以通过监听 exit 事件进行处理，比如说重新开启一个工作进程。

```js
cluster.on("exit", (worker, code, signal) => {})
// worker 是退出的工作进程的引用
// code 是退出码（如果工作进程正常退出的话）
// signal 是如果工作进程是被信号杀死的话，那么这个参数是信号的名称。 process.kill('SIGTERM')
```

示例一：平滑退出

```js
const cluster = require("cluster")
const http = require("http")

if (cluster.isMaster) {
  // 这是Master进程代码

  // 创建一个worker进程
  const worker = cluster.fork()

  // 监听worker的'disconnect'事件
  worker.on("disconnect", () => {
    clearTimeout(timeout) // 清除超时，因为worker已经平滑退出
    console.log(`Worker #${worker.id} has disconnected`)
  })

  // 一段时间后，我们想平滑地停止这个worker
  setTimeout(() => {
    worker.disconnect() // 调用disconnect方法

    // 可以设置超时强制退出
    const timeout = setTimeout(() => {
      worker.kill() // 如果worker没有在合理时间内关闭，就强制终止
    }, 5000)
  }, 10000)
} else {
  // 这是Worker进程代码

  // 创建HTTP服务
  http
    .createServer((req, res) => {
      res.writeHead(200)
      res.end("hello world\n")
    })
    .listen(8000)
}
```

示例二：集群模式下优雅退出

- worker 进程下监听异常退出后，需要 refork
- master 进程下监听异常退出后，需要在退出前 kill 所有 worker，然后 worker 退出前关闭 server。

主进程里：

```js
// 进程相当于主线程了，可以直接监听系统信号
async function onMasterSignal() {
  const killCalls = Object.keys(cluster.workers).map((id) => {
    const worker = cluster.workers[id]
    const pid = worker.process.pid
    return process.kill(parseInt(pid, 10), signal) // 通过 process.kill 杀死 worker 进程，只会触发 SIGTERM 信号，所以 worker 内只需要监听该信号事件即可
  })
  await Promise.all(killCalls)
}

;["SIGINT", "SIGQUIT", "SIGTERM"].forEach((signal) =>
  // 注意使用一次性事件监听 once
  process.once(signal, onMasterSignal)
)

// 集群中某个 work 异常退出后，会发出 exit 事件，可以在 cluster 上进行监听
cluster.on("exit", (worker, code, signal) => {
  console.log(
    `Worker ${worker.process.pid} died, code: ${code}, signal: ${signal}`
  )

  if (signal) {
    // 如果是退出信息触发的退出，就不再 fork 新的工作进程
    return
  }

  // 移除当前子进程内所有事件监听器，避免内存泄漏
  worker.removeAllListeners()
  // refork a new worker
  cluster.fork()
})
```

工作进程里：

```js
// master 中通过 process.kill 杀死 worker 进程，只会触发 SIGTERM 信号，所以 worker 内只需要监听该信号事件即可
process.on("SIGTERM", () => {
  console.info(`Only graceful shutdown, worker ${process.pid}`)
  close()
})

function close() {
  const worker = cluster.worker
  if (worker) {
    try {
      // 使用 server.close 方法保证 http 连接处理完毕后再退出
      server.close(() => {
        try {
          // 调用 disconnect() 平滑退出
          worker.disconnect()
        } catch (err) {
          console.error(err)
        }
      })
    } catch (err) {
      console.error(err)
    }
  }
}
```

## 集群调试方式

在 cluster 集群模式部署 Web 服务时，当新的网络请求到达时，主进程如何在多个工作进程（worker processes）之间分配这些连接。主要有两种调度策略：

- Round-Robin（轮询）默认设置。
- None（操作系统分配）

### Round-Robin（轮询）

在 Round-Robin 调度中，主进程接收新的连接，并将它们依次分配给每个工作进程。这样做可以确保所有的工作进程都被平等地考虑，从而尽可能公平地分配负载。

比如，你有一个 Node.js 应用，运行在 4 个核心的 CPU 上，你想利用所有的核心来处理 HTTP 请求。使用 cluster 模块，你可以创建一个主进程和 3 个工作进程，每个工作进程监听相同的端口。使用 Round-Robin 策略，当 HTTP 请求到达时，主进程会把第一个请求发给第一个工作进程，第二个请求发给第二个工作进程，以此类推，直到所有工作进程都获得了请求，然后从头开始。

### None（操作系统分配）

如果不使用 Round-Robin 策略，Node.js 会使用操作系统的默认策略来分配网络连接。在这种情况下，工作进程直接接受新的连接，操作系统负责负载平衡。

这种默认策略的优点是，它依赖于操作系统更底层的机制来分配连接，通常这样会更高效。

实际例子： 继续上面的例子，如果我们没有设置 Round-Robin ，那么新的 HTTP 请求就由操作系统来决定它应该被哪个工作进程处理。这意味着，如果某个工作进程很忙，而其他的不那么忙，操作系统可能会选择一个当前不太忙的工作进程来处理新的连接。

### 设置调试策略

`cluster.schedulingPolicy` 可以通过环境变量或者在代码中直接设置。环境变量 `NODE_CLUSTER_SCHED_POLICY` 可以设置为 rr (表示 Round-Robin) 或 none (表示使用操作系统默认策略)。

方式一：

```sh
NODE_CLUSTER_SCHED_POLICY=rr node app.js
```

方式二：

```js
// 在代码中设置
const cluster = require("cluster")

if (cluster.isMaster) {
  // 强制使用 Round-Robin 策略
  cluster.schedulingPolicy = cluster.SCHED_RR // cluster.SCHED_NONE
  // 创建工作进程 ...
} else {
  // 工作进程代码 ...
}
```

## cluster 如何实现端口共享

cluster 能够创建多个工作进程，接收同一个端口的请求。通常来说，多个进程监听同个端口，系统会报错。那为什么在 cluster 模式下没问题呢？

秘密在于，net模块中，对 `listen()` 方法进行了特殊判断。根据当前进程是 primary 进程，还是 worker 进程：

- primary 进程：在该端口上正常监听请求。（没做特殊处理）
- worker 进程：创建 server 实例，然后通过 IPC 通道，向 primary 主进程发送消息，让主进程也创建 server 实例，并在该端口上监听请求。当请求进来时，主进程将请求转发给worker工作进程的server实例。

总结起来，就是：服务端口只在主进程上被监听，然后请求的处理被调度到具体的 worker 进程。

> [深度剖析cluster模块源码与node.js多进程（下）](https://www.cnblogs.com/dashnowords/p/11019089.html)
>
> [nodejs cluster 源码解析](https://theanarkh.github.io/understand-nodejs/chapter15-Cluster/#155)

在业务开发过程中，我们会通过 `process.on('message', fn)` 来实现进程间通信。然后 primary 主进程、worker 工作进程在 server 实例的创建过程中，也是通过 IPC 通道进行通信的。那会不会对我们的开发造成干扰呢？比如，收到一堆其实并不需要关心的消息？

答案肯定是不会，那么是怎么做到的呢？主要是一些内部自定义的消息前缀。当发送的消息包含cmd字段，且该字段值是以 `NODE_` 作为前缀，则该消息会被视为内部保留的消息，不会通过 message 事件抛出，但会通过`internalMessage` 事件抛出。

示例的伪代码

```js
// woker进程
const message = {
  cmd: "NODE_CLUSTER",
  act: "queryServer",
}
process.send(message)

// 主进程
worker.process.on("internalMessage", fn)
```

## API

```js
// 主进程 cluster 对象
cluster.isPrimary
cluster.isWorker
cluster.worker
cluster.workers
cluster.schedulingPolicy
cluster.settings
cluster.setupPrimary([settings])
cluster.fork([env])
cluster.disconnect([callback]) // 对 cluster.workers 中的每个工作进程调用 worker.disconnect()。
事件：'fork'
事件：'listening'
事件：'setup'
事件：'message'
事件：'exit'
事件：'disconnect'
事件：'online'

废弃
cluster.setupMaster([settings])
cluster.isMaster

// 子进程 worker 对象
worker.id
worker.process
worker.exitedAfterDisconnect
worker.isDead()
worker.isConnected()
worker.disconnect()
worker.kill([signal])
worker.send(message[, sendHandle[, options]][, callback])
事件：'online'
事件：'listening'
事件：'message'
事件：'disconnect'
事件：'exit'
事件：'error'
```
