# EventEmitter

- EventEmitter
- 添加事件监听
  - `emitter.on(eventName, listener)`
  - `emitter.once(eventName, listener)`
  - `emitter.addListener(eventName, listener)`
  - `emitter.prependListener(eventName, listener)`
  - `emitter.prependOnceListener(eventName, listener)`
- 触发事件
  - `emitter.emit(eventName[, ...args])`
- 移除事件监听
  - `emitter.off(eventName, listener)`
  - `emitter.removeListener(eventName, listener)`
  - `emitter.removeAllListeners([eventName])`
- 错误事件监听
  - `events.errorMonitor`
  - `events.captureRejections`
  - `events.captureRejectionSymbol`
  - `emitter[Symbol.for('nodejs.rejection')](err, eventName[, ...args])`
- 查询事件及监听器
  - `emitter.eventNames()`
  - `emitter.listeners(eventName)`
  - `emitter.rawListeners(eventName)`
  - `emitter.listenerCount(eventName[, listener])`
  - `events.getEventListeners(emitterOrTarget, eventName)`
- 最大监听数量
  - `emitter.getMaxListeners()`
  - `emitter.setMaxListeners(n)`
  - `events.defaultMaxListeners`
  - `events.getMaxListeners(emitterOrTarget)`
  - `events.setMaxListeners(n[, ...eventTargets])`
- 事件监听的遍历
  - `events.on(emitter, eventName[, options])`
  - `events.once(emitter, name[, options])`
- 弃用或旧版本API
  - `events.listenerCount(emitter, eventName)`

## EventEmitter

Nodejs 架构的核心特点之一就是它的异步事件机制，而该机制的实现基础就是 events 模块提供的基础能力。

Nodejs 的 events 模块能够创建、监听和触发自己的事件。当我们说“监听”时，我们指的是等待某个特定事件发生。一旦这个事件发生（被触发），就会调用与之相关联的函数（即监听器函数）。

events 模块提供的核心基类 EventEmitter 来实现事件监听。许多内置模块的API都是基于该核心基类进行扩展实现的，也就是其它模块的实例对象都具有 `on / emit / off` 等事件相关方法的原因。

基本流程：

1. `const emitter = new EventEmitter()` 创建事件触发器实例，或者先扩展自己事件触发器类 `class MyEmitter extends EventEmitter {}`，然后再实例化 `emitter = new MyEmitter()`
2. `emitter.on(eventName, listener)` 自定义事件，同时注册事件监听器，其中事件名称 eventName 可以使用字符串或者Symbol。 listener 监听器是一个函数。
3. `emitter.emit(eventName[, ...args])` 触发事件 ，指明要触发的事件名称，后续参数将作为实参传入到该事件的所有监听器函数中，并执行。如果该事件存在监听器，则返回 true，否则返回 false，而监听器函数本身的返回值将被忽略。
4. `emitter.off(eventName, listener)` 删除事件监听，必要时删除事件监听，避免监听器函数内一直保持着某些对象的引用，影响内存的垃圾回收。

基本示例：

```js
import { EventEmitter } from "node:events"

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter()
const listener = (a, b) => {
  console.log("an event occurred!", a, b)

  return a + b
}

myEmitter.on("event", listener)

const result1 = myEmitter.emit("event", 1, 2) // an event occurred! 1 2
console.log("🚀 ~ result1:", result1) // true

myEmitter.off("event", listener)

const result2 = myEmitter.emit("event", 1, 2) // 无任务输出
console.log("🚀 ~ result2:", result2) // false
```

## 添加事件监听

以下注册事件监听方法，如果事件 eventName 不存在，则新建。若存在，则添加事件监听器，内部维护了一个监听器数组，触发时按添加顺序执行。

