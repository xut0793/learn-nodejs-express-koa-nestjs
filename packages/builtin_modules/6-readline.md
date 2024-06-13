# readline 逐行读入

Node.js 在 I/O 输入和输出的交互中，提供了 console 将信息打印输出到终端显示（ process.stdout / process.stderr / WriteStream）。

在输入的实现上，从版本 7 开始提供 readline 模块，在 Node.js 程序执行期间，读取命令行终端输入或可读的文件流输入（process.stdin / ReadStream）。

## 基本概念：可读流、逐行读取

- 可读流：在 Node.js 中，可读流是一种抽象的数据结构（具体查看 Stream 章节），代表了一个连续的数据源。从这些流中，你可以读取数据，例如从文件、键盘输入等。
- 逐行读取：指的是按行（通常以换行符\r\n分隔）读取数据流的过程。这对于处理日志文件、用户命令输入等场景非常有用，因为这些数据通常是按行组织的。

## 构造函数 InterfaceConstructor

```js
const rl = readline.createInterface(options)
```

其中选项对象 options:

```
1. input                     <stream.Readable>  要监听的可读流。此选项是必需的。
2. output                    <stream.Writable>  执行输出的可写流。
3. completer                 <Function>         可选的用于制表符自动补全的函数。用来决定当用户在命令行中输入并按下 tab 键时，应该展现哪些自动补全的选项。
4. terminal                  <boolean>          true（如果 input 和 output 流应被视为 TTY，并且写入了 ANSI/VT100 转义码）。默认值：在实例化时检查 output 流上的 isTTY。
5. history                   <string[]>         历史行的初始列表。仅当 terminal 由用户或内部的 output 检查设置为 true 时，此选项才有意义，否则历史缓存机制根本不会初始化。默认值：[]。
6. historySize               <number>           保留的最大历史行数。要禁用历史记录，则将此值设置为 0。仅当 terminal 由用户或内部的 output 检查设置为 true 时，此选项才有意义，否则历史缓存机制根本不会初始化。默认值：30。
7. removeHistoryDuplicates   <boolean>          如果为 true，则当添加到历史列表的新输入行与旧输入行重复时，这将从列表中删除旧行。默认值：false。
8. prompt                    <string>           要使用的提示字符串。默认值：'> '。
9. crlfDelay                 <number>           如果 \r 和 \n 之间的延迟超过 crlfDelay 毫秒，则 \r 和 \n 都将被视为单独的行尾输入。crlfDelay 将被强制为不小于 100 的数字。它可以设置为 Infinity，在这种情况下，\r 后跟 \n 将始终被视为单个换行符（这对于带有 \r\n 行分隔符的 读取文件 可能是合理的）。默认值：100。
10. escapeCodeTimeout        <number>           readlinePromises 将等待字符的时长（当以毫秒为单位读取不明确的键序列时，既可以使用目前读取的输入形成完整的键序列，又可以采用额外的输入来完成更长的键序列）。默认值：500。
11. tabSize                  <integer>          一个制表符等于的空格数（最小为 1）。默认值：8。
```

## 实例方法

