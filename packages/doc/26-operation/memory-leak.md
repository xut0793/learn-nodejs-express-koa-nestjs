# Memory Leak 内存泄露

```
内存系统目录：
- 什么是内存、堆、栈
- 内存的生命周期：内存分配、内存的使用、内存释放和内存回收
- 内存管理：手动和自动
- v8 的内存回收机制，主要针对堆内存
  - 早期的引用计数
  - 分代回收：新生代区和老生代区
  - 回收算法：Scavenge / Mark-Sweep（标记－清除） / Mark-compact（标记－紧缩）Incremental marking（增量标记）/ lazy sweeping（惰性清理）
- 什么是内存泄漏
- 如何排查内存泄露
  - 内存泄漏的症状
  - 内存泄漏的检查：怎么知道应用占用了多少内存，怎么看内存变化趋势？
- 常见的内存泄漏原因
- 如何预防内存泄漏
```

内存泄漏的实质就是应当回收的对象因为意外没有被回收，变成了常驻在老生代中的对象。

> V8 的内存回收机制，可以查看上一节 [memory-application-gc](./memory-application-gc.md)

## 内存泄漏的症状

内存泄漏通常不会引起注意，只有当程序最终崩溃时在控制台输出 `Out of Memory` 相关的信息才会被关注。但如果存在应用监控系统，我们也可以通过某些数据趋势来判断是否存在内存泄漏。

内存泄漏可观察的症状：

1. 一是内存、CPU 使用率和主机的平均负载随时间推移而增加，但控制台或日志输出没有报告任何明显的原因。
2. 二是请求响应时间变得越来越长，直到 CPU 使用率达到 100% 时，应用程序完全停止响应。当内存已满，并且没有足够的多余空间时，甚至无法通过SSH连接连接服务器。
3. 三是当应用程序重新启动时，所有问题都神奇地消失了，程序流程又一切正常，但随着程序运行一项时间后，问题会重复出现时。

如果观察到以上症状，那基本确定是程序存在内存泄漏了，需要进一步检查造成内存泄漏的代码。

