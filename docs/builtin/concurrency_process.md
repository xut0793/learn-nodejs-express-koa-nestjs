# Process 进程对象

当我们执行 `node index.js` 的时候，操作系统就会创建一个Node.js进程，我们的代码就是在这个Node.js进程中执行。

进程是操作系统里非常重要的概念，也是不容易理解的概念，但是看起来很复杂的进程，其实在操作系统的代码里，也只是一些数据结构和算法，只不过它比一般的数据结构和算法更复杂。

进程在操作系统里，是用一个 `task_struct` 结构体表示的。因为操作系统是大部分是用C语言实现的，没有对象这个概念。如果我们用 JS 来理解的话，每个进程就是一个对象，每次新建一个进程，就是新建一个对象。

`task_struct` 结构体里保存了一个进程所需要的一些信息，包括当前执行状态、执行上下文、打开的文件、根目录、工作目录、收到的信号、信号处理函数、代码段、数据段的信息、进程id、执行时间、退出码等等。

Nodejs 中可以通过 `node:process` 获取程序当前程序运行的进程信息。

## nodejs 自身信息和系统信息

```
process.version // 显示当前 Nodejs 的版本 v22.2.0
process.versions // 显示当前 Nodejs 内部依赖库的版本，{node: '22.2.0', v8: '12.4.254.14-node.12', 'base64': '0.5.2', ..}
process.release // 显示 Nodejs 编译后相关 tar.gz 文件地址， {name: 'node', lts: 'Hydrogen', sourceUrl: 'https://xxx', headersUrl: 'xxx', libUrl: 'xxx'}
process.config // 返回一个对象，显示用于编译当前 Node.js 可执行文件的配置选项，{target_defaults: {xxx}, variables: { xxx }, ..}
process.allowedNodeEnvironmentFlags // 返回 NODE_OPTIONS 环境变量中允许的选项参数的只读 Set 对象，可遍历行到，类似 --inspect-brk， --abort_on_uncaught_exception 选项参数
process.arch // 返回当前操作系统 CPU 架构，可能的值 'arm'、'arm64'、'ia32'、'loong64'、'mips'、'mipsel'、'ppc'、'ppc64'、'riscv64'、's390'、's390x' 和 'x64'
process.platform // 返回当前操作系统操，可能的值 ‘linux' 'win32' 'android' ’freebsd' 等等
process.pid // 返回当前进程号
process.ppid // 如果当前是在子进程中调用，则返回当前进程的父进程的 PID。
```

## 命令行参数和环境变量

```js
/**
 * 返回一个数组，数组元素内容如下：
 * 1. 数组的第一个元素是 node 的完整路径。
 * 2. 第二个元素是正被执行的文件的路径。
 * 3. 从第三个元素开始，每个元素都是一个传递给该脚本的命令行参数。
 *
 * 假设命令行执行 node process-args.js one two=three four，那么输出内容如下：
 * 0: /usr/local/bin/node // node.exe 根据用户安装的路径，输出可能不同
 * 1: /Users/mjr/work/node/process-args.js // 当前执行脚本所在的路径
 * 2: one
 * 3: two=three
 * 4: four
 *
 * 获取命令行参数的常用方法 const args = process.argv.slice(2)，移除前两个不关心的元素
 */
process.argv

/**
 * process.argv0 实际上就提供了 process.argv 数组中的第一个元素的值，
 * 但是它的优点是即使用户修改了 process.argv 数组，process.argv0 依然保持不变，
 * 提供了一种获取原始 Node.js 可执行文件路径的可靠方式。
 */
process.argv0

/**
 * 它返回一个字符串，表示启动当前 Node.js 进程的可执行文件的绝对路径。
 * 与 process.argv[0] 和 process.argv0 的值相同
 */
process.execPath

/**
 * 提供了一种方法来获取和操作 Node.js 进程的启动参数，这在诊断、调试或者特定行为定制方面非常有用。
 *
 * 比如命令行执行 node --max-old-space-size=200 yourScript.js，那么输出
 * ["--max-old-space-size=200"];
 *
 */
process.execArgv

/**
 * 包含了当前程序进程中的环境变量，可以修改此对象，但此类修改不会反映在 Node.js 进程之外。但一般不会修改，只用于读取某些环境变量
 */
process.env

/**
 * nodejs v20.12.0 最近版本引入的新功能，将 .env 文件加载到 process.env 中。
 */
process.loadEnvFile(path)
```

