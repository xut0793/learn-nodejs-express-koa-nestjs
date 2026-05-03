# tty 终端

"TTY" 是 "Teletypewriter" 的缩写，最初指的是那些能够发送和接收打印信息的装置，比如早期的电报传输设备。但随着计算机技术的发展，这个词逐渐被用来指代任何可以交互的文本输入和输出设备，在现代计算机术语中，TTY 通常指的是终端（Terminal）。终端是一个字符界面，可以让用户与计算机进行交互。简单来说，当你打开命令行或终端窗口时，你就是在使用一个 TTY 设备。

在 Node.js 中，tty 模块提供了检查当前程序运行的终端类型、配置终端行为等功能的接口。它主要涉及两个方面：TTY.ReadStream 和 TTY.WriteStream，分别代表读取流和写入流。

但是，在大多数情况下，都不需要直接创建 TTY.ReadStream 和 TTY.WriteStream 类的实例来进行调用，因为它是作为一个底层较为基础的依赖模块，用来实现上层应用功能模块。比如 process.stdin 就是一个 TTY.ReadStream 类的实例对象，用于监听用户键盘的输入。而 process.stdout 和 process.stderr 都是 TTY.WriteStream 的实例。这意味着你可以通过这些全局对象向终端输出信息。

原型链关系：

- process.stdin => TTY.ReadStream => net.Socket
- process.stdout / process.stderr => TTY.WriteStream => Stream.Writable

由于在大多数情况下，我们会通过process.stdin、process.stdout和process.stderr间接地使用 TTY 模块的功能，以下是一个简单示例，展示如何监听键盘输入并在终端输出信息：

```js
process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.on("data", (key) => {
  // 输出用户输入的字符的ASCII码
  process.stdout.write(key.toString().charCodeAt(0).toString())
  // 按下 'q' 键退出程序
  if (key.toString() === "q") {
    console.log("Goodbye!")
    process.exit()
  }
})
```

或者结合 readline 模块使用

```js
import readline from "node:readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question("What's your name? ", (name) => {
  rl.write(`Hi ${name}`)
  rl.close()
})
```

## `tty.isatty(fd)`

`tty.isatty(fd)` 是一个方法，用来检查给定的文件描述符 fd 是否连接到一个 TTY 设备。它返回布尔值：如果是，则返回 true；如果不是，或者查询失败，则返回 false。

其中 fd 是文件描述符的缩写。在 UNIX 和类 UNIX 系统中，每一个打开的文件都会被分配一个唯一的整数作为标识符，这个整数就是文件描述符。这不仅包括普通的数据文件，还包括设备、套接字（sockets）等。在 Node.js 中，标准输入（stdin）的文件描述符是 0，标准输出（stdout）是 1，错误输出（stderr）是 2。

根据程序是否连接到 TTY 来优化日志输出。如果你的程序输出到文件或其他非 TTY 设备，你可能不希望包含颜色代码或其他为 TTY 设计的特殊字符。

```js
const tty = require("tty")
if (tty.isatty(1)) {
  console.log("\x1b[36m%s\x1b[0m", "在命令行中，使用彩色输出") // 使用ANSI转义序列来设置颜色
} else {
  console.log("普通日志输出，不带颜色")
}
```

## isTTY

`readStream.isTTY / WriteStream.isTTY`，用来检测当前 readStream 是否连接到了一个 TTY 设备，值为 true 或者 false。比如程序通过终端运行，并且输入流（stdin）是一个终端（比如用户直接在命令行中输入数据），那么 process.stdin.isTTY 将会是 true。如果程序的输入被重定向了，比如通过管道（pipe）或者文件，那么这个值将会是 false。

比如 Console 的构造函数选项设置中，通过 isTTY 来判断当前输出是不是终端，来决定颜色输出。

```js
import { Console } from "console"
import fs from "node:fs"

// 创建一个可写流用于记录日志
const output = fs.createWriteStream("./stdout.log")
// 创建一个可写流用于记录错误
const errorOutput = fs.createWriteStream("./stderr.log")

// 使用自定义的 stdout 和 stderr 创建 Console 实例
const logger = new Console({
  stdout: output,
  stderr: errorOutput,
  // 有时候你可能不希望因为日志写入问题而影响到应用程序的正常运行，这时你可以设置ignoreErrors参数为true。
  // 这样的话，即便由于某些原因导致无法写入到stdout.log或stderr.log，程序也不会因此抛出异常，从而保证了应用程序的稳定性。
  ignoreErrors: true,
  // 内部会自动根据输出环境，判断是否将输出文本进行着色
  // 内部会进行类似 process.stdout.isTTY 判断，如果 true 表示当前为终端环境，按预期输出进行着色
  colorMode: true,
})

// 因为当前输出到文件，所以输出内容不会进行着色，正常文本输出到 stdout.log
// 如果是输出到控制台，即使用 process.stdout，\x1b[33m 和 \x1b[0m 是控制颜色的 ANSI 转义码，它们将包裹的文本变成黄色。
logger.log("\x1b[33m%s\x1b[0m", "这是一条普通的日志信息")

// 错误日志输出到 stderr.log
logger.error("这是一个错误信息！")
```

