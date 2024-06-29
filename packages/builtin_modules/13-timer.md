# Timer 定时器

Node.js 的定时器（Timers）模块是提供一系列方法来执行在特定时间后的代码，这使得你可以安排代码在将来某个时刻执行，而不是立即执行。

主要是 `setTimeout / setInterval / setImmediate` 三类和对应的取消定时的方法，以及对应的 Promise 形式的方法。

- 调度定时器
  - `setImmediate(callback[, ...args]): Immediate` 用来安排一个函数在当前事件循环周期结束后，下一个循环周期开始前执行。第二个参数开始，作为回调函数 callback 的实参，它返回 Immediate 实例。
  - `setInterval(callback[, delay[, ...args]]): Timeout` 用来安排一个函数在指定的毫秒数后执行，delay 之后的参数作为回调函数 callback 的实参。它返回一个定时器标识 Timeout，你可以使用 `clearTimeout(timeout)` 来取消这个定时器。
  - `setTimeout(callback[, delay[, ...args]]): Timeout` 用来安排一个函数每隔指定的毫秒数重复执行，delay 之后的参数作为回调函数 callback 的实参。它返回一个定时器标识 Timeout，你可以使用 `clearInterval(timeout)` 来取消这个定时器。。
- 取消定时器
  - `clearImmediate(immediate)`
  - `clearInterval(timeout)`
  - `clearTimeout(timeout)`
- 类 Timeout / Immediate 实例方法
  - `hasRef()` 检查 Timeout / Immediate 对象是否被为活跃状态，默认为活跃状态。在活跃状态下，nodejs 进程不会退出。
  - `unref()` 将 Timeout / Immediate 对象标记为非活跃，这样，即使它还没有被执行，Node.js 进程该退出就能退出，不用等定时器执行。
  - `ref()` 重新将Timeout / Immediate 对象标记为活跃。
  - `refresh()` 针对 Timeout 实例。重置定时器的超时时间。每次调用这个方法时，定时器的超时计数会重新开始。
- 定时器 Promise API
  - `timersPromises.setImmediate([value[, options]])`
  - `timersPromises.setTimeout([delay[, value[, options]]])`
  - `timersPromises.setInterval([delay[, value[, options]]])`
  - `timersPromises.scheduler.wait(delay[, options])` 允许你暂停代码执行一段指定的时间，然后自动继续。它返回一个 Promise，这意味着它可以很好地与 async/await 语法搭配使用。
  - `timersPromises.scheduler.yield()` 允许你在异步操作中“暂停”执行，把控制权交回事件循环，让其他待处理的事件有机会运行。完成这些后，再继续执行原来的异步操作。等同于不带参数调用 `timersPromises.setImmediate()`。
- Promise 定时器的选项配置 options
  - `ref: boolean`
  - `signal: AbortSignal`

## 事件循环周期

可以查看 [nodejs 事件循环机制]()

## 活跃状态 ref

一个定时器（如 setTimeout 或 setInterval）或立即执行代码（setImmediate）被创建时，默认情况下是“活跃”的，也就是说它是被“引用”的。这意味着只要这些计时器或立即执行代码存在，它们就会阻止 Node.js 进程的正常退出。

- `hasRef()` 方法用来检查定时器 Timerout / Immediate 对象是否被设置为活跃状态。如果一个定时器对象默认情况下是活跃的，那么只要它存在，Node.js 进程就不会退出。
- `unref()` 你可以通过调用 `unref()` 明确地将此定时器对象标记为非活跃，这样，即使它还没有被执行，Node.js 进程也能该退出时正常退出。
- `ref()` 相对地，你可以通过 `ref()` 来重新标记为活跃。

## setImmediate

1. `setImmediate(callback[, ...args]): Immediate`

- `callback`：这是你希望在当前事件循环尽快执行的函数。
- `[...args]`：可选参数。这些是传递给回调函数的参数。

2. `Immediate` 对象

- `immediate.hasRef()` 检查 immediate 对象是否被为活跃状态，默认为活跃状态。在活跃状态下，nodejs 进程不会退出。
- `immediate.unref()` 将 immediate 对象标记为非活跃，这样，即使它还没有被执行，Node.js 进程该退出就能退出，不用等定时器执行。
- `immediate.ref()` 重新将 immediate 对象标记为活跃。