## 运行时

```js
// 返回当前进程标头（即返回 ps 的当前值）。为 process.title 分配一个新值会修改 ps 的当前值。
process.title

// 返回当前工作目录，所谓“当前工作目录”（Current Working Directory），指的是运行你的 Node.js 程序时，终端或命令行所处的目录。
process.cwd()

/**
 * 在程序运行期，更改当前工作目录，此时再用 process.cwd 返回值为新设置的值
 *
 * 应用场景：
 * 1. 当你的 Node.js 应用需要根据不同的运行环境（开发、测试、生产）访问不同目录中的文件时。
 * 当你的应用需要操作大量文件，而这些文件分散在不同的目录中，并且希望通过使用相对路径来简化文件访问逻辑时。
 *
 * 注意事项
 * 1. 在使用process.chdir()时，如果提供的目录不存在，会抛出异常。因此，最好在调用这个方法前检查目录是否存在。
 * 2. 更改工作目录是一个有副作用的操作，它会影响到进程中所有相关的路径解析。因此，务必谨慎使用，确保它不会导致其他部分的相对路径出错。
 */
process.chdir(directory)

/**
 * 在这个事件循环中，process.nextTick() 允许你将一个回调函数放到下一个事件循环迭代的开始处执行。
 * 这意味着无论何时调用 process.nextTick()，提供给它的回调函数都会在当前操作完成后、任何 I/O 事件（包括定时器）处理之前被执行
 */
process.nextTick(callback[, ...args])

/**
 * 何时使用 queueMicrotask() 与 process.nextTick()
 * 1.process.nextTick() 是把一个回调函数放到下一个事件循环中迭代
 * 2. queueMicrotask() 是把一个回调函数放当前微任务队列中
 *
 * 区别：
 * 1. 当前事件循环中，微任务队列里回调函数执行完后，才进入下一事件循环的迭代，所以 queueMicrotask 比 nextTick 更早被执行
 * 2.  process.nextTick() 除第一个传入回调函数外，后续参数值将在调用时作为参数传递给回调函数。使用 queueMicrotask() 实现相同的效果，需要使用闭包或绑定函数
 */
```

## 事件

```
事件：'beforeExit'
事件：'exit'
事件：'rejectionHandled'
事件：'uncaughtException'
事件：'uncaughtExceptionMonitor'
事件：'unhandledRejection'
事件：'worker'
事件：signal 进程信息
事件：'warning'
      触发自定义警告 Node.js 警告名称
      process.emitWarning(warning[, options])
      process.emitWarning(warning[, type[, code]][, ctor])
      避免重复警告
```

### beforeExit

- 触发时机：
  1. 当 Nodejs 清空事件循环并且没有额外的工作安排时，则会触发 beforeExit 事件。即代码正常执行到没有可执行代码时触发。
  2. 通常情况下，当没有工作要调度时，nodejs 进程会正常退出，此时在退出前会调用 beforeExit 事件回调，从而使 nodejs 进程继续
- 注意事项：对于显示终止进程，比如 `process.exit()` 或者异常报错停止进程，都不会触发 beforeExit 事件。

```js
import process from "node:process"
process.on("beforeExit", (exitCode) => {
  console.log("Process beforeExit event with code: ", code)
  // 此处可以继续执行代码逻辑，进程将不再退出
})
```

### exit

- 触发时机：当以下情况出现时，会触发 exit 事件
  1. `process.exit([exitCode])` 方法调用后
  2. Nodejs 没有可执行代码，正常退出
- 注意事项
  1. 当触发 exit 事件后，不管回调里执行什么逻辑，都不会阻止进程退出。一旦 exit 的所有回调执行完毕，进程仍将终止。
  2. 所以 exit 的回调函数里逻辑必须是同步操作，如果存在异步逻辑，在进程退出后，都会被丢弃，比如下面的定时器逻辑不会被执行

```js
process.on("exit", (exitCode) => {
  console.log(`About to exit with code: ${code}`)
  // 进程退出后，异常定时器逻辑会被忽略
  setTimeout(() => {
    console.log("This will not run")
  }, 0)
})
```

### unhandledRejection 和 rejectionHandled

Promise 是处理异步操作的一种方式，它有几种状态：pending（等待中）、fulfilled（已成功）和 rejected（已失败）。当一个 Promise 被拒绝（rejected），通常我们会用 `.catch()` 方法来捕获这个错误，避免程序崩溃或停止执行。

