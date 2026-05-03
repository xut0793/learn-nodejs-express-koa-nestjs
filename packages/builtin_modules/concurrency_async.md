# Node.js 异步编程模式

Node.js 的底层架构非常独特，它基于 V8 引擎和 libuv 库，采用“单线程事件循环 + 异步非阻塞 I/O”模型。这意味着它的 JavaScript 执行层（V8）是单线程的，非常适合处理高并发的 I/O 密集型任务（如网络请求、数据库查询）。

Node.js 的核心优势在于其**单线程、非阻塞 I/O 模型**。它通过事件循环（Event Loop）机制，能够高效地处理高并发任务。

在 Node.js 的发展过程中，异步编程模式主要经历了三个阶段的演进：**回调函数（Callback）**、**Promise** 以及 **async/await**。

## 回调函数（Callback）

回调函数是 Node.js 最原始的异步处理方式。它的核心思想是：将一个函数作为参数传递给另一个函数，当异步操作完成后，再执行这个函数。

在 Node.js 核心模块（如 `fs` 文件系统）中，通常遵循**“错误优先（Error-first）”**的回调约定，即回调函数的第一个参数是错误对象（`err`），第二个参数才是成功后的数据。

```javascript
const fs = require("fs")

// 异步读取文件
fs.readFile("example.txt", "utf8", (err, data) => {
  if (err) {
    console.error("读取文件失败:", err)
    return
  }
  console.log("文件内容:", data)
})

console.log("正在读取文件...") // 这行代码会先于回调函数执行
```

痛点：回调地狱（Callback Hell），当多个异步操作存在依赖关系（例如：读取文件A -> 根据A的内容读取文件B -> 再读取文件C）时，回调函数会层层嵌套，导致代码呈“金字塔形”，可读性和维护性极差。

## Promise 对象

为了解决回调地狱的问题，ES6 引入了 `Promise`。它是一个容器，里面保存着某个未来才会结束的事件（通常是一个异步操作）的结果。

Promise 的状态与核心方法：

| 状态/方法     | 描述                                                    |
| :------------ | :------------------------------------------------------ |
| `pending`     | 初始状态，表示异步操作正在进行中。                      |
| `fulfilled`   | 成功状态，异步操作成功完成，并返回结果。                |
| `rejected`    | 失败状态，异步操作失败，并返回错误原因。                |
| `p.then()`    | 用于指定 resolved（成功）状态的回调函数。               |
| `p.catch()`   | 用于指定 rejected（失败）状态的回调函数，统一捕获错误。 |
| `p.finally()` | 无论状态如何，最终都会执行的方法（常用于清理工作）。    |

Promise 并发处理方法：

| 方法                   | 描述                                                                                   |
| :--------------------- | :------------------------------------------------------------------------------------- |
| `Promise.all()`        | 接收一个 Promise 数组，所有 Promise 都成功时才返回成功，只要有一个失败就返回失败。     |
| `Promise.race()`       | 接收一个 Promise 数组，哪个 Promise 最先改变状态（无论成功或失败），就返回哪个的结果。 |
| `Promise.allSettled()` | 等待所有 Promise 都结束（无论成功或失败），返回一个包含所有结果的数组。                |

```javascript
const fs = require("fs").promises // 使用 Node.js 提供的 Promise 版本 API

fs.readFile("example.txt", "utf8")
  .then((data) => {
    console.log("文件内容:", data)
    return "下一步操作的数据" // 可以链式传递数据
  })
  .then((nextData) => {
    console.log(nextData)
  })
  .catch((err) => {
    console.error("发生错误:", err)
  })
  .finally(() => {
    console.log("操作结束")
  })
```

## async / await

`async/await` 是 ES2017 引入的语法糖，它建立在 `Promise` 之上，让异步代码的写法看起来像同步代码，极大地提升了代码的可读性和调试体验。这是目前 Node.js 开发中**最推荐**的异步编程模式。

| 关键字 | 描述                                                                                                                |
| :----- | :------------------------------------------------------------------------------------------------------------------ |
| async  | 声明一个函数是异步的，该函数会隐式返回一个 `Promise` 对象。                                                         |
| await  | 只能在 `async` 函数内部使用。它会暂停当前函数的执行，等待右侧的 `Promise` 决议（resolve）后，再恢复执行并返回结果。 |

```javascript
const fs = require("fs").promises

async function readMyFile() {
  try {
    // 使用 await 等待异步操作完成，代码结构清晰直观
    const data = await fs.readFile("example.txt", "utf8")
    console.log("文件内容:", data)

    const data2 = await fs.readFile("example2.txt", "utf8")
    console.log("第二个文件内容:", data2)
  } catch (err) {
    // 使用标准的 try...catch 语句捕获异步错误
    console.error("读取文件出错:", err)
  }
}

readMyFile()
```

## 总结与对比

为了让你更直观地理解这三种模式的差异，我为你整理了以下对比表格：

| 特性       | 回调函数 (Callback)            | Promise                       | async/await                 |
| :--------- | :----------------------------- | :---------------------------- | :-------------------------- |
| 代码可读性 | 差（多层嵌套导致“金字塔”结构） | 较好（链式调用，扁平化）      | 优秀（同步风格的写法）      |
| 错误处理   | 需在每一层手动判断 `err`       | 使用 `.catch()` 统一捕获      | 使用 `try...catch` 自然处理 |
| 并发支持   | 需手动管理，较复杂             | 提供 `Promise.all` 等原生支持 | 配合 `Promise.all` 使用     |
| 调试体验   | 困难（堆栈信息易断裂）         | 一般                          | 良好（接近同步代码调试）    |

在现代 Node.js 项目开发中，建议优先使用 `async/await`\*\* 来处理异步逻辑，因为它最符合人类的线性思维。同时，底层可以结合 `Promise` 的并发方法（如 `Promise.all`）来优化性能。尽量避免使用传统的回调函数，除非是在处理一些老旧的第三方库或特定的流（Stream）事件监听场景。
