# child_process 子进程

在 Node.js 中，由于其单线程事件循环的特性，单核 CPU 无法被充分利用，且 CPU 密集型任务会阻塞整个应用。为了解决这些问题，Node.js 提供了强大的多进程编程能力。

Node.js 的多进程编程主要围绕两大核心模块展开：

- child_process：用于创建和管理子进程
- cluster：用于构建多进程集群，充分利用多核 CPU

child_process 模块允许你在 Node.js 应用中创建子进程来执行系统命令或其他的 Node.js 脚本。它提供了多种创建子进程的方法，其中最常用的是 spawn、exec 和 fork。

child_process 模块提供了四种不同的方法来执行外部应用程序：

`child_process.execFile(file[, args][, options][, callback])`
`child_process.exec(command[, options][, callback])`
`child_process.fork(modulePath[, args][, options])`
`child_process.spawn(command[, args][, options])`

| 方法     | 特点与适用场景                                                                                                                                                                                                                                     | 返回值              |
| :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ |
| execFile | 当你只需要执行一个外部程序的时候使用它。这种方法执行速度快，使用简单，并且在处理有用户输入时相对更安全。                                                                                                                                           | `ChildProcess` 实例 |
| exec     | 你想直接执行一段现成的 shell 命令的时候使用它，支持单个 shell 命令或者利用 shell 管道符组合的多个 shell 命令。调用 exec 方法时内部会启动一个子 shell 程序等待输入的 shell 命令来执行。但此方法要注意用户输入，避免执行一些不安全或不受信任的命令。 | `ChildProcess` 实例 |
| spawn    | 当你处理一段 I/O 程序，会有大量输出需要处理的时候使用它。该方法会返回一个 nodejs 的流式对象 Stream。，适合处理大量数据或长时间运行的命令。                                                                                                         | `ChildProcess` 实例 |
| fork     | `spawn` 的特殊形式，专门用于衍生新的 Node.js 进程执行 JS 程序，会自动建立 IPC 通道，方便父子进程通信。                                                                                                                                             | `ChildProcess` 实例 |

无论是通过哪种方法创建的子进程，都会返回一个 ChildProcess 实例，它常用属性和方法。

| 属性/方法       | 说明                                                   |
| :-------------- | :----------------------------------------------------- |
| `stdout`        | 子进程的标准输出流（可读流）。                         |
| `stderr`        | 子进程的标准错误输出流（可读流）。                     |
| `stdin`         | 子进程的标准输入流（可写流）。                         |
| `pid`           | 子进程的进程标识符（PID）。                            |
| `send(message)` | 向子进程发送消息（主要用于 `fork` 创建的进程）。       |
| `kill(signal)`  | 向子进程发送信号（默认为 `SIGTERM`），用于终止子进程。 |

## 操作系统的 Path 环境变量

在 window 系统里安装了一个应用程序，通常在安装目录下有一个 `.exe` 后缀的文件，点击它就可以启动程序。

但是更常规的做法，我们是直接点击桌面上的应用程序图标就可以启动程序。再有一类是比如 node 这类程序直接在命令行上输入 `node` 即可启动。那操作系统是怎么知道从哪里找到这些程序的 `.exe` 启动文件的呢？

在 Windows / Linux / MacOs 操作系统里都有一个 PATH 的环境变量。PATH 包含了一组可执行程序的执行目录列表。

下面命令可以查看当前系统 PATH 环境变量包含哪些程序启动路径

```sh
echo $PATH
```

输入的是以 `:` 连接的字符串，要更好的格式输出，可以在 Nodejs 提供的 repl 模式下，执行以下代码。

```sh
node
> console.log(process.env.PATH.split(';').join('\n'))

# 输出
# E:\Program Files (x86)\Git\usr\bin
# E:\nvm
# E:\Program Files (x86)\nodejs
# E:\Program Files (x86)\Microsoft VS Code\bin
# ...
```

如果在控制台执行一个程序，当没有提供绝对路径或相对路径时，操作系统就会基于 PATH 里定义的路径搜索，如果找到了，操作系统会基于此路径找到对应程序的启动文件。像上面 `echo` 这类通用程序一般都是内置的。

```sh
echo 'Hello World'
node -v
java -v
```

如果在 PATH 中没有预定义，那么就需要我们显式提供程序的具体执行文件路径了

```sh
./java/jdk-21/bin/java.exe --version
```