在实际的应用中，有时候我们可能漏掉了对某个 Promise 拒绝状态的处理（即没有立即捕获这个错误）。Node.js 提供了一个全局进程对象 process，它可以帮助我们监听未被捕获的 Promise 拒绝。其中两个与此相关的事件是 unhandledRejection 和 rejectionHandled。

- unhandledRejection：这个事件在 Promise 被拒绝并且没有立即为其提供 catch 错误处理器时，马上触发，不管后续有没有补上 catch。
- rejectionHandled：如果 Promise 在 rejected 后，开始时未被处理（即未 catch 捕获错误），但稍后添加了错误处理器（比如通过 .catch()），这时在 catch 逻辑执行后， rejectionHandled 事件就会被触发。

```js
process.on("rejectionHandled", (promise) => {
  console.log(
    "C: 先前未处理的 rejected，现已被处理",
    promise instanceof Promise,
  )
})

process.on("unhandledRejection", (reason, promise) => {
  console.log(
    "A: 未被处理的 rejected:",
    promise instanceof Promise,
    "reason:",
    reason,
  )
})

function mockQueryDB(query) {
  return new Promise((resolve, reject) => {
    // 模拟查询失败
    reject(new Error("Query failed"))
  })
}

// 执行查询，但是忘记了立即捕获可能出现的 rejected 错误，但获取了 rejected 句柄
const promise = mockQueryDB("SELECT * FROM users")

// 延迟一段时间后给 Promise 添加 catch 处理
setTimeout(() => {
  promise.catch((error) => console.log("B: 延迟处理 rejected:", error.message))
}, 100)

// 上述代码输出结果：A B C
```

### uncaughtException 和 uncaughtExceptionMonitor

通常情况下，在 Nodejs 应用程序运行过程中，出现错误，会在控制台打印出错误堆栈信息，并结束进程。

要想错误发生时，不中断进程，可以有以下方案：

1. 就近捕获错误
1. 同步代码，就近使用 try...catch 捕获
1. Promise 异常错误，使用 .catch(err) 捕获 rejected
1. 全局监听，即当前程序运行的进程内监听异常事件
   1. Promise rejected 错误，通过 `process.on('unhandledRejection', (reason, promise) => {})` 捕获，此时错误也不会再传播，进程也不会中止了。
   2. 同步代码错误，或未被处理的 Promise rejected 错误，通过 `process.on('uncaughtException', (err, origin)=> {})` 捕获，此时错误也不会再传播，进程也不会中止了。

uncaughtExceptionMonitor

- 触发时机：能触发 uncaughtException 的事件也会触发 uncaughtExceptionMonitor，即 同步代码错误，或未被处理的 Promise rejected 错误
- 与 uncaughtException 比较
  1. 对于 promise rejected 错误，如果已经提供了 unhandledRejection 事件监听，同样也不会触发 uncaughtExceptionMonitor
  1. 仅仅是提供一个钩子能监控错误，但不会干预进程预期错误的执行。比如发生错误，错误经过 uncaughtExceptionMonitor 后，仍然会再次传播到 uncaughtException 中处理。如果没有提供 uncaughtException 回调，进程仍然会因为错误而中止。

```js
process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log("uncaughtExceptionMonitor", origin, err.message)
})

setTimeout(() => {
  // 在 test 函数执行时报错，进程会被终止，不会再执行任务代码，包括事件循环中的异常代码
  console.log("This will not run yet.")
}, 500)

// 故意引发一个未被捕获的异常
function test() {
  throw new Error("哎呀，出错了！")
}

test()

console.log("This will not run.")
```

但如何是以下情况相反

```js
process.on("uncaughtException", (err, origin) => {
  console.log("uncaughtException", origin, err.message)
})
setTimeout(() => {
  // 在 test 函数执行时报错，错误被 uncaughtException 捕获，进程不会中断，继续执行
  console.log("This will still run.")
}, 500)

// 故意引发一个未被捕获的异常
function test() {
  throw new Error("哎呀，出错了！")
}

test()

console.log("This will not run.")
```

uncaughtExceptionMonitor 不会阻止 uncaughtException 事件。