- `emitter.on(eventName, listener)` 注册事件监听
- `emitter.addListener(eventName, listener)` on 的别名，同 on 方法一致
- `emitter.once(eventName, listener)` 注册事件监听，与 `.on()` 方法不同的的是，`.on()` 会在每次事件发生时都调用监听器，`.once()` 的监听器仅被第一次触发时调用，后续无论事件被触发多少次都不再调用。
- `emitter.prependListener(eventName, listener)` 将新添加的监听器放置在监听器队列的最前面，从而先执行。
- `emitter.prependOnceListener(eventName, listener)` 将新添加的监听器放置在监听器队列的最前面，从而先执行。但是同 `.once()` 方法一样，只被执行一次。

```js
import { EventEmitter } from "node:events"

const emitter = new EventEmitter()

emitter.on("event", () => {
  console.log("on A")
})

emitter.addListener("event", () => {
  console.log("add B")
})

emitter.once("event", () => {
  console.log("once C")
})

emitter.prependListener("event", () => {
  console.log("prepend D")
})

emitter.prependOnceListener("event", () => {
  console.log("prepend once E")
})

console.log("--------1------------")
emitter.emit("event")
console.log("--------2-----------")
emitter.emit("event")
console.log("--------3-----------")
emitter.emit("event")

// 输出
// --------1------------
// prepend once E
// prepend D
// on A
// add B
// once C
// --------2-----------
// prepend D
// on A
// add B
// --------3-----------
// prepend D
// on A
// add B
```

## 触发事件监听

`emitter.emit(eventName[, ...args])`

触发对应事件 eventName，如果该事件有注册监听器，则返回 true，否则返回 false。

触发时监听器的执行按注册顺序同步调用，并将提供的参数 args 传给每个监听器函数。

```js
import { EventEmitter } from "node:events"
const myEmitter = new EventEmitter()

// First listener
myEmitter.on("event", function firstListener() {
  console.log("Helloooo! first listener")
})
// Second listener
myEmitter.on("event", function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`)
})
// Third listener
myEmitter.on("event", function thirdListener(...args) {
  const parameters = args.join(", ")
  console.log(`event with parameters ${parameters} in third listener`)
})

myEmitter.emit("event", 1, 2, 3, 4, 5)

// Prints:
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

## 反射：获取已注册监听器的事件

如果上述的 on / addListener / emit 等方法调用是正向使用 EventEmitter 触发器，向触发器对象添加数据。那么反向的，触发器暴露了对应的方法，可以获取触发器自身相关数据的行为，就是反射。

- `emitter.eventNames()` 返回的是已为事件注册了监听器的事件名的数组。数组中的值是字符串或 Symbol。

事实上，没有方法可以先注册事件，再添加监听器的。都是在 on 或 addListener 方法中，事件注册和绑定监听器函数一起进行，如果当前事件还没，则新建，并绑定监听器。所以如果一个事件没绑定过监听器，或者之前绑定过，但已经全部清除了所有监听器，那该事件也就不存在了，自然 `eventNames()` 方法也不会返回该事件名称了。

```js
import http from "node:http"

const server = http.createServer()

console.log("🚀 ~ createServer eventNames:", server.eventNames())
// [ 'connection', 'listening' ]

server.on("request", (req, res) => {
  console.log("on request url:", req.url)
  res.end("Hello World")
})

console.log("🚀 ~ request eventNames:", server.eventNames())
// [ 'connection', 'listening', 'request' ]

server.on("close", () => {
  console.log("server is closed")
})

console.log("🚀 ~ close eventNames:", server.eventNames())
// [ 'connection', 'listening', 'request', 'close' ]

server.listen(3000, () => {
  console.log("server running at http://localhost:3000/")
})

console.log("🚀 ~ listen eventNames:", server.eventNames())
// [ 'connection', 'listening', 'request', 'close' ]
```

## 反射：获取已注册的监听器