- `rl.close()` 停止 readline 接口监听输入流，如果监听 `close` 事件的处理函数，则该事件会被触发
- `rl.pause()` 暂停读取输入流，直到再次调用 `rl.resume()` 方法继续读取
- `rl.resume()` 用来恢复输入流的读取，即继续监听输入流的数据。通常是在你之前暂停了流（使用 `rl.pause()`）并且想要再次开始接收数据时使用
- `rl.setPrompt(prompt)` 允许你设置每当等待用户输入时所显示的提示符。参数 prompt 就是你希望展示给用户的字符串，引导他们进行下一步的操作。
- `rl.getPrompt()` 获取当前 readline 实例使用的提示符 prompt
- `rl.prompt([preserveCursor])` 用于显示提示符和等待用户输入的便捷函数。通过设置 preserveCursor 参数，开发者可以控制光标的行为
- `rl.question(query[, options])` 用于显示一个提示信息给用户（通常是提问），然后等待用户输入回答。用户输入的答案在输入后会被传递给一个回调函数。相当于 `rl.setPrompt(query)`和`rl.prompt()`组合的简写形式。
- `rl.write(data[, key])` 允许直接将数据 data 写入输出流（命令行终端或文件），通常可选的参数 key 对象可以模拟终端中的按键输入。
- `rl.line` 表示当前正在处理的行的内容
- `rl.cursor` 用于获取或设置当前光标在输入行中的位置，值是一个整数，表示光标在当前输入行中的位置。计数从 0 开始，也就是说，如果光标在行的开头，rl.cursor的值为 0。较少使用，通常使用 `getCursorPos()` 同时获取行和列的坐标。
- `rl.getCursorPos()` 用来获取当前光标在命令行界面中的位置。
- `rl.cursorTo(x[, y]) / rl.cursorTo(stream, x[, y][, callback])` 用于移动终端中光标的位置，x 表示移动的水平位置（列），从左边 0 开始计数；y 表示移动的垂直位置（行），从上方 0 开始计数。
- `rl.moveCursor(dx, dy) / rl.moveCursor(stream, dx, dy[, callback])` 相对光标当前位置进行移动，dx 是水平方向的移动：如果值为正，则光标向右移动；如果值为负，则向左移动。dy则是垂直方向的移动：正值意味着向下移动，负值意味着向上移动。
- `rl.clearLine(dir) / rl.clearLine(stream, dir[, callback])` 是一个重要的方法，用于清除当前文本行上的内容，dir 参数决定了清除方向
  - dir = -1：从光标位置到行的开头清除。
  - dir = 1：从光标位置到行的末尾清除。
  - dir = 0：清除整行，不论光标在哪里。
- `rl.clearScreenDown() / rl.clearScreenDown(stream[, callback])` 方法是一个用于清除从光标位置到屏幕底部的内容的功能。通常用于清空屏幕操作，类似 `console.clear()` 命令。

## 事件监听

- close
- line
- history
- pause
- resume
- SIGTSTP
- SIGCONT
- SIGINT

## close 事件的触发

在使用 readline 时，close 事件会在以下情况触发：

- `rl.close()` 方法显式调用；
- input 流接收到它的 'end' 事件；
- input 流接收 `Ctrl+D` 组合键，此组合键不会发送特殊系统信号，而是表示一个特殊的二进制值，表示EOF（End Of File）表示传输结束；
- input 流接收 `Ctrl+C` 组合键，发出 SIGINT 触发信号，并且 InterfaceConstructor 实例上没有注册 'SIGINT' 事件监听器。

### 示例：从命令行终端中读取用户输入

```js
import readline from "node:readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question(`What's your name?`, (name) => {
  console.log(`Hi ${name}!`)
  // 不要忘了关闭 Interface 实例！
  rl.close()
})

// 监听 'close' 事件
rl.on("close", () => {
  console.log("已经完成用户输入，程序即将退出。")
  process.exit(0)
})
```

## line 事件

它在每次输入流接收到换行符`（\n）`时被触发。换言之，每当有新的一行数据可供读取时，就会发生这个事件。这对于处理从命令行输入或文件中逐行读取数据非常有用。

### 示例2：读取文本文件内容并逐行处理

假设有一个文本文件 example.txt，内容如下

```txt
第一行内容
第二行内容
第三行内容
```

然后编写脚本，逐行读取并打印这个文件的内容。

```js
import fs from "node:fs"
import readline from "node:readline"

const fileStream = fs.createReadStream("example.txt")

const rl = readline.createInterface({
  input: fileStream, // 使用 fs 创建的可读流作为输入
  crlfDelay: Infinity, // 识别所有 CR LF ('\r\n') 为单独的结束标记，适用于不同操作系统上的文本文件
  output: process.stdout,
})

// 如果 rl 实例时已经定义了输出，line 事件监听如果没有额外逻辑，可以不用监听，会自动输出到控制台
// 如果一定要通过 line 事件监听，那么在 rl 实例时可以不伟入 output。
// 就是说，如果想要文件原样输出，line 事件和 output 二选一即可。
// rl.on("line", (line) => {
//   console.log(line)
// })

