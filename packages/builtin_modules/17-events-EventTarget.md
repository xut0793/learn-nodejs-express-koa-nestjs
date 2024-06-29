# EventTarget

在浏览器的 Web API 中，EventTarget 是一个非常底层的基类对象，像 Node / Element / document / window / XMLHttpRequest / AudioNode 等常见的对象都继承自它，所以这些对象都可以直接使用它的方法 `addEventListener / removeEventListener / dispatchEvent`，或者通过 `onevent` 的特性实现监听。

在浏览器，EventTarget 作为基类的作用，就像在 Nodejs 中 EventEmitter 基类一样。

现代 Node.js 的发展趋势中，越来越像 web 标准靠拢，实现跨环境（比如服务器端和浏览器）的平台。所以在新的 nodejs 的 API 中，实现了很多 web Api，EventTarget 就是其中一个。它像在浏览器中使用一样，是一个全局可用的类。

- EventTarget
  - `eventTarget.dispatchEvent(event)`
  - `eventTarget.addEventListener(type, listener[, options])`
  - `eventTarget.removeEventListener(type, listener[, options])`，选项对象的值：
    - once boolean 当为 true 时，监听器在第一次调用时自动移除。默认值：false。类似 EventEmitter 对象的 once 方法。
    - passive boolean 当为 true 时，提示监听器不会调用 Event 对象的 `preventDefault()` 方法。默认值：false。
    - signal AbortSignal 当调用给定的 AbortSignal 对象的 `abort()` 方法时，则监听器将被移除。
    - capture boolean Node.js 不直接使用。为了与 web API 完整性而添加。默认值：false。

其中事件监听器 listener 可以是普通 js 函数，异步 async 函数，或者是具有 handleEvent 属性的对象。

```js
function handler1(event) {
  console.log(event.type) // Prints 'foo'
  event.a = 1
}

async function handler2(event) {
  console.log(event.type) // Prints 'foo'
  console.log(event.a) // Prints 1
}

const handler3 = {
  handleEvent(event) {
    console.log(event.type) // Prints 'foo'
  },
}

const handler4 = {
  async handleEvent(event) {
    console.log(event.type) // Prints 'foo'
  },
}

const target = new EventTarget()

target.addEventListener("foo", handler1)
target.addEventListener("foo", handler2)
target.addEventListener("foo", handler3)
target.addEventListener("foo", handler4, { once: true })

const fooEvent = new Event("foo")
target.dispatchEvent(fooEvent)
// foo
// foo
// 1
// foo
// foo

console.log("--------------------------")
target.removeEventListener("foo", handler3)

target.dispatchEvent(fooEvent)
// foo
// foo
// 1
```

EventTarget 基类在 Node.js 中的具体实现细节与浏览器实现还是有些不同的地方：

第一点：因为在浏览器中，因为文档对象 DOM 是分层的树状结构， 继承 EventTarget 的事件通过嵌套对象的层次结构进行传播，最经典的浏览器事件传播机制的三个阶段：

- 捕获阶段（Capturing Phase）：事件从窗口对象开始，沿着 DOM 树向下传递，直到达到触发事件的最深层节点。
- 目标阶段（Target Phase）：事件到达目标节点，也就是实际触发事件的元素。
- 冒泡阶段（Bubbling Phase）：事件从目标节点开始，沿着 DOM 树向上冒泡，直到再次到达窗口对象。

但 Node.js 中没有事件对象的分层和事件传播的概念。所以在 Nodejs 中实现 EventTarget 事件中的具体事件对象 Event 中有关的冒泡 `event.bubbles`、阻止事件传播 `event.stopPropagation()`、阻止事件对象的默认行为 `event.preventDefault()`等方法和属性 `currentTarget / srcElement` 等也没有实际用处，纯粹是为了实现的完整性而添加的。

第二点：事件监听器默认首个实参是当前事件对象 Event，而不是传统 EventEmitter 事件监听器接受 emit 方法的参数。