## 异常

执行外部程序出现的异常主要三类：

ENOENT 错误：系统找不到调用的程序，这种错误可能是我们把外部应用程序的名称或者路径输入错误导致的。
EPERM 或 EACCES 错误：表示没有足够的权限访问它。
外部程序调用后退出的状态码非零状态时：表示该程序不能够在当前操作系统下执行对应的任务。 Nodejs 会把该返回的状态码作为异常和相关的数据输出到 stdout 和 stderr 中，即终端控制台上。

## execFile

```
child_process.execFile(file[, args][, options][, callback])

file：       这是你想要执行的可执行文件的名称或者路径。如果这个文件在系统的 PATH 环境变量里定义的目录中，你可以直接提供文件名；否则，你需要提供完整的路径。
args：       这是一个可选参数，是一个数组，包含所有你想要传递给程序的命令行参数。
options：    这又是一个可选参数，是一个对象，它提供了一些额外的配置选项，比如设置工作目录、环境变量等。
  cwd          `<string> | <URL>`  子进程的当前工作目录。
  env          `<Object>`          环境变量键值对。默认值：process.env。
  encoding     `<string>`          默认值：'utf8'
  timeout      `<number>`          默认值：0
  maxBuffer    `<number>`          标准输出或标准错误上允许的最大数据量（以字节为单位）。如果超过，则子进程将终止并截断任何输出。请参阅 maxBuffer 和 Unicode 的警告。默认值：1024 * 1024。
  killSignal   `<string> | <integer>` 默认值：'SIGTERM'
  signal       `<AbortSignal>`    允许使用 AbortSignal 中止子进程。
  uid          `<number>`         设置进程的用户身份（请参阅 setuid(2)）。
  gid          `<number>`         设置进程的组标识（请参阅 setgid(2)）。
  windowsHide  `<boolean>`        隐藏通常在 Windows 系统上创建的子进程控制台窗口。默认值：false。
  windowsVerbatimArguments  `<boolean>` 在 Windows 上不为参数加上引号或转义。在 Unix 上被忽略。默认值：false。
  shell        `<boolean> | <string>` 如果是 true，则在 shell 内运行 command。在 Unix 上使用 '/bin/sh'，在 Windows 上使用 process.env.ComSpec。可以将不同的 shell 指定为字符串。参见 Shell 要求 和 默认 Windows shell。默认值：false（无壳）。
callback：   当子进程停止时，这个回调函数会被调用。通常它有三个参数：`error`、`stdout` 和 `stderr`。
  error      是在执行过程中遇到错误时的错误对象；
  stdout     是程序的标准输出内容；
  stderr     则是程序的标准错误输出。
```

示例：在 nodejs 程序中执行一段 python 脚本 `script.py`

```js
const { execFile } = require("child_process")

// Python 脚本的路径
const scriptPath = "/path/to/your/script.py"
// 传递给脚本的参数
const args = ["arg1", "arg2"]

// python 安装时会在 PATH 里注册环境变量
execFile("python", [scriptPath, ...args], (error, stdout, stderr) => {
  if (error) {
    console.error("执行出错:", error)
    return
  }
  console.log("标准输出:", stdout)
  console.error("标准错误输出:", stderr)
})
```

也可以模拟 fork 的功能利用 nodejs 执行一段 js 程序。

```js
execFile("node", ["/sum.js", 1, 2], (err, stdout, stderr) => {
  // 省略
})
```

## exec

`child_process.exec()` 方法是 `child_process.spawn()` 的一个特例，它会自动 spawn 衍生一个子进程，并启动 shell 程序（在 UNIX 类系统中通常是 `/bin/sh`，在 Windows 上则是 `cmd.exe`）并在该 shell 中执行你提供的命令。所以 exec 方法适用于执行命令行程序。