- `emitter.listeners(eventName) / events.getEventListeners(emitterOrTarget, eventName)` 获取事件对象已经注册的监听器函数列表，列表中的函数为绑定时实际传入的函数。
- `emitter.rawListeners(eventName)` 返回 eventName 事件注册的所有监听器函数列表，区别于 `listeners()` 方法，`rawListeners()` 方法会把通过 `once()` 注册的包装函数 onceWrapper 返回。
- `emitter.listenerCount(eventName[, listener])` 返回监听名为 eventName 的事件的监听器数量。如果提供了 listener，它将返回在事件的监听器列表中找到监听器的次数。因为同一个监听器函数可以注册多次，触发执行时也调用多次。

```js
const emitter = new EventEmitter()

const logFn = () => console.log("log >>>")

emitter.on("log", logFn)
emitter.once("log", logFn)

console.log("-----------------listeners-------------------")
// 返回事件监听器函数列表，监听器函数为实际代码传入的函数
const listeners = emitter.listeners("log")
console.log("🚀 ~ listeners length:", listeners.length) // 2
console.log("on listener: ", listeners[0] === logFn) // true
console.log("once listener: ", listeners[1] === logFn) // true

console.log("---------------rawListeners------------------")
// 这里的 raw 指的是实际添加到事件监听队列中的函数，所以对于 once 事件，传入的监听器函数会被包装一层后再注册
const rawListeners = emitter.rawListeners("log")
console.log("🚀 ~ raw listeners length:", rawListeners.length) // 2
console.log("on raw listener: ", rawListeners[0] === logFn) // true
console.log("once raw listener: ", rawListeners[1] === logFn) // false

console.log("-----------logFnWrapper.listener---------------")
// once 会对传入的原始监听器进行一层包装后，再注册为监听器 listener，这个监听器也称为 封装器 onceWrapper。
// 可以从 onceWrapper.listener 获得原始监听器函数。
const logFnWrapper = rawListeners[1]
console.log("logFnWrapper.listener: ", logFnWrapper.listener === logFn) // true

// 原始函数执行多次仍正常
logFnWrapper.listener() // log >>>
logFnWrapper.listener() // log >>>

console.log("----------listenerCount 1------------")
const count1 = emitter.listenerCount("log")
console.log("🚀 ~ count 1:", count1) // 2
const countLogFn = emitter.listenerCount("log", logFn)
console.log("🚀 ~ countLogFn:", countLogFn)

console.log("------onceWrapper----------")
// 但如果执行 once 事件的包装函数 onceWrapper，那么行为表现与 once 事件触发一致，只会被执行一次。
logFnWrapper() // log >>>
logFnWrapper() // 没有输出

console.log("---------emit----------")
emitter.emit("log") // 此时只会执行 on 方法注册的监听器，输出一次 log >>>

console.log("----------listenerCount 2------------")
const count2 = emitter.listenerCount("log")
console.log("🚀 ~ count 2:", count2) // 1
```

## 反射：获取和设置可注册监听器的最大数量

默认情况下，最多可为任何单个事件注册 10 个监听器。

对监听器数量进行限制，主要关注性能问题和内存内存泄漏。

- 性能问题：每个监听器都是一个函数，当事件被触发时，所有的监听器都会被执行。如果监听器太多，可能会导致程序运行缓慢。
- 内存泄露：无限制地添加监听器可能会导致内存泄漏，因为一些可能不再需要的监听器占据了内存空间，并且监听器函数内可能保持外部对象的引用，导致这些被引用的对象无法被垃圾回收。

`emitter.setMaxListeners() / events.setMaxListeners(n[, ...eventTargets])` 方法允许修改此限制。该值可以设置为 Infinity（或 0）以指示无限数量的监听器，但尽量避免这样做。如果该值不是正数，则抛出 RangeError。

设置 events.defaultMaxListeners 时要小心，因为更改会影响所有 EventEmitter 实例，包括在进行更改之前创建的实例。

另外，对于优先级，某个具体的 emitter 调用 `emitter.setMaxListeners` 优先级高于全局设置 `events.setMaxListeners`。

