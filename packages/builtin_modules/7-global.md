# Global 全局变量

Node.js 中的全局对象是在所有模块中始终可用的对象，你不需要对它们进行特殊的导入或声明，就可以直接在代码的任何地方使用这些对象。

现在的 Nodejs 的 api 设计越来越向 web 标准靠拢，所以有很多新的 api 跟浏览器中全局变量有相同语义。

- 常用

  - global: 旧版，替代为 globalThis
  - globalThis
  - AbortController
  - AbortSignal
  - structuredClone

- 二进制、流相关内容，在 Buffer / Stream 章节阐述

  - 类：File
  - Blob
  - Buffer
  - `atob(data)`: 旧版，用 `Buffer.from(data, 'base64')` 替代
  - `btoa(data)`: 旧版，用 `buf.toString('base64')` 替代
  - 类：ReadableByteStreamController
  - 类：ReadableStream
  - 类：ReadableStreamBYOBReader
  - 类：ReadableStreamBYOBRequest
  - 类：ReadableStreamDefaultController
  - 类：ReadableStreamDefaultReader
  - 类：WritableStream
  - 类：WritableStreamDefaultController
  - 类：WritableStreamDefaultWriter
  - TextDecoder
  - TextDecoderStream
  - TextEncoder
  - 类：TextEncoderStream
  - 类：TransformStream
  - 类：TransformStreamDefaultController

- 模块相关内容，在 module 章节阐述

  - `_filename`
  - `_dirname`
  - module
  - require
  - exports

- 在 I/O 章节阐述

  - console

- 在 Timer 章节阐述

  - clearImmediate
  - clearInterval
  - clearTimeout
  - setImmediate
  - setInterval
  - setTimeout
  - queueMicrotask

- 在 Crypto 章节阐述

  - Crypto
  - crypto
  - SubtleCrypto

- 在 Event 章节阐述

  - Event
  - EventTarget
  - CustomEvent
  - MessageEvent

- 同浏览器对象使用

  - fetch
  - FormData
  - Headers
  - Response
  - Request
  - URL
  - URLSearchParams
  - WebSocket

- 在进程和线程 (process / child_process / worker_threads) 章节阐述

  - process
  - BroadcastChannel
  - MessageChannel
  - MessagePort

- 在性能和报告章节阐述

  - PerformanceEntry
  - PerformanceMark
  - PerformanceMeasure
  - PerformanceObserver
  - PerformanceObserverEntryList
  - PerformanceResourceTiming
  - performance

- 其它
  - Navigator
  - navigator
  - DOMException
  - WebAssembly
  - 类：CompressionStream
  - 类：DecompressionStream
  - 类：CountQueuingStrategy
  - 类：ByteLengthQueuingStrategy

## Global / GlobalThis

在 Node.js 的某个模块文件里编写代码，最顶层的作用域不是全局作用，而是该模块本身作用域，也称为模块作用域，因此定义的变量属于模块作用域，不会污染全局作用域。

与在浏览器中的 JavaScript 不同，在浏览器中，在 script 标签里，顶层作用域是全局作用域（ECMAScript 模块除外）。这意味着在直接声明的变量（不使用var, let, 或 const）将会成为全局变量。

Node.js 在 v0.1.27 版本提供了一个 global 关键字，它类似于浏览器环境中的 window 对象。通过 global 对象，可以跨模块访问到所有的全局变量，即那些不需要使用任何特定模块就能够使用的变量。

从历史上看，在不同的 JavaScript 环境中访问全局对象需要不同的语法。比如在在浏览器中，你可以访问 window 全局变量，在访问iframe 的全局变量 `window.frames[0]`，在 Web worker 工作线程使用 self 作为全局变量，在 Node.js 中，使用 global 全局变量。

为了提供跨环境的统一访问全局变量的形式，跟随 web 标准，nodejs 在 v12 版本提供了 globalThis 作为全局变量访问的标准形式，不管是在浏览器还是nodejs环境，还是在跨窗口或线程中，可以用一致的方式访问全局对象，而无需知道代码运行在哪个环境中。