```js
// 引入 fs 模块用于文件操作
const fs = require("fs")

// 异步写入日志到文件
function logMessage(message) {
  setImmediate(() => {
    fs.appendFile("log.txt", message + "\n", (err) => {
      if (err) throw err
      console.log("日志记录成功")
    })
  })
}

logMessage("这是一个日志信息")
```

## setTimeout

1. `setTimeout(callback, delay, [...args]): Timeout`: 安排一个回调函数在特定延迟之后执行。

- `callback`: 执行的回调函数。
- `delay`: 延迟的时间，以毫秒为单位。
- `[...args]`: 可选参数，传递给回调函数，作为实参调用。

2. `clearTimeout(timeout)`: 清除之前设置的 Timeout。

- `timeout`: 是通过 `setTimeout()` 调用返回的 Timeout 对象。

3. `Timeout` 对象

- `timeout.hasRef()` 检查 timeout 对象是否被为活跃状态，默认为活跃状态。在活跃状态下，nodejs 进程不会退出。
- `timeout.unref()` 将 timeout 对象标记为非活跃，这样，即使它还没有被执行，Node.js 进程该退出就能退出，不用等定时器执行。
- `timeout.ref()` 重新将 timeout 对象标记为活跃。
- `timeout.refresh()` 针对 timeout 实例。

示例一：服务器每小时会自动清理一次缓存，但因为timeout.unref()的调用，如果服务器除了这个定时器外没有其他活动（比如不再接收新的 HTTP 请求），它仍然可以正常关闭，而不会被定时器所阻塞。

```js
const http = require("http")

let cacheCleanupTimer

http
  .createServer((req, res) => {
    // 处理请求...
    res.end("Hello World")

    // 开始一个定时器，每小时清理一次缓存
    if (!cacheCleanupTimer) {
      cacheCleanupTimer = setTimeout(() => {
        console.log("清理缓存...")
        // 清理缓存的代码...
      }, 3600000) // 3600000毫秒 = 1小时

      // 调用unref()确保定时器不会阻止应用退出
      cacheCleanupTimer.unref()
    }
  })
  .listen(3000)

console.log("服务器运行在 http://localhost:3000/")
```

示例2：对于每个接收到的请求，我们设定了 5 秒的超时时间。如果在这 5 秒内有新的数据块到达（比如客户端上传文件），我们通过调用 timeout.refresh() 来重置超时计时器，确保不会因为数据传输而错误地中断请求。

```js
const server = http.createServer((req, res) => {
  let timeout = setTimeout(() => {
    console.log("Request timed out")
    res.end("Timeout")
  }, 5000) // Set a 5-second timeout for every request

  req.on("data", (chunk) => {
    console.log("Received new data chunk")
    timeout.refresh() // Data arrived, refresh timeout
  })

  req.on("end", () => {
    clearTimeout(timeout) // Clear the timeout on request end
    console.log("Request ended successfully")
    res.end("Success")
  })
})

server.listen(3000, () => {
  console.log("Server running on port 3000")
})
```

## setInterval

1. `setTimeout(callback[, delay[, ...args]]): Timeout`

- `callback`：这是您希望周期性执行的函数。
- `delay`：时间间隔，以毫秒为单位。这定义了callback函数调用之间的时间。如果省略，或者提供的值小于等于 0，那么默认值会被设为 1，意味着回调尽可能频繁地执行。
- `[...args]`：这是传递给callback函数的可选参数列表

2. `clearInterval(timeout)`: 清除之前设置的 Timeout。

- `timeout`: 是通过 `setTimeout()` 调用返回的 Timeout 对象。

3. `Timeout` 对象

- `timeout.hasRef()` 检查 timeout 对象是否被为活跃状态，默认为活跃状态。在活跃状态下，nodejs 进程不会退出。
- `timeout.unref()` 将 timeout 对象标记为非活跃，这样，即使它还没有被执行，Node.js 进程该退出就能退出，不用等定时器执行。
- `timeout.ref()` 重新将 timeout 对象标记为活跃。
- `timeout.refresh()` 针对 timeout 实例。

示例2：需要定期从远程 API 获取数据。基于网络条件或 API 响应时间的变化，你可能会想动态调整请求间隔。

```js
let interval = 3000 // Initial interval set to 3 seconds

const fetchData = () => {
  console.log("Fetching data...")
  // Simulate varying processing time or conditions
  interval = Math.random() > 0.5 ? 2000 : 4000

  const timeout = setTimeout(fetchData, interval)
  timeout.refresh() // Refresh with the new interval
}

fetchData()
```

## Promise Timer