## TTY.ReadStream 和终端运行的模式

终端通常有两种模式运行：原始模式（raw mode）和熟悉模式（cooked 或 canonical mode）。

- 原始模式 (Raw Mode)：在原始模式下，输入数据（例如从键盘输入）会直接传送给程序，不经过任何处理。这意味着，比如按下键盘的 "a" 键，程序会立即接收到 "a"，而不会等到你按下回车键。这对于需要实时响应键盘输入的程序很有用，例如命令行游戏、实时终端交互工具等。
- 熟悉模式 (Cooked/Canonical Mode)：相反，在熟悉模式下，终端会对输入进行预处理，例如组装成一行，处理退格键等，然后才将处理后的数据发送给程序。这对于需要一次读取一行文本的命令行工具是非常便利的。

所以 TTY.ReadStream 提供了 `setRawMode(boolean)` 来设置终端要采用的模式，以及 `isRaw` 属性来获取当前处理哪种模式。

- `readStream.setRawMode(boolean)` 方法可以切换 TTY 输入流的模式，用来指定是否启用原始模式，如果为 true，那么 TTY 将进入原始模式。如果为 false，则返回到默认的行模式。
- `readStream.isRaw` 是一个属性，它告诉你当前的 readStream 是否处于原始模式。如果是，则返回 true；如果不是，即处于熟悉模式，则返回 false。

## TTY.WriteStream

类：tty.WriteStream 提供了终端输出光标控制的相关方法和事件

- `writeStream.clearLine(dir[, callback])` 清除当前光标所在行的内容。这对于更新或删除终端中的某行信息很有用。
- `writeStream.clearScreenDown([callback])` 从光标当前位置开始向下清除屏幕的内容。
- `writeStream.cursorTo(x[, y][, callback])` 将光标移动到指定位置。x: 水平方向（列）上的位置，从 0 开始计数。y: 可选参数，垂直方向（行）上的位置，也是从 0 开始计数。如果省略，则光标只在水平方向移动。callback: 可选参数，当光标移动完成后调用的回调函数。
- `writeStream.moveCursor(dx, dy[, callback])` 用于在 TTY (命令行终端) 上相对当前位置，移动光标到新位置。这里的 dx 和 dy 分别表示水平和垂直方向上的位移。如果 dx 是正数，光标向右移；如果是负数，光标向左移。同样，dy 是正数时光标向下移，负数时光标向上移。
- `writeStream.getColorDepth([env])` 用于判断当前终端（或称命令行界面）支持的颜色深度。颜色深度是指一种显示系统能够同时显示的颜色数量，它决定了在终端中可以显示多丰富或多精准的颜色。常见的返回值有：
  - 1 或者 'depth1'：黑白显示。
  - 4 或者 'depth4'：16 色显示。
  - 8 或者 'depth8'：256 色显示。
  - 24 或者 'depth24'：1677 万色（真彩色）。
- `writeStream.hasColors([count][, env])` 检查当前 writeStream （通常是终端）是否支持颜色，并且能够输出多少种颜色。
- `writeStream.getWindowSize()` 获取 TTY（终端）窗口的尺寸，返回一个包含两个元素的数组：[columns, rows]，其中columns代表窗口的宽度（列数），rows代表窗口的高度（行数）。
- `writeStream.rows` 表示终端的行数。可以用来判断终端的大小，从而适配输出格式。
- `writeStream.columns` 表示终端的列数。可以用来判断终端的大小，从而适配输出格式。
- 事件：'resize'：终端尺寸变化的事件，如果窗口大小更改了，你的应用程序可能需要相应地调整显示的数据量或布局，以确保信息仍然清晰可读。比如股票市场数据或者社交媒体通知。

```js
const { stdout } = process

function drawProgressBar(percent) {
  const columns = stdout.columns - 10 // 留出空间显示百分比
  const progressWidth = (percent / 100) * columns
  const progressBar = "=".repeat(progressWidth) + ">"
  const emptySpace = " ".repeat(columns - progressWidth)

  stdout.cursorTo(0) // 将光标移回行首
  stdout.write(`[${progressBar}${emptySpace}] ${percent}%`)
}

let percent = 0
const interval = setInterval(() => {
  percent += 5
  drawProgressBar(percent)
  if (percent >= 100) clearInterval(interval)
}, 100)
```