查询和设置监听器最大数量限制的方法：

- `emitter.getMaxListeners()` 获取当前事件触发器可注册的最大监听器函数的最大数量
- `emitter.setMaxListeners(n)` 设置当前事件触发器可注册的监听器函数最大数量，优先级高于全局设置 `events.setMaxListeners(n)`
- `events.defaultMaxListeners` 全局的所有事件，当前可注册的监听器函数最大数量
- `events.getMaxListeners(emitterOrTarget)` 获取某个具体事件，可注册监听器函数的数量，功能同 `emitter.getMaxListeners()` 一致。
- `events.setMaxListeners(n[, ...eventTargets])` 如果缺省 eventTargets 的参数，则设置全局范围下所有事件可注册监听器函数的最大数量。也可通过后续参数传入某些特定事件对象，进行设置。

```js
import event from "node:events"

const emitter = new event.EventEmitter()

console.log("event.defaultMaxListeners ", event.defaultMaxListeners) // 10
console.log("event.getMaxListeners() ", event.getMaxListeners(emitter)) // 10
console.log("emitter.getMaxListeners() ", emitter.getMaxListeners()) // 10

event.setMaxListeners(20)
console.log("event.defaultMaxListeners ", event.defaultMaxListeners) // 20
console.log("event.getMaxListeners() ", event.getMaxListeners(emitter)) // 20
console.log("emitter.getMaxListeners() ", emitter.getMaxListeners()) // 20

event.setMaxListeners(30, emitter)
console.log("event.defaultMaxListeners ", event.defaultMaxListeners) // 20
console.log("event.getMaxListeners() ", event.getMaxListeners(emitter)) // 30
console.log("emitter.getMaxListeners() ", emitter.getMaxListeners()) // 30

const target = new EventTarget()
const emitter2 = new EventEmitter()
setMaxListeners(5, target, emitter2)
```

## 反射：自身事件 newListener / removeListener

EventEmitter 类的反射功能除了上述的事件名和监听器查询外，还暴露了自身的三个特殊事件 `newListener / removeListener / error`。

- newListener 在监听器被添加到其内部监听器数组之前触发。
- removeListener 在监听器被移除后触发
- error 当执行过程中发生错误时触发

newListener 事件有一点特殊的是，如果在该事件的回调函数逻辑再次向同一事件 eventName 添加新的监听器，那么该监听器将被插入到正在添加的监听器之前。

```js
import { EventEmitter } from "node:events"

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter()

const listenerA = () => console.log("A")
const listenerB = () => console.log("B")

// 注意回调函数的入参，当前事件名称 eventName，和监听器 listener
myEmitter.once("newListener", (eventName, listener) => {
  console.log("newListener: ", eventName)

  if (eventName === "event") {
    // Insert a new listener in front
    myEmitter.on("event", listenerB)
  }
})

myEmitter.on("event", listenerA)
myEmitter.on("event", () => {
  console.log("C")
})

myEmitter.on("removeListener", (eventName, listener) => {
  console.log("removeListener: ", eventName)
})

myEmitter.emit("event")

console.log("count: ", myEmitter.listenerCount("event"))
myEmitter.off("event", listenerB)
console.log("removed B count: ", myEmitter.listenerCount("event"))
myEmitter.removeAllListeners("event")
console.log("removed all count: ", myEmitter.listenerCount("event"))
// Prints:
// newListener:  event
// B
// A
// C
// count:  3
// removeListener:  event
// removed B count:  2
// removeListener:  event
// removeListener:  event
// removed all count:  0
```

## 错误事件监听 error

当 EventEmitter 实例的某些触发器函数内部发生错误时，会自动触发 'error' 事件。

error 是 EventEmitter 类实例的一个特殊事件，有两点特殊性：