rl.on("close", () => {
  console.log("文件已经全部读取完毕")
})
```

可能看到，读取文件流的输入，并没有显式调用 close 函数，而是由文件可读流 end 时自动触发。

## history 事件

每当用户在交互式命令行中输入一个新行，并且这个新行被添加进历史记录时，'history' 事件就会被触发。

为什么要用到 'history' 事件？在构建命令行应用时，可能需要跟踪用户的命令历史，以便提供特定的功能，比如：

- 撤销操作：允许用户回退到之前的命令状态。
- 重复执行：用户可以快速重新执行之前的命令而无需再次输入。
- 搜索历史命令：帮助用户找到之前执行过的命令，提高效率。

示例：使用 readline 模块和 'history' 事件，你可以提供一个功能，让用户查看他们之前的计算历史。

```js
import readline from "node:readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.on("line", (input) => {
  if (input.startsWith("exit")) {
    rl.close()
  }
})

// 监听 'history' 事件
rl.on("history", (history) => {
  if (history.length > 0) {
    rl.prompt() // 起到换行效果
    console.log("命令历史更新了:")
    history.forEach((item, index) => {
      console.log(`${index + 1}: ${item}`)
    })
  }
})
```

每当用户输入一个新命令，'line' 事件的回调函数就会被调用来处理这个命令。同时，'history' 事件也会被触发，打印出更新后的命令历史，从而让用户可以看到他们之前输入过哪些命令。

## pause 事件

通常发生在调用 `rl.pause()` 方法后。每当输入流暂停接收输入数据时，就会发生这种情况。它允许你的程序知道用户已经停止输入，或者你主动想暂停处理输入数据。

> `rl.close()` 方法会先触发 pause 事件，再触发 close 事件

## resume 事件

当暂停的输入流（stdin）被恢复（即重新开始接收数据）时触发的。

### 示例：暂停和恢复事件

```js
import readline from "node:readline"

let timer = null
const rl = readline.createInterface({
  input: process.stdin,
  output: process.output,
})

rl.on("line", (input) => {
  if (input === "pause") {
    rl.pause()
    return
  }

  if (input.startsWith("exit")) {
    console.log("input === exit", input === "exit")
    rl.close()
    return
  }

  console.log(`收到：${input}`)
})

// rl.close() 方法调用也会触发 pause 事件。
rl.on("pause", () => {
  console.log("暂停输入，5秒后继续接收输入...")

  timer = setTimeout(() => {
    rl.resume()
  }, 5000)
})

rl.on("resume", () => {
  console.log("输入流恢复了，继续接收用户的输入...")
})

rl.on("close", () => {
  console.log("关闭输入，程序将退出")
  clearTimeout(timer)
  process.exit(0)
})
```

## 信号事件

readline 实例可以监听三个信号事件：

- SIGTSTP: 暂停信号，它的作用是暂停进程的执行。在大多数系统中，你可以通过按下 `Ctrl+Z` 来发送 SIGTSTP 信号。这个信号通常用于暂停一个前台进程，并将其放入后台。行为上有点类似上述 pause 事件。
- SIGCONT: 恢复信号，系统会告知一个已暂停（stopped）的进程继续执行。
- SIGINT：中断信号，通常由用户按下 `Ctrl+C` 触发，用来请求中断一个程序。不只是 Node.js，绝大多数运行在命令行下的程序都可以通过 SIGINT 信号来安全地中断执行。

> 在 git-bash 中可以通过 `kill -l` 查看所有信息及其对应的序号

以下内容，在 windows 系统无效，仅作参考。

```js
import readline from "node:readline"

let timer = null
const rl = readline.createInterface({
  input: process.stdin,
  output: process.output,
})

rl.on("line", (input) => {
  if (input === "pause") {
    rl.pause()
    return
  }

  if (input.startsWith("exit")) {
    console.log("input === exit", input === "exit")
    rl.close()
    return
  }

  console.log(`收到：${input}`)
})

// TODO: windows 上似乎不行？？
console.log(`脚本正在运行在进程号: ${process.pid}`)
console.log("你可以再开一个终端，然后使用以下命令：")
console.log("   暂停 SIGTSTP：kill -20 [pid]")
console.log("   继续 SIGCONT：kill -18 [pid]")
console.log("   退出 SIGINT：kill -2 [pid]")

// windows 下 ctrl+z 没有用
rl.on("SIGTSTP", () => {
  // 当用户按下Ctrl+Z 时，执行的逻辑
  console.log("收到 SIGCONT 信号，暂停中...")

  // 这里可以添加暂停前需要执行的代码，比如资源的释放、状态的保存
})