在 Node.js v15.0.0 中，引入了基于 Promise 的 Timers API，使得使用计时器变得更加方便和现代化。通过这个 API，你可以使用 async/await 或者 .then() 和 .catch() 方法来处理异步计时事件，而不必依赖传统的回调函数。

主要分为两类：

第一类：

- `timersPromises.setImmediate([value[, options]])`
- `timersPromises.setTimeout([delay[, value[, options]]])`
- `timersPromises.setInterval([delay[, value[, options]]])`

其中参数：

- delay: 指定在执行之前等待的毫秒数。如果省略，默认值为 0，Promise 将尽可能快地解决。
- value (可选): 这是一个可选参数，当计时器完成时，它会被作为 Promise 的结果返回。
- options (可选): 提供额外的配置选项。比如，你可以设置一个signal来取消计时器。
  - `ref: boolean` 针对 setTimeout / setInterval 设置定时器活跃状态，类似 `ref() / unref()` 方法。
  - `signal: AbortSignal` 结合 AbortController 和 AbortSignal 用于取消 promise 形式的定时器

setImmediate 示例：

```js
import { setImmediate } from "timers/promises"

async function complexOperation() {
  // 第一部分操作
  await someAsyncOperation()

  // 在上一个操作完成后立即执行，但不阻塞其他并发操作
  await setImmediate()

  // 下一组操作，延迟到当前周期未尾执行
  await anotherAsyncOperation()
}

complexOperation()
```

setTimeout 示例: 接收 value 的值和使用 options.signal 取消

```js
import { setTimeout } from "timers/promises"

async function cancellableDelay() {
  const controller = new AbortController()
  const { signal } = controller

  // 在1秒后取消计时器，实际项目中可以基于业务逻辑判断进行取消
  setTimeout(1000).then(() => controller.abort())

  try {
    const result = await setTimeout(5000, "Hello World!", { signal })
    console.log(result) // 预期输出 "Hello World!"，蛤因为提前被取消，不会输出
  } catch (err) {
    console.error("计时器被取消")
  }
}

cancellableDelay()
```

setInterval 示例

```js
import { timersPromises } from "node:timers/promises"

async function exampleWithValue() {
  let counter = 1
  // 设定间隔为1秒，并传递一个自增的计数器作为值
  for await (const count of timersPromises.setInterval(1000, counter)) {
    console.log(`这是第 ${count} 次执行`)

    // 更新计数器值
    counter++

    if (counter > 5) {
      break // 当计数器超过5时停止
    }
  }
}

exampleWithValue()
```

第二类，便捷方法

- `timersPromises.scheduler.wait(delay[, options])` 允许你暂停代码执行一段指定的时间，然后自动继续。它返回一个 Promise，这意味着它可以很好地与 async/await 语法搭配使用。options 包含一个 signal / ref 属性。相当于调用 `timersPromises.setTimeout(delay, undefined, options)`。
- `timersPromises.scheduler.yield()` 允许你在异步操作中“暂停”执行，把控制权交回事件循环，让其他待处理的事件有机会运行。完成这些后，再继续执行原来的异步操作。等同于不带参数调用 `timersPromises.setImmediate()`。

示例一：你可能在等待用户输入，但也想让用户能通过 Ctrl+C 退出程序。你可以通过设置 ref: false 来实现：

```js
import { scheduler } from "node:timers/promises"

async function waitForUserInput() {
  console.log("请在 10 秒内输入（或按 Ctrl+C 退出）...")

  // 等待 10 秒，但允许进程在此期间退出
  await scheduler.wait(10000, { ref: false })

  console.log("时间到！")
}

waitForUserInput()
```

示例二：假设 processData 函数处理一系列数据。通过调用 `await scheduler.yield()`，我们在每 1000 条数据处理后让出 CPU 控制权，使得 Node.js 事件循环有机会去处理其他挂起的工作，比如响应用户输入或者处理网络请求。这样可以使应用更加响应，避免因为一个长时间运行的任务而阻塞整个系统。

```js
import { scheduler } from "node:timers/promises"

async function processData() {
  // 假设这是一个需要分批处理的大量数据
  for (let i = 0; i `<` 10000; i++) {
    // 处理数据的逻辑...
    console.log(i); // 做一些处理

    // 每处理1000条记录就让出控制权一次
    if (i % 1000 === 0) {
      await scheduler.yield();
    }
  }
}

processData().then(() => console.log('数据处理完成'));
```