- 如果 EventEmitter 实例没有为 'error' 事件注册至少一个监听器时，此时触发 'error' 事件，会向控制台抛出错误，打印堆栈跟踪，然后 Node.js 进程退出。所以作为最佳实践，应始终为 'error' 事件添加监听器。
- 如果通过使用 `events.errorMonitor` 常量注册事件，并添加该事件的监听器，此时当触发 error 事件时，可以在不干扰 'error' 事件正常流程的情况下（输出错误堆栈到控制台或调用错误事件监听器），额外收集到错误信息，从而进行日志记录、报告或者其他形式的错误处理，而不会阻止其他 'error' 事件监听器执行。

示例1：向终端输出错误堆栈，HTTP 服务无法启动

```js
import { createServer } from "node:http"
import { EventEmitter } from "node:events"

// 创建一个自定义的 EventEmitter 实例
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter()

// 模拟错误事件
myEmitter.emit("error", new Error("出错啦！"))

// 创建 HTTP 服务器
const server = createServer((req, res) => {
  // 这里处理请求
  res.end("Hello World")
})

server.listen(3000, () => {
  console.log("服务器运行在 http://localhost:3000/")
})
```

示例2：收集到错误信息，但并没有消费错误流程，正常向终端输出错误堆栈，HTTP 服务无法启动

```js
import { createServer } from "node:http"
import { EventEmitter, errorMonitor } from "node:events"

// 创建一个自定义的 EventEmitter 实例
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter()

// 监听 errorMonitor 上的错误，用于记录错误日志，上报监听系统等操作，但不会消费错误，不会干扰正常错误事件流程的执行
myEmitter.on(errorMonitor, (err) => {
  console.error("通过 errorMonitor 监控到的错误:", err)
})

// 模拟错误事件
myEmitter.emit("error", new Error("出错啦！"))

// 创建 HTTP 服务器
const server = createServer((req, res) => {
  // 这里处理请求
  res.end("Hello World")
})

server.listen(3000, () => {
  console.log("服务器运行在 http://localhost:3000/")
})
```

示例3：捕获错误事件，自行处理，HTTP 服务正常启动

```js
import { createServer } from "node:http"
import { EventEmitter, errorMonitor } from "node:events"

// 创建一个自定义的 EventEmitter 实例
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter()

// 监听 errorMonitor 上的错误，用于记录错误日志，上报监听系统等操作，但不会消费错误，不会干扰正常错误事件流程的执行
myEmitter.on(errorMonitor, (err) => {
  console.error("通过 errorMonitor 监控到的错误:", err)
})

// 也可以监听普通的 'error' 事件，比如用来恢复操作
myEmitter.on("error", (err) => {
  console.log("处理错误:", err)
})

// 模拟错误事件
myEmitter.emit("error", new Error("出错啦！"))

// 创建 HTTP 服务器
const server = createServer((req, res) => {
  // 这里处理请求
  res.end("Hello World")
})

server.listen(3000, () => {
  console.log("服务器运行在 http://localhost:3000/")
})
```

## rejection 捕获 promise 拒绝事件

当事件触发器是 async 异步函数时，如果在异步函数内部逻辑内抛出错误，会导致 promise 的 rejected 拒绝错误。

```js
const EventEmitter = require("events")

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter()

// 监听 'asyncEvent' 事件
myEmitter.on("asyncEvent", async () => {
  throw new Error("Oops! An error occurred.")
})

myEmitter.emit("asyncEvent") // 这里会产生一个未处理的Promise拒绝警告
```

如果要捕获上述 rejected 的错误，让它不会导致程序异步退出，有以下两种方法：

- 方法一：单独捕获 rejected 错误，自行处理，这样也便于将 rejected 错误与普通 error 错误处理区分开。
  1. 第一步：开启 rejected 错误捕获 `{ captureRejections: true }`
  2. 第二步：添加 rejected 错误处理函数 `captureRejectionSymbol `