// 监听 'SIGCONT' 信号
process.on("SIGCONT", () => {
  console.log("收到 SIGCONT 信号，进程将继续执行。")
  // 在这里添加任何你希望在进程继续执行时进行的操作
})

rl.on("SIGINT", () => {
  console.log("收到 SIGINT 信号，程序退出前，执行清理...")
  // 这里可以放置清理资源的代码，比如关闭文件、数据库连接等
  // 清理完成后退出程序
  process.exit(0)
})

// 当用户试图通过 Ctrl+C 退出时，我们不会立即结束程序，而是询问用户是否确实希望退出。
// 如果用户回答"yes"，则程序结束；否则，程序不会结束，用户可以继续之前的操作。
// rl.on("SIGINT", () => {
//   rl.question("确定要退出吗？(yes/no) ", (answer) => {
//     if (answer.match(/^y(es)?$/i)) rl.close()
//     else console.log("继续操作...")
//   })
// })
```

## completer 函数

`completer` 函数作为 `createInterface({completer})` 构建函数的选项参数，用来定义用户按下 tab 键时补全内容的函数。当用户在命令行中输入并按下 Tab 键时，Node.js 会调用这个函数，一般用于根据当前的用户输入来提供建议列表。

这个函数可以有两种形式：

- 同步形式，直接返回一个二元组：[completions, line]。
  - completions 是一个字符串数组，包含所有可能的补全建议。
  - line 是当前输入的行，可以用它来决定如何补全。
- 异步形式，接受一个回调函数作为第二个参数。
  - 这个回调函数也需要传入二元组：[completions, line]

### 示例：根据用户输入来推荐命令

定义了一个 completerFunction，它会检查用户输入是否与预定义的命令数组commands 中的某个命令匹配。

比如说，用户输入的是"ad"然后按 Tab 键，completerFunction 将会返回 `["add"]`，因为"add"是以"ad"开头的唯一命令。随后，终端会自动填充剩余的部分，使得用户的输入变成"add"。

```js
import readline from "node:readline"
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: completerFunction,
})

function completerFunction(line) {
  const commands = ["add", "commit", "push"]
  const hits = commands.filter((c) => c.startsWith(line))
  // 如果有匹配项，则显示它们；否则，不显示任何东西。
  return [hits.length ? hits : [], line]
}

rl.question("Enter a git command: ", (answer) => {
  console.log(`Your command was: ${answer}`)
  rl.close()
})
```

## ReadlinePromise

从 Node.js v17.0.0 开始，readline 模块提供了基于 Promise 的 API，即 readline/promises。这意味着你现在可以使用异步函数（async function）和等待（await）来以更直观、更易于管理的方式处理输入输出操作，而不再需要依赖回调函数。

```js
import readline from "node:readline/promises"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function main() {
  // 使用 question 方法提示用户输入并等待用户的回答
  const name = await rl.question("What is your name? ")
  console.log(`Hello, ${name}!`)
  // 不要忘记关闭 readline.Interface 实例！
  rl.close()
}

main()
```

### Symbol.asyncIterator 异步迭代

`Symbol.asyncIterator` 是 JavaScript 的一个特殊值，它定义了对象的默认异步迭代器。如果一个对象实现了这个属性，那么它就可以被 `for-await-of` 循环异步迭代。简单来说，这允许你以异步的方式遍历（例如从网络请求或文件读取）返回数据的对象，使每次迭代都可以等待异步操作完成。

在 Node.js v21.7.1 版本中，readline.Interface 实例（通常通过调用 readline.createInterface() 创建）提供了一个 `[Symbol.asyncIterator]()` 方法。这意味着你可以在异步循环中逐行读取输入流，每次循环都会等待下一行变得可用。

示例：监听用户的连续输入多行数据

```js
import readline from "node:readline/promises"

async function processLineByLine() {
  // 使用 process.stdin 创建接口实例，这里 stdin 作为输入流
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log('请输入一些文本，按回车继续，输入 "exit" 退出：')

  for await (const line of rl) {
    // 这里使用 for-await-of 循环逐行读取
    if (line === "exit") {
      // 如果用户输入 exit，则退出循环
      rl.close() // 不要忘记关闭 readline 接口
    } else {
      console.log(`您输入了: ${line}`) // 处理用户的输入
    }
  }
}