- Event 监听器函数入参的事件对象
  - event.type 事件类型标识符
  - event.target 当前事件对象
  - event.currentTarget 与 target 一样
  - event.timeStamp 创建 Event 事件对象的时间戳，毫秒。
  - event.isTrusted 指示当前事件是否可以被信号 signal 的 abort 方法取消。
  - `event.stopImmediatePropagation()` 停止该事件的后续监听器调用，如果事件注册了多个监听器，原本是按顺序执行，但如果某个监听器中调用此方法，可后续监听器将不再被调用。
  - event.bubbles 没有实际用处，纯粹是为了完整性而提供的。
  - event.composed 没有实际用处，纯粹是为了完整性而提供的。
  - event.eventPhase 没有实际用处，纯粹是为了完整性而提供的。
  - `event.composedPath()` 没有实际用处，纯粹是为了完整性而提供的。
  - event.defaultPrevented 没有实际用处，纯粹是为了完整性而提供的。
  - `event.preventDefault()` 没有实际用处，纯粹是为了完整性而提供的。
  - event.cancelable 没有实际用处，纯粹是为了完整性而提供的。
  - `event.stopPropagation()` 没有实际用处，纯粹是为了完整性而提供的。

```js
const target = new EventTarget()

// 第一个事件监听器
target.addEventListener("myEvent", (event) => {
  console.log("第一个监听器")
  // 调用 stopImmediatePropagation 将阻止后续监听器被调用
  event.stopImmediatePropagation()
})

// 第二个事件监听器
target.addEventListener("myEvent", (event) => {
  // 这个监听器将不会被执行，因为前一个监听器已经停止了传播
  console.log("第二个监听器")
})

// 触发事件
const myEvent = new Event("myEvent")
target.dispatchEvent(myEvent)

// 控制台将只输出：
// 第一个监听器
```

第三点：现代 Nodejs 中，一些遵循 web API 设计的，同样继承 EventTarget 基类实现全局对象称为 NodeEventTarget 对象，比如 AbortController / AbortSignal 等。这些对象在事件方法调用上可以使用继承于 EventTarget 基类的方法 `addEventListener / removeEventListener / dispatchEvent`，同时为了与传统的 EventEmitter 实例对象事件方法使用的一致性，也实现了类似的别名方法。

- NodeEventTarget
  - `nodeEventTarget.addListener(type, listener)`
  - `nodeEventTarget.on(type, listener)`
  - `nodeEventTarget.once(type, listener)`
  - `nodeEventTarget.emit(type, arg)`
  - `nodeEventTarget.off(type, listener[, options])`
  - `nodeEventTarget.removeAllListeners([type])`
  - `nodeEventTarget.removeListener(type, listener[, options])`
  - `nodeEventTarget.eventNames()`
  - `nodeEventTarget.listenerCount(type)`
  - `nodeEventTarget.getMaxListeners()`
  - `nodeEventTarget.setMaxListeners(n)`

但与传统 EventEmitter 实例对象的行为还有一些不同点：

- 与 EventEmitter 不同，任何给定的 listener 最多可以在每个事件 type 中注册一次。尝试多次注册 listener 将被忽略。
- NodeEventTarget 不模拟完整的 EventEmitter API。特别是 prependListener()、prependOnceListener()、rawListeners() 和 errorMonitor API 未被模拟。'newListener' 和 'removeListener' 事件也不会触发。
- NodeEventTarget 没有为类型为 'error' 的事件实现任何特殊的默认行为。
- NodeEventTarget 支持 EventListener 对象以及作为所有事件类型句柄的函数。

```js
const controller = new AbortController()
const { signal } = controller

signal.addEventListener("abort", (event) => {
  console.log("The operation was aborted >>>", event)
})

// signal.on("abort", (...args) => {
//   console.log("on args >>>", args)
// })

// 假设一段时间后，我们决定取消操作
controller.abort("信号取消") // 打印出 "The operation was aborted!"
```

## 错误处理

在 Node.js EventTarget 中，如果事件监听器是一个异步函数或返回一个 Promise，而返回的 Promise 拒绝，则 rejected 拒绝错误的捕获，跟同步代码抛出错误的处理方式相同，都会在 `process.on('uncaughtException')` 捕获错误。

EventTarget 对象的错误处理，与 EventEmitter 事件对象不同，EventEmitter 事件对象对错误事件的处理，会先传播到一个特殊的事件类型 error 上。对 Promise 对象的 rejected 事件会视 captureRejections 属性是否开启值的情况，触发 `Symbol.for('nodejs.rejection')` 事件，还是 error 事件，再到进程 process 的 error 或 uncaughtException。

> 早期版本，当错误在到达 process.on('uncaughtException') 之前首先转发到 process.on('error') 事件。新版中此行为已弃用。

EventTarget 错误捕获