常量 `captureRejectionSymbol` 的值实际是 `Symbol.for('nodejs.rejection')`

```js
import { createServer } from "node:http"
import { EventEmitter, captureRejectionSymbol } from "node:events"

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter({ captureRejections: true })

// 监听 'asyncEvent' 事件
myEmitter.on("asyncEvent", async () => {
  throw new Error("Oops! An error occurred.")
})

// 通过 `captureRejectionSymbol ` 单独捕获 rejected 错误，自行处理。
myEmitter[captureRejectionSymbol] = function (err, eventName) {
  console.error(`An error occurred in the listener for ${eventName}:`, err)
}

myEmitter.emit("asyncEvent") // 这里会产生一个未处理的Promise拒绝警告

// 创建 HTTP 服务器
const server = createServer((req, res) => {
  // 这里处理请求
  res.end("Hello World")
})

server.listen(3000, () => {
  console.log("服务器运行在 http://localhost:3000/")
})
```

- 方法二：将 rejected 错误合并到 error 错误中一并处理。
  1. 第一步：开启 `{ captureRejections: true }`
  2. 第二步：不提供 captureRejectionSymbol，仅注册 error 事件监听。因为如果提供了 captureRejectionSymbol 函数，就不会将 rejected 错误传递到 error 事件监听中。

```js
import { createServer } from "node:http"
import { EventEmitter, captureRejectionSymbol } from "node:events"

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter({ captureRejections: true })

// 监听 'asyncEvent' 事件
myEmitter.on("asyncEvent", async () => {
  throw new Error("Oops! An error occurred.")
})

myEmitter.on("error", (err) => {
  console.error(`on error handler`, err)
})

myEmitter.emit("asyncEvent") // 这里会产生一个未处理的Promise拒绝警告

// 创建 HTTP 服务器
const server = createServer((req, res) => {
  // 这里处理请求
  res.end("Hello World")
})

server.listen(3000, () => {
  console.log("服务器运行在 http://localhost:3000/")
})
```

开启 `{ captureRejections: true }` 选项，实际上在 EventEmitter 内部注册异步的监听器时，会自动在 Promise 监听器函数上添加 `.then(undefined, rejectedHandler)`，并将 rejectedHandler 句柄链接到 `Symbol.for('nodejs.rejection')` 方法（如果有提供的话）或 'error' 事件句柄（如果没有提供）。

另外，除了在特定的实例化 EventEmitter 时传入开启 `{ captureRejections: true }`，也可以通过 `EventEmitter.captureRejections = true` 全局开启，此时全局范围内的 EventEmitter 实例都会将 rejected 错误传递到 `Symbol.for('nodejs.rejection')`，或 `error` 事件，或上述都没有监听时，打印错误到终端上。

## 事件监听的遍历

在 Node.js v22.0.0 版本中稳定了 `events.on(emitter, eventName[, options])` 注册监听器的方法。 它是一个非常有用的工具方法，允许你监听或者说订阅事件直到 Promise 结束。这意味着你可以以更现代的异步处理方式来处理事件，特别是在 `async/await` 上下文中。

- `events.on(emitter, eventName[, options]): AsyncIterator`
  - emitter: 事件触发器对象。
  - eventName: 监听的事件名称。
  - options (可选): 一个配置对象，可以用于调整行为。
    - signal `<AbortSignal>` 可用于取消等待事件。
    - close `<string[]>` 将结束迭代的事件的名称。
    - highWaterMark `<integer>` 默认值：Number.MAX_SAFE_INTEGER 高水位线。每当缓冲的事件大小高于它时，触发器就会暂停。仅在实现 `pause()` 和 `resume()` 方法的触发器上受支持。
    - lowWaterMark `<integer>` 默认值：1 低水位线。每当缓冲的事件大小低于它时，触发器就会恢复。仅在实现 `pause()` 和 `resume()` 方法的触发器上受支持。
  - 返回：`<AsyncIterator>` 迭代 emitter 触发的 eventName 事件