```
child_process.exec(command[, options][, callback])

command (必须): 你想要执行的命令字符串。
options (可选): 一个对象，可以用来定制操作的各种设置，例如：
  cwd          `<string> | <URL>`    子进程的当前工作目录。
  env          `<Object>`            环境变量键值对。默认值：process.env。
  encoding     `<string>`            默认值：'utf8'
  timeout      `<number>`            默认值：0
  maxBuffer    `<number>`            标准输出或标准错误上允许的最大数据量（以字节为单位）。如果超过，则子进程将终止并截断任何输出。请参阅 maxBuffer 和 Unicode 的警告。默认值：1024 * 1024。
  killSignal  `<string> | <integer>` 默认值：'SIGTERM'
  signal      `<AbortSignal>`       允许使用 AbortSignal 中止子进程。
  uid         `<number>`            设置进程的用户身份（请参阅 setuid(2)）。
  gid         `<number>`            设置进程的组标识（请参阅 setgid(2)）。
  windowsHide `<boolean>`           隐藏通常在 Windows 系统上创建的子进程控制台窗口。默认值：false。
  shell      `<boolean> | <string>` 指定 shell 程序。默认在类 Unix 系统上使用 `/bin/sh`，在 Windows 上使用 `PowerShell`，或者回退到 `cmd.exe`。
callback (可选): 当进程终止或有错误发生时调用的回调函数，其参数包括：
  error：  错误对象或者 null。
  stdout： 子进程的标准输出。
  stderr： 子进程的标准错误输出。
```

示例一：ipconfig 获取网络接口信息

```js
exec("ifconfig", (error, stdout, stderr) => {
  if (error) {
    console.error(`执行的错误: ${error}`)
    return
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`)
    return
  }
  console.log(`网络接口信息: \n${stdout}`)
})
```

示例二：

```js
// 执行 'ls -lh /usr' 命令
exec("ls -lh /usr", (error, stdout, stderr) => {
  if (error) {
    console.error(`执行出错: ${error}`)
    return
  }

  console.log(`标准输出:\n${stdout}`)
  if (stderr) {
    console.error(`标准错误:\n${stderr}`)
  }
})
```

如果用 execFile 来实现

```js
execFile("ls", ["-lh", "/usr"], (err, stdout, stderr) => {
  // 省略
})
```

## spawn

child_process.spawn 方法用来创建新的子进程。一个子进程就是从你正在运行的主程序（也称为父进程）中衍生出另一个程序实例。

```
child_process.spawn(command[, args][, options])

command (必须): 你想要执行的命令字符串。
args：       这是一个可选参数，是一个数组，包含所有你想要传递给程序的命令行参数。
options (可选): 一个对象，可以用来定制操作的各种设置，例如：
  cwd           <string> | <URL>      使用 cwd 指定从中衍生子进程的工作目录。如果没有给定，则默认是继承当前工作目录。。
  env           <Object>              环境变量键值对。默认值：process.env。
  argv0         <string>              显式设置发送给子进程的 argv[0] 的值。如果未指定，这将设置为 command。
  stdio         <Array> | <string>    子进程的标准输入输出配置（参见 options.stdio）。
  detached      <boolean>             准备子进程独立于其父进程运行。具体行为取决于平台，参见 options.detached。
  uid           <number>              设置进程的用户身份（请参阅 setuid(2)）。
  gid           <number>              设置进程的组标识（请参阅 setgid(2)）。
  serialization <string>              指定用于在进程之间发送消息的序列化类型。可能的值为 'json' 和 'advanced'。有关详细信息，请参阅 高级序列化。默认值：'json'。
  shell         <boolean> | <string>  如果是 true，则在 shell 内运行 command。在 Unix 上使用 '/bin/sh'，在 Windows 上使用 process.env.ComSpec。可以将不同的 shell 指定为字符串。参见 Shell 要求 和 默认 Windows shell。默认值：false（无壳）。
  windowsVerbatimArguments <boolean>  在 Windows 上不为参数加上引号或转义。在 Unix 上被忽略。当指定了 shell 并且是 CMD 时，则自动设置为 true。默认值：false。
  windowsHide   <boolean>             隐藏通常在 Windows 系统上创建的子进程控制台窗口。默认值：false。
  signal        <AbortSignal>         允许使用 AbortSignal 中止子进程。
  killSignal    <string> | <integer>  当衍生的进程将被超时或中止信号杀死时要使用的信号值。默认值：'SIGTERM'。
  timeout       <number>              允许进程运行的最长时间（以毫秒为单位）。默认值：undefined。
返回：<ChildProcess>
```

示例一：上述 fork 的示例用 spawn 实现

```js
const { spawn } = require("child_process")

// 假设这是一堆需要排序的数据
const unsortedData = [5, 3, 8, 1, 2, 9, 4, 7, 6]

// 使用 fork 方法启动子进程
const child = spawn("node", ["./sortWorker.js"])