```js
const target = new EventTarget()

target.addEventListener("foo", () => {
  throw new Error("foo error")
})

target.addEventListener("async-foo", async () => {
  return Promise.reject()
})

// 不会被执行
target.addEventListener("error", (event) => {
  console.log("🚀 ~ target.addEventListener error ~ event:", event.type)
})

// 不会被执行
process.on("error", (err) => {
  console.log("🚀 ~ process.on error ~ args:", err instanceof Error)
})

// 捕获 EventTarget 错误
process.on("uncaughtException", (err) => {
  console.log(
    "🚀 ~ process.on uncaughtException ~ args:",
    err instanceof Error, // throw 时 true， reject 时 false
    err
  )
})

const myEvent = new Event("foo")
target.dispatchEvent(myEvent)

const asyncEvent = new Event("async-foo")
target.dispatchEvent(asyncEvent)
```

EventEmitter 错误捕获

```js
import { EventEmitter, errorMonitor } from "node:events"

// 创建一个自定义的 EventEmitter 实例
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter()

/**
 * 无论下方是 myEmitter.on('error') 还是 process.on('error') ，当前监听都会触发
 *
 * 监听 errorMonitor 上的错误，用于记录错误日志，上报监听系统等操作，但不会消费错误，不会干扰正常错误事件流程的执行
 */
myEmitter.on(errorMonitor, (err) => {
  console.error("通过 errorMonitor 监控到的错误:", err)
})

/**
 * 如果事件对象自身监听了 error 事件，那么下方 process.on('error') 不会触发
 */
myEmitter.on("error", (err) => {
  console.log("处理错误:", err)
})

/**
 * 如果 EventEmitter 自身监听了 error 事件，则当前进程上的 error 监听不会触发。
 * 可以注释上述 myEmitter.on('error‘) 时，会触发
 */
process.on("error", (err) => {
  console.log("🚀 ~ process.on error ~ args:", err instanceof Error)
})

process.on("uncaughtException", (err) => {
  console.log(
    "🚀 ~ process.on uncaughtException ~ args:",
    err instanceof Error, // throw 时 true， reject 时 false
    err
  )
})

// 模拟错误事件
myEmitter.emit("error", new Error("出错啦！"))
```

## CustomEvent

CustomEvent 类同样是一个遵循 web API 的设计，它继承自监听器事件对象 Event 类，是一个专门用于创建自定义事件的类。它具备了 Event 类的所有特性，并且可以通过 detail 属性传递一些额外的信息给那个处理事件的回调函数。这就是 EventTarget 对象通过 customEvent.detail 传递参数的方式。

```js
const eventTarget = new EventTarget()

// 添加事件监听器
eventTarget.addEventListener("signup", function onUserSignup(event) {
  console.log(`User signup with detail: `, event.detail)
})

// 触发事件
const signupEvent = new CustomEvent("signup", {
  detail: { username: "tom", plan: "premium" },
})

eventTarget.dispatchEvent(signupEvent)
```

## API

- EventTarget
  - `eventTarget.addEventListener(type, listener[, options])`
  - `eventTarget.dispatchEvent(event)`
  - `eventTarget.removeEventListener(type, listener[, options])`
- Event
  - event.bubbles
  - event.cancelable
  - event.composed
  - `event.composedPath()`
  - event.currentTarget
  - event.eventPhase
  - event.isTrusted
  - event.defaultPrevented
  - `event.preventDefault()`
  - `event.stopImmediatePropagation()`
  - `event.stopPropagation()`
  - event.target
  - event.timeStamp
  - event.type
- NodeEventTarget
  - `nodeEventTarget.addListener(type, listener)`
  - `nodeEventTarget.on(type, listener)`
  - `nodeEventTarget.once(type, listener)`
  - `nodeEventTarget.emit(type, arg)`
  - `nodeEventTarget.off(type, listener[, options])`
  - `nodeEventTarget.removeAllListeners([type])`
  - `nodeEventTarget.removeListener(type, listener[, options])`
  - `nodeEventTarget.eventNames()`
  - `nodeEventTarget.listenerCount(type)`
  - `nodeEventTarget.getMaxListeners()`
  - `nodeEventTarget.setMaxListeners(n)`
- 弃用或旧版本API
  - `event.cancelBubble`
  - `event.initEvent(type[, bubbles[, cancelable]])`
  - `event.returnValue`
  - `event.srcElement`