先看该方法的方法值是 `AsyncIterator`，一个异步可迭代对象。不是传统方法的 eventEmitter 实例对象。另外选项对象中可以传入 AbortSignal 对象，通过信号取消事件监听。

与传统 eventEmitter 的 `on/ addListener` 方法相比，无需手动添加和去除监听器。这对于管理资源和避免潜在的内存泄漏在编写稳健的 Node.js 应用程序时非常有用。

场景一：文件读写的监听

```js
import fs from "node:fs"
import { on } from "node:events"

const ac = new AbortController()

async function processFile(filePath) {
  const stream = fs.createReadStream(filePath)

  for await (const chunk of on(stream, "data", { signal: ac.signal })) {
    // 处理每一块数据
    console.log(chunk.toString())
  }
}

processFile("./bigfile.txt")

// 视情况，可以终止文件读取的事件监听
ac.bort()
```

场景二：HTTP 服务请求监听

```js
import http from "node:http"
import { on } from "node:events"

const server = http.createServer()

async function handle() {
  for await (const [req, res] of on(server, "request")) {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("Hello World\n")
  }
}

handle()
server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/")
})
```

使用场景举例

## 同步等待事件触发

在 Node.js v15.0.0 版本中稳定了 `events.once(emitter, nameName[, options])` 方法，可以给合 async / await 语法，将程序的执行流由等待和触发事件来控制。用于只监听一次给定的事件，然后自动移除监听器。

- `events.once(emitter, nameName[, options])：Promise`
  - emitter: 是一个事件发射器（EventEmitter）实例，你需要监听其上的事件。
  - eventName: 监听的事件名。
  - options: 一个配置对象，可以用于调整行为。
    - signal `<AbortSignal>` 可用于取消等待事件。

场景一：等文件读取流完成后，继续执行后续逻辑

```js
import fs from "node:fs"
import { once } from "node:events"

async function readFile(filePath) {
  try {
    const stream = fs.createReadStream(filePath)
    const content = ""

    for await (const chunk of on(stream, "data", { signal: ac.signal })) {
      // 处理每一块数据
      content += chunk.toString()
      console.log(`Received ${chunk.length} bytes of data.`)
    }

    await once(steam, "end")
    console.log("Stream ended, no more data.", content)

    return content
  } catch (err) {
    console.error(err)
  }
}

readFile("example.txt")
```

此方法是有意通用的，也适用于遵循 Web 平台标准的 EventTarget 接口，它没有特殊的 'error' 事件语义，也不监听 'error' 事件。如果 `once()` 用于等待 error 事件本身，则将 error 事件与普通的任何事件一样对待，没有特殊处理。

另外，如果在等待时触发 'error' 则返回被拒绝 rejected 状态。

```js
import { once, EventEmitter } from "node:events"
import process from "node:process"

const ee = new EventEmitter()
const ac = new AbortController()

process.nextTick(() => {
  ee.emit("myevent", 42)
})

// value 为 emit 时传入的参数
const [value] = await once(ee, "myevent", { signal: ac.signal })
console.log(value)

const err = new Error("kaboom")

process.nextTick(() => {
  ee.emit("error", err)
})

try {
  await once(ee, "myevent")
} catch (err) {
  console.error("error happened", err)
}
```

如果某些逻辑需要等待多个事件时，可以结合 `Promise.all() / Promise.race() / Promise.allSettled()`

```js
import { EventEmitter, once } from "node:events"
import process from "node:process"

const myEE = new EventEmitter()

async function example() {
  await Promise.all([once(myEE, "bar"), once(myEE, "foo")])

  // 只有 foo / bar 事件都触发完成后，才执行后续逻辑
  console.log("foo", "bar")
}

process.nextTick(() => {
  myEE.emit("bar")
  myEE.emit("foo")
})

example().then(() => console.log("done"))
```