// 监听子进程发来的消息事件
child.on("message", (sortedData) => {
  console.log("排序后的数据：", sortedData)
  // 当接收完数据后，可以关闭子进程
  child.kill()
})

// 向子进程发送未排序的数据
child.send(unsortedData)
```

示例二：上述 execFile 的示例用 spawn 实现

```js
const { spawn } = require("child_process")

// Python 脚本的路径
const scriptPath = "/path/to/your/script.py"
// 传递给脚本的参数
const args = ["arg1", "arg2"]

// python 安装时会在 PATH 里注册环境变量
const child = spawn("python", [scriptPath, ...args])
child.stdout.on("data", (data) => {
  console.log("标准输出:", stdout)
})

child.stderr.on("data", (data) => {
  console.error("标准错误输出:", stderr)
})

child.on("error", (code) => {
  console.error("执行出错:", error)
})
```

示例三：上述 exec 的示例用 spawn 实现

```js
const { spawn } = require("child_process")

const child = spawn("ls", ["-lh", "/usr"], { shell: true }) // 显式启用shell

child.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`)
})

child.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`)
})

child.on("error", (code) => {
  console.error("error:", error)
})

child.on("close", (code) => {
  console.log(`子进程退出码：${code}`)
})
```

spawn 最大的特点是返回的子进程对象带有 stdin / stdout / stderr 这几个标准 I/O 流对象，可以以流的形式的操作大数量对象。

```js
const { spawn } = require("child_process")

const cat = spawn("cat", ["example.txt"])
const sort = spawn("sort")
const uniq = spawn("uniq")

cat.stdout.pipe(sort.stdin)
sort.stdout.pipe(uniq.stdin)
uniq.stdout.pipe(process.stdout)
```

## fork

`child_process.fork()` 方法是 `child_process.spawn()` 的另一个特例，专门用于 spawn 衍生新的 Node.js 进程。与 `child_process.spawn()` 一样，返回 ChildProcess 对象。返回的 ChildProcess 将有额外的内置通信通道，允许消息在父进程和子进程之间来回传递。

但是衍生的 Node.js 子进程独立于父进程，除了两者之间可以建立的 IPC 通信通道之外。每个进程都有自己的内存，具有自己的 V8 实例，需要额外的资源分配，所以不建议衍生大量子 Node.js 进程。

```
child_process.fork(modulePath[, args][, options])

modulePath  <string> | <URL>  要在子进程中运行的模块。
args        <string[]>        字符串参数列表。
options     <Object>
  cwd       <string> | <URL>  子进程的当前工作目录。
  detached  <boolean>         准备子进程独立于其父进程运行。具体行为取决于平台，参见 options.detached。
  env       <Object>          环境变量键值对。默认值：process.env。
  execPath  <string>          用于创建子进程的可执行文件。
  execArgv  <string[]>        传给可执行文件的字符串参数列表。默认值：process.execArgv。
  gid       <number>          设置进程的组标识（请参阅 setgid(2)）。
  serialization <string>      指定用于在进程之间发送消息的序列化类型。可能的值为 'json' 和 'advanced'。有关详细信息，请参阅 高级序列化。默认值：'json'。
  signal   <AbortSignal>      允许使用中止信号关闭子进程。
  killSignal <string> | <integer> 当衍生的进程将被超时或中止信号杀死时要使用的信号值。默认值：'SIGTERM'。
  silent   <boolean>          如果为 true，则子进程的标准输入、标准输出和标准错误将通过管道传输到父进程，否则它们将从父进程继承，有关详细信息，请参阅 child_process.spawn() 的 stdio 的 'pipe' 和 'inherit' 选项。默认值：false。
  stdio    <Array> | <string> 参见 child_process.spawn() 的 stdio。提供此选项时，它会覆盖 silent。如果使用数组变体，则它必须恰好包含一个值为 'ipc' 的条目，否则将抛出错误。例如 [0, 1, 2, 'ipc']。
  uid      <number>          设置进程的用户身份（请参阅 setuid(2)）。
  windowsVerbatimArguments <boolean> 在 Windows 上不为参数加上引号或转义。在 Unix 上被忽略。默认值：false。
  timeout  <number>          允许进程运行的最长时间（以毫秒为单位）。默认值：undefined。