> 引用 [Finding And Fixing Node.js Memory Leaks: A Practical Guide](https://marmelab.com/blog/2018/04/03/how-to-track-and-fix-memory-leak-with-nodejs.html)

## 内存泄漏的检查

### `process.memoryUsage`

使用 Node 提供的 `process.memoryUsage` 方法查看当前应用内存统计信息。`process.memoryUsage` 返回一个对象，包含了 Node 进程的内存占用信息。该对象包含四个字段，单位是字节 byte，含义如下。

- rss（resident set size）：RAM 中保存的进程占用的内存部分，包括指令区和堆栈。
- heapTotal：堆中总共申请到的内存量，包括用到的和没用到的。
- heapUsed：堆中目前用到的内存量，判断内存泄漏我们主要以这个字段为准。
- external： V8 引擎内部的 C++ 对象占用的内存。

判断内存泄漏，以 `heapUsed`字段为准。

```js
console.log(process.memoryUsage())

// {
//  rss: 27709440,
//  heapTotal: 5685248,
//  heapUsed: 3449392,
//  external: 8772
// }
```

示例：

```js
/**
 * 单位为字节格式为 MB 输出
 */
const format = function (bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + " MB"
}
/**
 * 封装 print 方法输出内存占用信息
 */
const print = function () {
  const memoryUsage = process.memoryUsage()
  console.log(
    JSON.stringify({
      rss: format(memoryUsage.rss),
      heapTotal: format(memoryUsage.heapTotal),
      heapUsed: format(memoryUsage.heapUsed),
      external: format(memoryUsage.external),
    })
  )
}

// example.js
function Quantity(num) {
  if (num) {
    return new Array(num * 1024 * 1024)
  }
  return num
}
function Fruit(name, quantity) {
  this.name = name
  this.quantity = new Quantity(quantity)
}
let apple = new Fruit("apple")
print()
let banana = new Fruit("banana", 20)
print()
```

执行以上代码，内存向下面所展示的，apple 对象 heapUsed 的使用仅有 4.21 MB，而 banana 我们对它的 quantity 属性创建了一个很大的数组空间导致 heapUsed 飙升到 164.24 MB。

```sh
$ node example.js
{"rss":"19.94 MB","heapTotal":"6.83 MB","heapUsed":"4.21 MB","external":"0.01 MB"}
{"rss":"180.04 MB","heapTotal":"166.84 MB","heapUsed":"164.24 MB","external":"0.01 MB"}
```

手动执行垃圾回收内存释放，当 banana 对象我们不在使用了，对它重新赋予一空值 `banana = null`，并通过全局对象手动执行 GC。

```js
// example.js
let apple = new Fruit("apple")
print()
let banana = new Fruit("banana", 20)
print()

// 不再使用的对象进行内存释放
banana = null
// 手动触发 GC，需要在执行时传入特定参数开启 --expose-gc
global.gc()
print()
```

执行

```sh
$ node --expose-gc example.js
{"rss":"19.95 MB","heapTotal":"6.83 MB","heapUsed":"4.21 MB","external":"0.01 MB"}
{"rss":"180.05 MB","heapTotal":"166.84 MB","heapUsed":"164.24 MB","external":"0.01 MB"}
{"rss":"52.48 MB","heapTotal":"9.33 MB","heapUsed":"3.97 MB","external":"0.01 MB"}
```

将 banana 对象赋为 null 后进行 GC，在第三个 print 打印出的结果可以看到 heapUsed 的使用已经从 164.24 MB 降到了 3.97 MB。经过 GC 之后所占用的内存已经被释放了。

### node inspect 和 chrome devTools

1. 使用 `--inspect` 参数运行程序 `node --inspect test.js`
2. 运行 Chrome，然后地址栏输入 URI：`chrome://inspect`。 适用于Node.js应用程序的全功能调试器，点击下方的 remote target 链接附加到第一步开启的 node 服务。
3. 使用 Memory 或 performance 标签栏的功能进行内存分析。

> 参照 [Chrome 内存剖析工作概览](https://jinlong.github.io/2016/05/01/4-Types-of-Memory-Leaks-in-JavaScript-and-How-to-Get-Rid-Of-Them/)

### 外部依赖包

heapdump / memwatch

### 应用监控系统

PM2
Prometheus 普罗米修斯

## 常见的内存泄漏原因

### 全局变量

JavaScript 处理未定义变量的方式比较宽松，未定义的变量挂载到全局对象上。在浏览器中，全局对象是 window ，Nodejs 全局对象 global，全局变量不会自动回收，将会常驻内存直到进程退出才会被释放，除非通过 delete 或 重新赋值为 undefined/null 解决之间的引用关系，才会被回收。

```js
function foo(arg) {
  bar = "this is a hidden global variable"
}
```

真相是

```js
function foo(arg) {
  global.bar = "this is an explicit global variable"
}
```

另一种意外的全局变量可能由 this 创建：

```js
function foo() {
  this.variable = "potential accidental global"
}
// Foo 调用自己，this 指向了全局对象（window / global）
// 而不是 undefined
foo()
```

> 在 JavaScript 文件头部加上 'use strict'，可以避免此类错误发生。启用严格模式解析 JavaScript ，避免意外的全局变量。

### 函数闭包

这个也是一个常见的内存泄漏情况，闭包会引用父级函数中的变量，如果闭包得不到释放，闭包引用的父级变量也不会释放从而导致内存泄漏。

一个真实的案例 — The Meteor Case-Study，2013年，Meteor 的创建者宣布了他们遇到的内存泄漏的调查结果。有问题的代码段如下

> 代码来自 [Meteor blog An interesting kind of JavaScript memory leak](https://blog.meteor.com/an-interesting-kind-of-javascript-memory-leak-8b47d2e7f156)

```js
var theThing = null
var replaceThing = function () {
  var originalThing = theThing
  var unused = function () {
    if (originalThing) console.log("hi")
  }
  theThing = {
    longStr: new Array(1000000).join("*"),
    someMethod: function () {
      console.log(someMessage)
    },
  }
}
setInterval(replaceThing, 1000)
```

以上代码运行时每次执行 replaceThing 方法都会生成一个新的对象，但是之前的对象没有释放导致的内存泄漏。这块涉及到一个闭包的概念 “同一个作用域生成的闭包对象是被该作用域中所有下一级作用域共同持有的” 因为定义的 unused 使用了作用域的 originalThing 变量，因此 replaceThing 这一级的函数作用域中的闭包（someMethod）对象也持有了 originalThing 变量（重点：someMethod 的闭包作用域和 unused 的作用域是共享的），之间的引用关系就是 theThing 引用了 longStr 和 someMethod、someMethod 引用了 originalThing、originalThing 又引用了上次的 theThing，因此形成了链式引用。

Meteor 的博文解释了如何修复此种问题。在 replaceThing 的最后添加 originalThing = null 。

### 被遗忘的计时器

在 JavaScript 中使用 setTimeout / setInterval 是很常见的需求，它们也是内存泄漏的常见来源。只要定时器未被清除，那么它们的回调函数内引用的对象将一直保持引用状态，不会被垃圾回收。

```js
const someResource = getData()

setTimeout(function () {
  const node = document.getElementById("Node")
  if (node) {
    node.innerHtml = JSON.stringify(someResource)
  }
}, 1000)
```

someResource 大数据对象将永远在内存中增长，并且不会被垃圾回收，虽然 setTimeout 仅被调用一次，但因为 setTimeout 一直未被清除（计时器停止才会被回收），引用关系一直存在。您应该确保将返回的 timeoutId / intervalId 存储在一个变量中，并确保在它们不再使用时立即清除它们：

```js
const timeoutId = setTimeout(thisWillLeak(), 2000)
// .... do some things with this Interval
clearInterval(timeoutId)
```

### 未移除事件监听回调函数

```js
var element = document.getElementById("button")
function onClick(event) {
  element.innerHTML = "text"
}
element.addEventListener("click", onClick)
```

如果按钮元素一直存在，且点击事件未被取消，那么回调函数也将被一直引用。

### 特别注意 DOM 的引用

有时，保存 DOM 节点内部数据结构很有用。假如你想快速更新表格的几行内容，把每一行 DOM 存成字典（JSON 键值对）或者数组很有意义。

```js
var elements = {
  button: document.getElementById("button"),
  image: document.getElementById("image"),
  text: document.getElementById("text"),
}
function doStuff() {
  image.src = "http://some.url/image"
  button.click()
  console.log(text.innerHTML)
  // 更多逻辑
}
function removeButton() {
  // 按钮是 body 的后代元素
  document.body.removeChild(document.getElementById("button"))
  // 此时，仍旧存在一个全局的 #button 的引用
  // elements 字典。button 元素仍旧在内存中，不能被 GC 回收。
}
```

此时，同样的 DOM 元素存在两个引用：一个在 DOM 树中，另一个在字典中。将来你决定删除这些行时，需要把两个引用都清除，才能正确被 GC 回收。

此外还要考虑 DOM 树内部或子节点的引用问题。假如你的 JavaScript 代码中保存了表格某一个单元格 td 元素的引用。将来决定删除整个表格的时候，直觉上，你可能会认为 GC 会回收除了已保存的 td 以外的其它节点。但实际情况并非如此：已保存的 td 节点是表格的子节点，子元素与父元素是存在相互引用关系的。由于代码保留了 td 节点的引用，td 节点中的父节点属性也保留着整个表格节点对象的引用，导致整个表格仍待在内存中。保存 DOM 元素引用的时候，要小心谨慎。

### 慎将内存做为缓存

通过内存来做缓存这可能是我们想到的最快的实现方式，在业务逻辑中缓存还是很常用的，但是了解了 Node.js 中的内存模型和垃圾回收机制之后在使用的时候就要谨慎了，为什么呢？缓存中存储的键越多，长期存活的对象也就越多,垃圾回收时将会对这些对对象做无用功。

以下举一个获取用户 Token 的例子，memoryStore 对象会随着用户数的增加而持续增长，以下代码还有一个问题，当你启动多个进程或部署在多台机器会造成每个进程都会保存一份，显然是资源的浪费，最好是通过 Redis 做共享。

```js
const memoryStore = new Map()
exports.getUserToken = function (key) {
  const token = memoryStore.get(key)
  if (token && Date.now() - token.now > 2 * 60) {
    return token
  }
  const dbToken = db.get(key)
  memoryStore.set(key, {
    now: Date.now(),
    val: dbToken,
  })
  return token
}
```

### 模块私有变量内存永驻

在加载一个模块代码之前，Node.js 会使用一个如下的函数封装器将其封装，保证了顶层的变量（var、const、let）在模块范围内，而不是全局对象。

这个时候就会形成一个闭包，在 require 时会被加载一次，将 exports 对象保存于内存中，直到进程退出才会回收，这个将会导致的是内存常驻，所以避免一些没必要的模块加载，否则也会造成内存增加。

```js
;(function (exports, require, module, __filename, __dirname) {
  // 模块的代码实际上在这里
})
```

一个小的建议，对于一个模块的引用建议仅在头部初次加载之后使用 const 缓存起来，而不是在使用时每次都去加载一次（每次 require 都要进行路径分析、缓存判断的）

```js
const a = require("a.js") // 推荐
function test() {
  a.run()
}
```

```js
function test() {
  // 不推荐
  require("a.js").run()
}
```

### 事件重复监听

在 Node.js 中对一个事件重复监听则会报如下错误，实际上使用的 EventEmitter 类，该类包含一个 listeners 数组，默认为 10 个监听器超出这个数则会报警如下所示，用于发现内存泄漏，也可以通过 emitter.setMaxListeners() 方法为指定的 EventEmitter 实例修改限制。

### 其它注意事项

- 在使用定时器 setInterval 时，要记得使用对应的 clearInterval 进行清除，因为 setInterval 执行完之后会返回一个值且不会自动释放。
- 另外还有 map、filter 等对数组进行操作，每次操作之后都会创建一个新的数组，将会占用内存，如果只是单纯的遍历，可以使用 forEach 代替。

这些都是开发中的一些细节，但是往往细节决定成败，每一次的内存泄漏也都是一次次的不经意间造成的。因此，这些点也是需要我们注意的。

```js
console.log(setInterval(function () {}, 1000)) // 返回一个 id 值
;[1, 2, 3].filter((item) => item % 2 === 0) // [2]
;[1, 2, 3].map((item) => item % 2 === 0) // [false, true, false]
```

## 预防内存泄漏的最佳实践

- 禁用全局变量，在js 文件顶部开启 `use strict`
- 慎用函数闭包
- 当不再需要计时器时，请使用 clearTimeout 和 clearInterval 方法清除计时器。
- 事件侦听器和观察者也是如此。一旦他们完成您希望他们做的事情，请清除它们。不要让事件侦听器永远运行，尤其是当它们要保留父作用域中的任何对象引用时。
- 缓存的 DOM 对象记得置空 null，因为 DOM 节点的父子对象一般都存在循环引用。
- 使用全局导入，慎用动态导入
- 避免事件重复监听
- 注意数组不可变的方法调用
- 慎用内存当作缓存，如果要缓存数组或对象可以使用 weakSet / weakMap 对象替代。
- 不要将大文件添加到内存中，特别是 node 的文件处理逻辑，可以使用 stream 流对象替代。