```js
// uncaughtExceptionMonitor 先触发，再触发  uncaughtException
process.on("uncaughtException", (err) => {
  console.trace("uncaughtException", err)
})
process.on("uncaughtExceptionMonitor", (err) => {
  console.trace("uncaughtExceptionMonitor", err)
})
Promise.reject(new Error("from promise"))
```

uncaughtException 事件捕获错误后，进程不会因报错而终止了。但是在编码实践中，在此事件回调中处理完善后逻辑（记录错误日志、关闭数据库连接等优雅关机等的逻辑）后，应主动退出进程，由进程守卫重启。为什么呢？

主要是因为在很多情况下，一旦出现了未捕获的异常，Node.js 的状态可能已经不稳定了，尤其是对于 V8 引擎的堆栈和资源来说。因此，在这个事件的回调函数中执行太多逻辑或尝试继续正常运行程序是有风险的。

### 信号事件 signal event

系统信号是一种用于操作系统上进程间的通信机制。类比于 node 语境中的事件，一个信号是一个异步的消息通知，它会发送到一个进程后，进程内特定的信号监听回调就会执行。

总共有60个可以使用的信号，windows 系统可以在 git bash 中运行命令 `kill -l`，列出了所有信号。

```
$ kill -l

 1) SIGHUP       2) SIGINT       3) SIGQUIT      4) SIGILL       5) SIGTRAP
 6) SIGABRT      7) SIGEMT       8) SIGFPE       9) SIGKILL     10) SIGBUS
11) SIGSEGV     12) SIGSYS      13) SIGPIPE     14) SIGALRM     15) SIGTERM
16) SIGURG      17) SIGSTOP     18) SIGTSTP     19) SIGCONT     20) SIGCHLD
21) SIGTTIN     22) SIGTTOU     23) SIGIO       24) SIGXCPU     25) SIGXFSZ
26) SIGVTALRM   27) SIGPROF     28) SIGWINCH    29) SIGPWR      30) SIGUSR1
31) SIGUSR2     32) SIGRTMIN    33) SIGRTMIN+1  34) SIGRTMIN+2  35) SIGRTMIN+3
36) SIGRTMIN+4  37) SIGRTMIN+5  38) SIGRTMIN+6  39) SIGRTMIN+7  40) SIGRTMIN+8
41) SIGRTMIN+9  42) SIGRTMIN+10 43) SIGRTMIN+11 44) SIGRTMIN+12 45) SIGRTMIN+13
46) SIGRTMIN+14 47) SIGRTMIN+15 48) SIGRTMIN+16 49) SIGRTMAX-15 50) SIGRTMAX-14
51) SIGRTMAX-13 52) SIGRTMAX-12 53) SIGRTMAX-11 54) SIGRTMAX-10 55) SIGRTMAX-9
56) SIGRTMAX-8  57) SIGRTMAX-7  58) SIGRTMAX-6  59) SIGRTMAX-5  60) SIGRTMAX-4
```

但是基本上你只需要知道 SIGTERM(15) 和 SIGKILL(9)。

- SIGINT(2) 用户在终端键入 INTR 字符，（通常是按下 Ctrl+C）发出的中断信号，表示要求进程退出。
- SIGQUIT(3) 用户在终端键入 QUIT 字符，（通常是按下 Ctrl+\）发出的中断信号，类似于 SIGINT 信号，但是会在进程退出前产生 core dump 文件。
- SIGTERM(15) 操作系统发出的一个友好要求终止进程信号，程序可以监听这个信号，清理资源后退出，或者也可以忽略这个信号。
- SIGKILL(9) 立即终止进程，与 SIGTERM 不同，进程不能响应或忽略这个信号，进程会立刻终止。

kill 命令语法 `kill [信号名称或数字选项] pid(s)`，当忽略了中间信号参数，该命令默认触发 `SIGTERM` 信号。

```sh
kill 1049 # 触发 SIGTERM 信号

kill SIGKILL 1049 # 触发 SIGKILL 信号
kill -9 1049 # 同上

kill 1045 1045 # 同时关闭多少进程
```

> 如果你不知道应用的PID，仅需要运行这个命令：`ps ux`

在 Node.js 中，process 对象可以用来捕获和处理这些信号。Node.js 支持多种信号，每种信号都对应不同的事件。当 Node.js 进程接收到特定的信号时，它会触发相应的事件。