返回：<ChildProcess>
```

注意点：

- 默认情况下，`child_process.fork()` 将使用父进程的 process.execPath 衍生新的 Node.js 实例。options 对象中的 execPath 属性允许使用替代的执行路径。
- `child_process.fork()` 不支持 `child_process.spawn()` 中可用的 shell 选项，如果设置将被忽略，因为 fork 内部启动的 `node.exe` 应用。

一段需要在子进程执行 js 程序代码

```js
// sortWorker.js
// 接收主进程发送的消息
process.on("message", (data) => {
  const sortedData = data.sort((a, b) => a - b)
  // 将排好序的数据发回主进程
  process.send(sortedData)
})
```

在主进程中 fork 一个 Nodejs 子进程来执行上述代码，并进行进程间通信

```js
const { fork } = require("child_process")

// 假设这是一堆需要排序的数据
const unsortedData = [5, 3, 8, 1, 2, 9, 4, 7, 6]

// 使用 fork 方法启动子进程
const child = fork("./sortWorker.js")

// 监听子进程发来的消息事件
child.on("message", (sortedData) => {
  console.log("排序后的数据：", sortedData)
  // 当接收完数据后，可以关闭子进程
  child.kill()
})

// 向子进程发送未排序的数据
child.send(unsortedData)
```

## options.stdio

options.stdio 选项用于定义子进程的 I/O 行为。

默认情况下子进程的标准输入stdin、标准输出 stdout 和标准错误 stderr 定义到子进程 ChildProcess 对象自身的的 `subprocess.stdin`、`subprocess.stdout` 和 `subprocess.stderr` 流上。即默认值相当于将 options.stdio 设置为等价的 `['pipe', 'pipe', 'pipe']`。

stdio 的值是一个数组，`[stdin, stdout, stderr]`，如果设置一个字符串，相当 stdin / stdout / stderr 都是一样的。
即 `stdio: 'pipe` 相当于 `['pipe', 'pipe', 'pipe']`

可用的值：

```
'pipe'：在子进程和父进程之间创建管道。管道的父端作为 subprocess.stdio[fd] 对象上的 child_process 对象的属性公开给父级。为 fds 0、1 和 2 创建的管道也可分别用作 subprocess.stdin、subprocess.stdout 和 subprocess.stderr。这些不是实际的 Unix 管道，因此子进程不能通过它们的描述符文件使用它们，例如 /dev/fd/2 或 /dev/stdout。

'overlapped'：与 'pipe' 相同，只是在句柄上设置了 FILE_FLAG_OVERLAPPED 标志。这对于子进程的 stdio 句柄上的重叠 I/O 是必需的。有关详细信息，请参阅 文档。这与非 Windows 系统上的 'pipe' 完全相同。

'ipc'：创建一个 IPC 通道，用于在父子之间传递消息/文件描述符。一个 ChildProcess 最多可以有一个 IPC stdio 文件描述符。设置此选项可启用 subprocess.send() 方法。如果子进程是 Node.js 进程，IPC 通道的存在将启用 process.send() 和 process.disconnect() 方法，以及子进程中的 'disconnect' 和 'message' 事件。

'ignore'：忽略子进程的 I/O。虽然 Node.js 将始终为其生成的进程打开 fds 0、1 和 2，但将 fd 设置为 'ignore' 将导致 Node.js 打开 /dev/null 并将其附加到子进程的 fd。

'inherit'：子进程将会使用父进程的 stdio 流。在前三个位置，这分别相当于 process.stdin、process.stdout、process.stderr。在任何其他位置，相当于 'ignore'。

<Stream> 对象：与子进程共享引用 tty、文件、套接字或管道的可读或可写流。流的底层文件描述符在子进程中复制到与 stdio 数组中的索引相对应的 fd。流必须有一个底层描述符（文件流在 'open' 事件发生之前不会启动）。

正整数：整数值被解释为在父进程中打开的文件描述符。它与子进程共享，类似于 <Stream> 对象的共享方式。Windows 不支持传递套接字。

null, undefined:使用默认值。对于 stdio fds 0、1 和 2（换句话说，stdin、stdout 和 stderr），创建了一个管道。对于 fd 3 及更高版本，默认值为 'ignore'。
```

示例，将子进程执行的标准 I/O 记录到日志中。