processLineByLine()
```

所以，对于一些方法，readline 提供了 Promise 和 callback 两种形式。

- `rl.cursorTo(x[, y]) / rl.cursorTo(stream, x[, y][, callback])` 用于移动终端中光标的位置，x 表示移动的水平位置（列），从左边 0 开始计数；y 表示移动的垂直位置（行），从上方 0 开始计数。
- `rl.moveCursor(dx, dy) / rl.moveCursor(stream, dx, dy[, callback])` 相对光标当前位置进行移动，dx 是水平方向的移动：如果值为正，则光标向右移动；如果值为负，则向左移动。dy则是垂直方向的移动：正值意味着向下移动，负值意味着向上移动。
- `rl.clearLine(dir) / rl.clearLine(stream, dir[, callback])` 是一个重要的方法，用于清除当前文本行上的内容，dir 参数决定了清除方向
  - dir = -1：从光标位置到行的开头清除。
  - dir = 1：从光标位置到行的末尾清除。
  - dir = 0：清除整行，不论光标在哪里。
- `rl.clearScreenDown() / rl.clearScreenDown(stream[, callback])` 方法是一个用于清除从光标位置到屏幕底部的内容的功能。通常用于清空屏幕操作，类似 `console.clear()` 命令。

## 命令行光标的控制

首先，让我们明白什么是光标位置。假设你正在使用文本编辑器编写代码或文档，你在屏幕上看到的闪烁的小线（通常是竖线），指示你现在可以输入或删除字符的位置，那个就是光标。光标位置通常由两个坐标表示：一是行数（垂直位置），二是列数（水平位置）。

readline 模块提供了几个方法用来获取和设置当前命令行中光标的位置：

- `rl.cursor` 用于获取或设置当前光标在输入行中的位置，值是一个整数，表示光标在当前输入行中的位置。计数从 0 开始，也就是说，如果光标在行的开头，rl.cursor的值为 0。较少使用，通常使用 `getCursorPos()` 同时获取行和列的坐标。
- `rl.getCursorPos()` 用来获取当前光标在命令行界面中的位置，包括行和列的坐标。
- `rl.cursorTo(x[, y]) / rl.cursorTo(stream, x[, y][, callback])` 用于移动终端中光标的位置，x 表示移动的水平位置（列），从左边 0 开始计数；y 表示移动的垂直位置（行），从上方 0 开始计数。
- `rl.moveCursor(dx, dy) / rl.moveCursor(stream, dx, dy[, callback])` 相对光标当前位置进行移动，dx 是水平方向的移动：如果值为正，则光标向右移动；如果值为负，则向左移动。dy则是垂直方向的移动：正值意味着向下移动，负值意味着向上移动。
- `rl.clearLine(dir) / rl.clearLine(stream, dir[, callback])` 是一个重要的方法，用于清除当前文本行上的内容，dir 参数决定了清除方向
  - dir = -1：从光标位置到行的开头清除。
  - dir = 1：从光标位置到行的末尾清除。
  - dir = 0：清除整行，不论光标在哪里。
- `rl.clearScreenDown() / rl.clearScreenDown(stream[, callback])` 方法是一个用于清除从光标位置到屏幕底部的内容的功能。通常用于清空屏幕操作，类似 `console.clear()` 命令。

> TODO: 上述光标相关的属性, 在 powershell 上好像不起作用, 比如报 TypeError: rl.cursorTo is not a function

### 示例：进度条显示

```js
import readline from "node:readline/promises"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

/**
 * 定时输出进度条显示
 */
let percentage = 0

// 模拟文件下载进度
function updateProgress() {
  rl.clearLine(0) // 清除当前行
  rl.cursorTo(0) // 将光标移动到行首

  percentage += 10
  rl.write(`Loading... [${percentage}%]`) // 更新进度信息

  if (percentage >= 100) {
    clearInterval(interval)
    rl.close()
  }
}

const interval = setInterval(updateProgress, 1000)
```

## 等待输入超时，中断监听

`rl.question(query[, options])` 方法中的第二个选项参数，可以传入一个中断信息 AbortSignal，设定超时时间。当超时未输入时，将自动中断监听输入流。

```js
import readline from "node:readline/promises"

async function main() {
  // 使用 process.stdin 创建接口实例，这里 stdin 作为输入流
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