信号事件最常用的一个场景就是实现优雅退出。所谓优雅退出，就是在退出前，让进程处理完存量请求或数据库操作完等已经在进行的任务的完成后，安全地关闭进程。如果进程直接被关闭，可能会导致存量的请求超时导致客户端报错，或者数据库操作数据丢失和异常情况的发生。

nodejs 应用程序实现优雅退出的关键就是 `server.close()` 方法。当我们使用close关闭一个server时，server会等所有的连接关闭后才会触发close事件。

```js
const http = require("http")
const server = http.createServer(app).listen(3000)

server.on("close", () => {
  // 在进程退出前执行必要的清理工作，比如断开数据库连接等

  //  退出代码用于表示进程退出的状态，0 表示正常退出，非 0 表示异常退出。
  process.exit(0)
})

// 防止进程提前挂掉，当一个未被捕获的异常（exception）被抛出时触发。
process.on("uncaughtException", () => {})

// 当一个 Promise 被 reject，并且没有对应的 catch() 时触发。
process.on("unhandledRejection", () => {})

// 注册退出事件处理函数
process.on("exit", (code) => {
  server.close()
})

// 用户按下了 Ctrl+C，进程需要火速退出时触发。
process.on("SIGINT", () => {
  server.close()
})

// 进程收到了终止信号
process.on("SIGTERM", () => {
  server.close()
})
```

如果应用使用了 cluster 模块的集群方式，那么需要分别处理 master 和 worker 进程下的异常监听

- worker 进程下监听异常退出后，需要 refork
- master 进程下监听异常退出后，需要在退出前 kill 所有 worker，然后 worker 退出前关闭 server。

```js
// 集群中某个 work 异常退出后，会发出 exit 事件，可以在 cluster 上进行监听
cluster.on("exit", (worker, code, signal) => {
  console.log(
    `Worker ${worker.process.pid} died, code: ${code}, signal: ${signal}`,
  )

  // 移除当前子进程内所有事件监听器，避免内存泄漏
  worker.removeAllListeners()

  // refork a new worker
  cluster.fork()
})
```

```js
// master 进程相当于主线程了，可以直接监听系统信号
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
  process.once(signal, onMasterSignal),
)

// worker 监听 master 要求的退出信息
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
          worker.send({ message: "disconnect" })
          // disconnect 方法让 master 不再向 worker 分配连接
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

> [graceful-shutdown-example](https://github.com/chay-xu/graceful-shutdown-example/blob/master/graceful.js)

### warning 事件

在软件开发中，"警告"通常指的是那些不足以导致程序停止运行的问题，但是可能会影响程序的正确性、性能或者未来的兼容性。通过发出警告，可以引起开发者的注意，促使其改正或优化代码。

以下是一些常见的 Node.js 警告名字以及它们的意义：

- DeprecationWarning: 这表明某些正在使用的功能已经被废弃，并可能在未来的版本中被移除。使用废弃的特性可能导致代码在将来的 Node.js 版本中无法正常工作。警告输出信息如： `(node:12345) [DEPXXXX] DeprecationWarning: url.parse() is deprecated.`
- ExperimentalWarning: 此警告表明你正在使用一个实验性的功能，这意味着该功能可能在未来改变或完全移除，因此应该小心使用。警告输出信息如： `(node:12345) ExperimentalWarning: The experimentalFeature is an experimental feature. This feature could change at any time`
- Warning: 除了特定的警告类型（如DeprecationWarning或ExperimentalWarning）之外，一些其他类型的通用警告也会使用简单的Warning名称。

```js
process.on("warning", (warning) => {
  console.warn(`警告名称: ${warning.name}`)
  console.warn(`警告信息: ${warning.message}`)
})

// 故意触发一个废弃警告，仅作为示例
require("fs").asyncReadFile()
```

### 自定义警告

除了内置的一些警告情形，也可以根据业务逻辑需求，自定义警告通知。

```
process.emitWarning(warning[, type[, code]][, ctor]) // nodejs@v6.0.0
process.emitWarning(warning[, options]) // nodejs@v8.0.0

warning <string> | <Error> 要触发的警告。
options <Object>
  type <string> 当 warning 是 String 时，type 是用于触发的警告类型的名称。默认值：'Warning'。
  code <string> 触发的警告实例的唯一标识符。
  ctor <Function> 当 warning 为 String 时，ctor 是可选函数，用于限制生成的堆栈跟踪。默认值：process.emitWarning。
  detail <string> 要包含在错误中的额外文本。