```js
const { spawn } = require("child_process")
const fs = require("fs")

const out = fs.openSync("./out.log", "a") // 获取日志文件句柄
const err = fs.openSync("./err.log", "a") // 获得错误日志文件句柄

const child = spawn("ls", ["-lh", "/usr"], {
  stdio: ["pipe", out, err], // stdin 用管道，即 chid.stdin 的输入，stdout写入日志文件，stderr写入错误日志文件
})

// 你不会在终端上看到任何输出，因为stdout和stderr都被重定向到了文件。
```

## detached unref ref

### detached

默认情况下，当你在 Node.js 中创建一个新的子进程时，通常情况下，这个子进程是附属于它的父进程（即创建它的 Node.js 进程）的。如果父进程终止了，通常所有的子进程也会随之终止。

但是，如果你在创建子进程时设置了 `options.detached` 为 true，那么这个子进程会变成一个“脱离 detached”的进程。这意味着子进程将会在其父进程退出后继续运行，因为它不再依赖于父进程的生命周期。

> detached 从子进程角度考虑是不是与主进程相关联

### ref / unref

每当你创建一个子进程时，Node.js 会在内部维护一个引用计数，以确保主程序只能在所有的子进程都已经结束了才能退出。

`subprocess.ref()`: 当你调用此方法时，它会增加内部的引用计数，确保 Node.js 的事件循环继续运行，等待该子进程退出。即使没有其他活动保持事件循环运行，只要存在被 .ref() 过的子进程，Node.js 程序就不会退出。

`subprocess.unref()`: 相反，调用这个方法会减少内部的引用计数，允许 Node.js 的事件循环在没有其他活动时退出，即使子进程还在运行。这意味着 Node.js 进程可以在所有的 unref 过的子进程运行期间结束，而不需要等待它们完成。

> ref / unref 从主进程角度考虑是不是要与子进程相关联

### 示例

通过设置 `detached: true` 和调用 `child.unref()`，主进程和子进程都没有关联关系，独立行为，主进程进程退出，并且退出后 'server.js' 仍然会在后台运行。

```js
const { spawn } = require("child_process")

// 假设 'server.js' 是一个需要长时间运行的服务器程序
const child = spawn("node", ["server.js"], {
  detached: true,
  stdio: "ignore", // 忽略 stdin, stdout, stderr
})

child.unref() // 让子进程独立于父进程运行
```

## 通信 channel

相关属性

```
subprocess.channel 代表子进程与主进程建立的 IPC 通道的管道对象
subprocess.channel.ref() 此方法使 IPC 通道保持父进程的事件循环运行。即如果还存在该通道管道对象，主进程空闲时也不能退出。注意区别 subprocess.ref
subprocess.channel.unref() 此方法使 IPC 通道不保持父进程的事件循环运行，注意区别 subprocess.unref
subprocess.connected 属性指示当前通道是否正常连接，当为 false 时，将无法再发送或接收消息。将在 subprocess.disconnect() 方法调用后设置为 false。
subprocess.disconnect() 关闭父子之间的 IPC 通道，允许子级在没有其他连接保持活动状态时优雅地退出。调用此方法后，父进程和子进程中的 subprocess.connected 和 process.connected 属性（分别）将设置为 false，进程之间将不再可能传递消息。并触发 disconnect 事件。
subprocess.send(message[, sendHandle[, options]][, callback]) 子进程向主进程发送消息，会触发主进程的 message 事件。
事件：'message' 在子进程中注册消息事件，接收主进程调用 `subprocess.send` 方法发送的消息事件。
```

示例：

主进程中开启子进程

```js
// parent.js
const { fork } = require("child_process")

const child = fork("child.js")

child.on("disconnect", () => {
  console.error("父进程：子进程的 IPC 通道已关闭")
  // 可以在这里进行清理工作或重启子进程等操作
})

// 发送消息给子进程
child.send({ message: "开始处理任务" })
```

子进程程序

```js
// child.js
process.on("message", (msg) => {
  console.log("子进程收到消息:", msg)

  // 处理信息或任务...

  // 假设任务完成，现在断开与父进程的连接
  process.disconnect()
})
```

## 进程池

nodejs 每次创建一个新的子进程，并不是没有代价的。

> 官方所述，每个子进程都有一个 V8 的新实例，预计每个一子进程需要耗费30毫秒的启动时间和10MB的内存。也就是，佻不能创建太多，因为这些并不是没有代价开销的。

所以一种更好的实践是，维护一个进程池，池中存放固定数量的可以长时间运行的子进程，由主进程进行分配使用。