> 关于名称的选择，self 和 global 已被排除在考虑范围外，因为它们可能会破坏与现有代码的兼容性。从字面上看，globalThis 理解为全局的 this 值。它与不带对象调用的非严格函数中的 this 值相同。它也是脚本全局范围内 this 的值。
>
> 引用：[MDN globalThis](https://web.nodejs.cn/en-us/docs/web/javascript/reference/global_objects/globalthis/)

```js
// 在 b.js中
global.hello = "world"
globalThis.some = "some"

export function greet() {
  console.log("Hello World!")
}

// 然后在 a.js 中访问
import { greet } from "./b.js"

console.log("global === globalThis", global === globalThis) // true
console.log("---------------")
console.log("global.hello = ", global.hello) // world
console.log("global.some = ", global.some) // some
console.log("---------------")
console.log("globalThis.hello = ", globalThis.hello) // word
console.log("globalThis.some = ", globalThis.some) // some
console.log("---------------")
greet()
```

## structuredClone

`structuredClone(value[, options])` 也是一个遵循 WHATWG 规范的 web 标准 API。在浏览器和nodejs 中实现的对象深拷贝方法。

在 JavaScript 中，当你将一个对象赋值给另一个变量时，实际上你只是在复制这个对象的引用，而非对象本身。这意味着如果你修改了新的变量所引用的对象，原始的对象也会被修改，因为它们指向了同一个内存地址。

深拷贝意味着它会创建一个新对象，并且复制原始对象中所有层级的属性到新对象中，包括那些嵌套的对象。所以使用 structuredClone 可以避免上述浅拷贝的这种情况，因为它会创建一个完全独立的副本，改变副本的属性不会再影响原对象。

```js
// 假设我们有一个包含多层嵌套对象的对象
const original = {
  name: "Original",
  details: {
    created: new Date(),
    tags: ["node", "javascript"],
  },
}

// 使用 structuredClone 方法来创建这个对象的深拷贝
const cloned = structuredClone(original)

// 测试是否引用同一个对象
console.log(original === cloned) // 输出 false，因为它们是两个不同的对象

// 现在我们修改 cloned 对象的属性
cloned.name = "Cloned"
cloned.details.tags.push("clone")

// 打印 original 对象，可以看到它并没有被修改
console.log(original)
// 输出:
// {
//   name: 'Original',
//   details: {
//     created: [Date object representing creation time],
//     tags: ['node', 'javascript'] // 注意这里没有 'clone'
//   }
// }

// 打印 cloned 对象，可以看到它与 original 不同
console.log(cloned)
// 输出:
// {
//   name: 'Cloned',
//   details: {
//     created: [Date object representing creation time],
//     tags: ['node', 'javascript', 'clone']
//   }
// }
```

structuredClone 方法使用结构化克隆算法实现深拷贝，可以复制大多数常见的 JavaScript 数据类型，但有一些限制，例如无法复制 DOM 节点、函数、正则表达式、特定的内置对象（如 Map、Set 等）以及包含循环引用的对象等；拷贝是递归的，会复制对象的所有嵌套属性和值；如果被复制的对象包含函数、原型链等特殊属性，这些属性在拷贝过程中会被忽略。

structuredClone 还支持一个选项对象 `options = {transfer: function}`，可以设置转换特定类型的对象。例如，你可以传递一个 transfer 函数来转移 ArrayBuffer 的所有权（这是高级功能，通常用于处理性能敏感的操作，比如在 Web Workers 之间传输数据）。

> 参考
>
> - [MDN 结构化克隆算法](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
> - [MDN 可转移对象 transferable object](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Transferable_objects)

## AbortController

Node.js 中的 AbortController 类也是一个遵循 Web API 的实现，允许你发送一个中止信号以取消某些基于 Promise 的异步任务。比如用来取消例如 Fetch API 请求，或者是任何可以使用 AbortSignal 的操作。

创建一个 AbortController 实例后，实例上有一个 signal 属性，它是一个 AbortSignal 对象，这个信号对象可以传递给那些基于 Promise 并且支持传入 signal 属性的异步任务的函数调用中。然后当你想要取消正在执行的操作，只需调用实例的 `abort()` 方法，那么与该实现相关联的所有 AbortSignal 都会变得已中止（即它们的 aborted 属性会变为 true），同时还会触发 abort 事件。

- AbortController
  - 属性：signal
  - 实例方法：`abort([reason])`

示例：取消 HTTP 取消

```js
const controller = new AbortController()
const signal = controller.signal

fetch("https://example.com", { signal })
  .then((response) => response.json())
  .then((data) => {
    console.log(data)
  })
  .catch((err) => {
    if (err.name === "AbortError") {
      console.log(`请求被取消: ${signal.reason}`)
      // 输出: 请求被取消: 请求超时
    } else {
      console.error("Fetch error:", err)
    }
  })

// 在5秒后如果请求还没完成就取消它
setTimeout(() => controller.abort("请求超时"), 5000)
```

示例：取消某个事件监听

```js
import { EventEmitter } from "node:events"

const emitter = new EventEmitter()
const controller = new AbortController()
const signal = controller.signal

signal.addEventListener("abort", () => {
  console.log("Operation aborted!")
})

function eventHandler() {
  console.log("Event fired!")
}

emitter.on("myEvent", eventHandler, { signal }) // 添加事件监听并关联中止信号

// 触发事件
emitter.emit("myEvent")

// 当我们不再想监听事件时可以取消监听
controller.abort()

// 因为已经取消监听，所以以下代码不会导致 eventHandler 被调用
emitter.emit("myEvent")
```

## AbortSignal

AbortSignal 信号对象，是用来关联一个或多少异步任务的通信机制，通常与信息控制对象 AbortController 一起用于使用。

调用 `AbortController` 类的实例对象的 `abort([reason])` 方法，发出取消的控制信号，信号通过 AbortSignal 传播，所以与该 signal 信号关联的异步任务都会被中止取消，并对应的 abort 监听事件。

AbortSignal 类实例本身也有一些控制方法和属性。

- AbortSignal
  - 属性：
    - aborted：boolean, 该信息是否已被取消的标识
    - reason：any, 被取消的原因，可以是任意值，通过 `abort([reason])` 传递，如果没传，默认 `AbortError`
  - 静态方法
    - `abort()`：返回一个已经被置为 `aborted=true` 状态的信号
    - `any()`:
    - `timeout()`
  - 实例方法
    - `throwIfAborted()`: 用来检查是否有取消信号发出的一种快捷方式。如果 AbortSignal 已经被触发（即操作已被请求取消），调用这个方法会抛出一个 AbortError 错误；如果没有被触发，则什么都不做。
  - 事件
    - abort：当信号被取消时触发

### any

`AbortSignal.any(signals)` 是一个静态方法，用于将多个取消信号组合成一个新的 AbortSignal 对象，只要组合里的任何一个信号被触发了“中止”，这个新创建的信号就会跟着被触发。有点类似 `Promise.race` 的效果。

```js
// 创建两个AbortController实例
const controller1 = new AbortController()
const controller2 = new AbortController()

// 使用AbortSignal.any静态方法合并两个信号
const combinedSignal = AbortSignal.any([controller1.signal, controller2.signal])

// 设定超时函数，如果5秒内未完成，则触发中止
setTimeout(() => {
  controller1.abort() // 这里仅触发一个中止，但由于使用了AbortSignal.any，两个请求都会被取消
}, 5000)

// 模拟向第一个API发请求
fetch("https://api.example.com/data1", { signal: combinedSignal })
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => {
    if (err.name === "AbortError") {
      console.log("请求1被取消")
    }
  })

// 模拟向第二个API发请求
fetch("https://api.example2.com/data2", { signal: combinedSignal })
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => {
    if (err.name === "AbortError") {
      console.log("请求2被取消")
    }
  })
```

在上面的示例中：

- 我们分别为两个 API 请求创建了各自的AbortController。
- 使用 `AbortSignal.any` 把两个取消信号合并成一个。
- 如果任意一个请求执行了中止操作（本例中是通过 setTimeout 模拟的 5 秒超时），那么所有使用该合并信号的请求都会被取消。
- 这样做可以很方便地管理多个可能需要同时取消的异步操作，保证它们能够同步地被中断，避免资源浪费。

通过这种方式，你可以有效地控制多个异步任务，增加代码的灵活性和效率。

### timeout

`AbortSignal.timeout(delay)`是一个静态方法，用来创建一个可以在指定时间之后自动取消（abort）的信号。这种功能很有用，尤其是当你想要在一定时间内限制某个操作的执行时间时。

可以相当于一个定时器功能使用。

- delay参数代表超时时间，单位是毫秒（ms）。也就是说，你可以设定多久之后需要触发取消操作。
- 方法返回一个AbortSignal实例，这个实例会在指定的 delay 时间后被自动标记为"aborted"（已取消）状态。

示例1：如果 5 秒内服务器没有响应，AbortSignal 对象会变成取消状态，从而中断 HTTP 请求，并触发的'error'事件，并传递一个名为'AbortError'的错误对象

```js
// 创建一个在5000毫秒后自动取消的AbortSignal
const signal = AbortSignal.timeout(5000)

const request = https.get("https://example.com", { signal }, (response) => {
  // 这里处理响应...
})

request.on("error", (err) => {
  if (err.name === "AbortError") {
    console.log("请求因超时被取消")
  } else {
    // 处理其他类型的错误
  }
})
```

示例2：一个异步函数 doSomethingAsync，在 2 秒内没有完成，那么signal会变为取消状态，导致监听器被调用，进而清除定时器并抛出一个错误。这样我们就成功地限制了该操作的最长执行时间。

```js
// 创建一个在2秒后会自动取消的AbortSignal
const signal = AbortSignal.timeout(2000)

function doSomethingAsync(signal) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve("完成了!")
    }, 3000) // 假设这个操作需要3秒钟

    // 监听abort信号，如果收到则清除定时器并抛出错误
    signal.addEventListener("abort", () => {
      clearTimeout(timeoutId)
      reject(new Error("操作被取消"))
    })
  })
}

// 执行异步操作，并传入AbortSignal
doSomethingAsync(signal)
```

示例3：如果用户在5秒内仍没有输入，则关闭输入流监听。

```js
import readline from "node:readline/promises"

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // AbortSignal 是全局变量
  const signal = AbortSignal.timeout(5_000) // 5s 超时

  signal.addEventListener(
    "abort",
    () => {
      console.log("The food question timed out")
      rl.close()
    },
    { once: true }
  )

  const answer = await rl.question("What is your favorite food? ", { signal })
  console.log(`Oh, so your favorite food is ${answer}`)
}

main()
```

### throwIfAborted

在 doSomething 函数中，我们通过调用 signal.throwIfAborted() 来确保在函数执行的任何阶段如果收到了取消信号，就立即停止执行并抛出 AbortError，从而使得调用者能够知道操作已经被取消并处理这种情况。

```js
function doSomething(signal) {
  // 在操作开始前立即检查是否已经被取消
  signal.throwIfAborted()

  // ... 执行一些操作 ...

  // 在操作过程中定期检查
  if (signal.aborted) {
    signal.throwIfAborted() // 如果已经取消，会抛出错误
  }

  // ... 完成操作 ...
}

const controller = new AbortController()
const { signal } = controller
try {
  doSomething(signal)
} catch (err) {
  if (err.name === "AbortError") {
    console.error("Operation aborted by the user.")
  } else {
    throw err // 其他错误继续抛出
  }
}

// 取消操作
controller.abort()
```