```

示例，假设我们正在开发一个应用程序，该程序依赖于一个即将被废弃的 API。我们希望在代码中明确标记出使用该 API 的地方，并给出警告，以便未来进行替换或移除。

```js
if (deprecatedApi.isUsed()) {
  process.emitWarning("DeprecatedAPI is used, please migrate to the new API.", {
    code: "DeprecatedApiWarning",
    detail:
      "The DeprecatedAPI will be removed in future versions, it is recommended to use NewAPI instead.",
  })
}
// 控制台会输出如下信息
// (node:56338) [DeprecatedApiWarning] Warning: DeprecatedAPI is used, please migrate to the new API.
// The DeprecatedAPI will be removed in future versions, it is recommended to use NewAPI instead.

// 入口文件添加事件监听
process.on("warning", (warning) => {
  console.warn(warning.name) // 'Warning'
  console.warn(warning.message) // 'DeprecatedAPI is used, please migrate to the new API.'
  console.warn(warning.code) // 'DeprecatedApiWarning'
  console.warn(warning.stack) // Stack trace
  console.warn(warning.detail) // 'The DeprecatedAPI will be removed in future versions, it is recommended to use NewAPI instead.'
})
```

nodejs 官方文档建议，作为最佳实践，每个进程只应触发一次警告。为此，则调用 `emitWarning()` 前判断下 `emitMyWarning.warned`。

```js
import { emitWarning } from "node:process"

function emitMyWarning() {
  if (!emitMyWarning.warned) {
    emitMyWarning.warned = true
    emitWarning("Only warn once!")
  }
}
emitMyWarning()
// Emits: (node: 56339) Warning: Only warn once!
emitMyWarning()
// Emits nothing
```

## nextTick / setImmediate / queueMicrotask

## 进程 I/O

> Linux 中一切皆文件，所以 I/O 也视为文件，具有文件描述符，编号是最开始三个，标签输入流 stdin 0; 标准输出流 stdout 1; 标签输出错误流 stderr 2;
>
> [Lindex 文件系统](./22-fs-linux.md)

```js
process.stdin // 标准输入流
process.stdin.fd // 标准输入流的文件描述符，通常是 0
process.stdout // 标准输出流
process.stdout.fd // 标准输出流的文件描述符，通常是 1
process.stderr // 标准输出错误流
process.stderr.fd // 标准输出错误流的文件描述符，通常是 2
```

示例代码

```js
// 输出的示例
import fs from "node:fs"

console.log("console.log 输出信息\n")

process.stdout.write("process.stdout.write 输出信息\n")

fs.writeSync(
  process.stdout.fd,
  "fs.writeSync 结合 process.stdout.fd 输出信息\n",
  null,
  "utf8",
)
```

## 进程退出

```js
// 以指定 code 的退出状态同步终止进程。
// 如果省略 code，则退出使用 'success' 代码 0 或 process.exitCode 的值（如果已设置）。直到所有 'exit' 事件监听器都被调用，Node.js 才会终止。
// 最佳实践是：代码不应直接调用 process.exit()，而应设置 process.exitCode 并通过避免为事件循环安排任何额外工作来允许进程自然退出：
process.exit([code])

// 当进程正常退出或通过 process.exit() 退出而不指定代码时，将作为进程退出码的数字。
// 如果 process.exit(code) 有指定 code，将覆盖 exitCode
process.exitCode

process.pid // 返回当前进程编号

// 将信号事件发送到指定 pid 的进程
// 尽管此函数的名字是 process.kill()，但它实际上只是信号发送者，进程接受到信息号，触发指定信号事件，调用信号监听回调。
// 至于进程接受到信号后，是否 kill 关闭进程，取决于进程中是否有该信号事件的监听回调，以及回调中执行的逻辑中是否报错或显式调用 process.exit([code])
process.kill(pid[, signal])

// 调用 process.abort() 后，Node.js 进程会立刻停止执行，不会执行任何尚未完成的异步操作、定时器或任何其他回调函数。
// 此外，这也会导致 Node.js 进程退出并生成一个核心转储文件（core dump），这个文件对于后续的调试非常有用，因为它包含了进程终止时的内存快照。
// 从语义上讲，这种情形更适合于 kill 的语义，但存在api历史问题。
process.abort()
```

## 进程退出代码

当没有更多异步操作挂起时，Node.js 通常会以 0 状态代码退出。

```
1 未捕获的致命异常：有一个未捕获的异常，它没有被域或 'uncaughtException' 事件处理程序处理。
2：未使用（由 Bash 预留用于内置误用）
3 内部 JavaScript 解析错误：Node.js 引导过程中内部的 JavaScript 源代码导致解析错误。这是极其罕见的，通常只能在 Node.js 本身的开发过程中发生。
4 内部 JavaScript 评估失败：Node.js 引导过程内部的 JavaScript 源代码在评估时未能返回函数值。这是极其罕见的，通常只能在 Node.js 本身的开发过程中发生。
5 致命错误：V8 中有一个不可恢复的致命错误。通常将打印带有前缀 FATAL ERROR 的消息到标准错误。
6 非函数内部异常处理程序：有一个未捕获的异常，但内部致命异常处理函数不知何故设置为非函数，无法调用。
7 内部异常处理程序运行时失败：有一个未捕获的异常，内部致命异常处理函数本身在尝试处理它时抛出了一个错误。例如，如果 'uncaughtException' 或 domain.on('error') 句柄抛出错误，就会发生这种情况。
8：未使用。在以前版本的 Node.js 中，退出码 8 有时表示未捕获的异常。
9 无效的参数：指定了未知选项，或者提供了需要值的选项但未提供值。
10 内部 JavaScript 运行时故障：调用引导函数时，Node.js 引导过程内部的 JavaScript 源代码抛出错误。这是极其罕见的，通常只能在 Node.js 本身的开发过程中发生。
12 无效的调试参数：已设置 --inspect 和/或 --inspect-brk 选项，但选择的端口号无效或不可用。
13 悬而未决的高层等待：await 在顶层代码的函数外部使用，但传递的 Promise 从未解决。
14 快照失败：Node.js 开始构建 V8 启动快照，但由于未满足应用状态的某些要求而失败。
>128 信号退出：如果 Node.js 收到 SIGKILL 或 SIGHUP 等致命信号，则其退出代码将为 128 加上信号代码的值。这是标准的 POSIX 实践，因为退出码被定义为 7 位整数，并且信号退出设置高位，然后包含信号代码的值。例如，信号 SIGABRT 的值是 6，因此预期的退出码将是 128 + 6 或 134。
```

## 通信通道 channel

当 Node.js 进程通过 IPC（Inter-Process Communication，进程间通信）方式被创建时（例如，一个 Node.js 进程使用child_process.fork()方法创建另一个 Node.js 子进程），process.channel 将会是一个指向 IPC 通道的引用。如果当前进程不是通过 IPC 创建的，那么process.channel的值将会是undefined。

更多内容将在 child_process 章节讲述。

```
process.channel
process.channel.ref()
process.channel.unref()
process.connected
process.disconnect()
process.send(message[, sendHandle[, options]][, callback])
事件：'disconnect'
事件：'message'

```

```
用户组和访问权限
process.getuid()
process.getgid()
process.geteuid()
process.getegid()
process.getgroups()
process.setuid(id)
process.setgid(id)
process.seteuid(id)
process.setegid(id)
process.setgroups(groups)
process.initgroups(user, extraGroup)
process.permission
process.permission.has(scope[, reference])

性能参数
process.uptime()
process.cpuUsage([previousValue])
process.constrainedMemory()
process.availableMemory()
process.memoryUsage()
process.memoryUsage.rss()
process.resourceUsage()

诊断报告
process.report
process.report.compact
process.report.directory
process.report.filename
process.report.getReport([err])
process.report.reportOnFatalError
process.report.reportOnSignal
process.report.reportOnUncaughtException
process.report.signal
process.report.writeReport([filename][, err])

启动标志查询
process.noDeprecation     --no-deprecation
process.throwDeprecation  --throw-deprecation
process.traceDeprecation  --trace-deprecation


较少涉及
process.debugPort
process.getActiveResourcesInfo()
process.dlopen(module, filename[, flags])
process.getBuiltinModule(id)
process.hasUncaughtExceptionCaptureCallback()
process.setUncaughtExceptionCaptureCallback(fn)
process.setSourceMapsEnabled(val)
process.sourceMapsEnabled
process.umask(mask)
process.hrtime.bigint()


旧版和弃用
process.hrtime([time]) 旧版
process.mainModule
process.umask()
事件：'multipleResolves'

```
