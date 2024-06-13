# Console

Node.js 中的 console 模块提供了一个简单的调试输出，类似于 Web 浏览器为 JavaScript 提供的输出。它可以用来打印各种类型的输出，包括字符串、对象等，方便开发者进行调试。

在 Node.js 里使用 console 对象不需要特别引入模块，因为它是全局可用的。

## 常用的方法

console 有一些常用的方法来打印信息：

```
console.log([data][, ...args]): 打印普通日志信息。
console.info([data][, ...args]): 与 console.log() 类似，输出信息日志。
console.warn([data][, ...args]): 输出警告消息。
console.error([data][, ...args]): 输出错误消息。可以传递多个参数给它，这些参数可以是字符串、数字、对象或者任何其他类型的数据。Node.js 会将这些参数转换成字符串，然后将它们连同一个换行符一起输出到标准错误流中。
console.debug(): 输出低级别的日志信息，用于调试。在许多环境中默认情况下并不会显示输出。在浏览器中，你通常需要打开开发者工具，并且在控制台设置中启用“Verbose”级别的日志，这样 console.debug() 的输出才会显示。在 Node.js 中，你可能需要设置环境变量或者使用其他方式来查看这些调试信息。
console.trace(): 打印当前执行的代码堆栈跟踪。
console.assert()：执行断言。断言是一种检查代码中某个条件是否为真的方式；如果条件为假，则会打印出一条错误消息。
console.dir(obj[, options]): 打印对象或者数组信息到控制台的函数。它可以让你以一种更为直观和详细的方式查看一个对象的属性。 options 包含 {showHidden, depth, colors}
console.dirxml(data)：这个方法的作用是将传入的数据以类似 XML/HTML 元素结构的形式打印到控制台（如果可能的话）。
console.table(tabularData[, properties])：传入一个对象或数组时，它会将这些数据按照列和行的方式展示出来，每一列通常代表对象的属性，每一行表示一个数组元素或对象实例。
console.clear()：用于清除终端（或命令行界面）的输出内容。

# 成对使用
console.count([label]): 追踪代码中某个特定部分被执行了多少次。
console.countReset([label])：重置给定标签的计数器。
console.time([label])：开始测试时间
console.timeEnd([label])：停止定时器，并且输出从 console.time() 被调用到 console.timeEnd() 被调用的时间间隔（以毫秒为单位）。
console.group([label])：它允许你将一系列的控制台日志信息分组到一个缩进的层级里，增强日志的结构和清晰度，增强可读性。
console.groupEnd([label])：就表示当前的分组结束了，随后的控制台输出将不再缩进，并回到之前的层级。
console.groupCollapsed() 函数是用来在控制台（通常指的是命令行界面或开发者工具的控制台）输出信息时创建一个可折叠的分组。所有随后使用 console.log、console.warn、console.error 等函数输出的信息都会被归入到这个分组里，直到你调用 console.groupEnd() 来结束这个分组。使用 console.groupCollapsed() 而不是 console.group() 的区别在于，默认情况下，分组是折叠起来的，你需要点击它才能展开查看其中的内容。
```

示例：利用 clear 和 log 在控制台输出进度条

```js
let progress = 0

const intervalId = setInterval(() => {
  progress += 10
  // 清除控制台
  console.clear()

  if (progress >= 100) {
    console.log("完成!")
    clearInterval(intervalId) // 停止定时器
  } else {
    // 打印进度条
    console.log(
      `[ ${"#".repeat(progress / 10)}${" ".repeat(
        10 - progress / 10
      )} ] ${progress}%`
    )
  }
}, 1000)
```

## 构造函数 Console

nodejs 的 console 提供了一个构造函数 Console，可以从以下两个方式中引入

```js
import { Console } from "node:console"
// 或者
const Console = console.Console
```

在构造新实例的方法，有两种入参形式

```
new Console(stdout[, stderr][, ignoreErrors])
new Console(options)
```

options 参数详解：

- stdout：必需参数，它指定了标准输出流。这通常是 `process.stdout`，也就是 Node.js 程序的默认输出流。
- stderr：可选参数，它指定了标准错误流。如果未提供，默认使用 stdout 作为错误输出流。通常是 `process.stderr`。
- ignoreErrors：可选参数，它是一个布尔值，用于指定当写入控制台时是否忽略错误。如果设置为true，那么即使写入stdout或stderr失败也不会抛出异常。
- colorMode: 是否支持使用颜色（可选，默认看环境）
- inspectOptions: 定制 util.inspect() 方法的行为（该方法用于格式化输出对象）
  - showHidden: 如果设置为 true，将会输出对象中不可枚举的属性。
  - depth: 显示对象的深度

一般情况下，我们都是使用 console 提供的方法，将调试信息输出到终端上。但如果需要输出到其它地方，比如自定义日志，将日志信息输出到本也日志文件中。则可以使用构建函数 Console 创建自定义的日志器。

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

如果输出更复杂的对象，可以使用 inspectOptions 属性进行自定义输出。

```js
import { Console } from "console"

const logger = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
  inspectOptions: {
    // 如果设置为 true，将会输出对象中不可枚举的属性。
    showHidden: false,
    depth: null,
  },
})

const complexObject = { a: 1, b: { c: 2, d: { e: 3 } } }
logger.log(complexObject)
```

上述例子中，inspectOptions 的 depth: null 选项使得无论对象有多复杂，Console 都会完整地展开对象结构进行输出，而不是显示 `[Object]`。

## 字符占位符

可用的格式说明符如下：

- %s – 格式化为字符串。
- %i – 格式化为整数。
- %d - 格式化为整数输出，同 %i
- %f – 格式为浮点值。
- %o – 格式化为 JavaScript 对象。
- %O – 格式化为 DOM 元素。
- %c – 格式为 CSS 规则，应用于发出的日志行。这个用于在浏览器控制台终端上设置颜色，如果在 node 调试终端输出颜色需要使用 ANSI Escape code 编码字符包裹。

```js
console.log("There are %d options", value)
console.log("%cHello World", "color:red;font-size:24px;font-weight:bold;")
```

## 颜色输出 ANSI Escape code

> 引用 [Node.js在控制台彩色输出的方法及原理](https://juejin.cn/post/6844904006981173256)

ASCII 编码中有些字符是不能用来在终端中打印显示的，比如 `'\a' 0x7` 代表响铃，`'\n' 0x0A` 代表换行，这些字符被称为控制符。

而其中的一个控制符 `'\e'`比较特殊，这个字符代表 ESC ，即键盘上 ESC 按键的作用。ESC 是单词 escape 的缩写，即逃逸的意思。

如果在文本中出现这个控制符，表示接下来的字符是 **ANSI Escape code** 编码。而 ANSI Escape code 编码中有专门控制字符颜色的控制符。

例如：`\e[31;44;4;1m` 其意义如下：

- `\e` 代表开始 ANSI Escape code
- `[` 代表转义序列开始符 CSI，Control Sequence Introducer
- `31;44;4;1` 代表以; 分隔的文本样式控制符，其中 31 代表文本前景色为红色，44代表背景为蓝色，4代表下划线，1代表加粗
- `m` 代表结束控制符序列

因为 `e` 的16进制码为 `0x1B` 或 `0x1b`，大小定不敏感，8进制码为 `033` ，也可以用以下写法达到同样效果：

```sh
echo -e "\e[37;44;4;1mLEO\e[0m"
echo -e "\x1b[37;44;4;1mLEO\x1b[0m"
echo -e "\x1B[37;44;4;1mLEO\x1B[0m"
echo -e "\033[37;44;4;1mLEO\033[0m"
```

示例

```
\e[31m 红色
\e[36;5;1;4m 缓慢闪烁的青色加粗带下划线字体
```

通过维基百科，查到有以下参数控制符：

| 代码    | 作用                       | 备注                                                   |
| ------- | -------------------------- | ------------------------------------------------------ |
| 0       | 重置/正常                  | 关闭所有属性                                           |
| 1       | 粗体或增加强度             |                                                        |
| 2       | 弱化（降低强度）           | 未广泛支持                                             |
| 3       | 斜体                       | 未广泛支持。有时视为反相显示。                         |
| 4       | 下划线                     |
| 5       | 缓慢闪烁                   | 低于每分钟150次。                                      |
| 6       | 快速闪烁                   | MS-DOS ANSI.SYS；每分钟150以上；未广泛支持。           |
| 7       | 反显                       | 前景色与背景色交换。                                   |
| 8       | 隐藏                       | 未广泛支持。                                           |
| 9       | 划除                       | 字符清晰，但标记为删除。未广泛支持。                   |
| 10      | 主要（默认）字体           |
| 11–19   | 替代字体                   | 选择替代字体{\displaystyle n-10}{\displaystyle n-10}。 |
| 20      | 尖角体                     | 几乎无支持。                                           |
| 21      | 关闭粗体或双下划线         | 关闭粗体未广泛支持；双下划线几乎无支持。               |
| 22      | 正常颜色或强度             | 不强不弱。                                             |
| 23      | 非斜体、非尖角体           |
| 24      | 关闭下划线                 | 去掉单双下划线。                                       |
| 25      | 关闭闪烁                   |
| 27      | 关闭反显                   |
| 28      | 关闭隐藏                   |
| 29      | 关闭划除                   |
| 30–37   | 设置前景色                 | 参见下面的颜色表。                                     |
| 38      | 设置前景色                 | 下一个参数是5;n或2;r;g;b，见下。                       |
| 39      | 默认前景色                 | 由具体实现定义（按照标准）。                           |
| 40–47   | 设置背景色                 | 参见下面的颜色表。                                     |
| 48      | 设置背景色                 | 下一个参数是5;n或2;r;g;b，见下。                       |
| 49      | 默认背景色                 | 由具体实现定义（按照标准）。                           |
| 51      | Framed                     |
| 52      | Encircled                  |
| 53      | 上划线                     |
| 54      | Not framed or encircled    |
| 55      | 关闭上划线                 |
| 60      | 表意文字下划线或右边线     | 几乎无支持。                                           |
| 61      | 表意文字双下划线或双右边线 |
| 62      | 表意文字上划线或左边线     |
| 63      | 表意文字双上划线或双左边线 |
| 64      | 表意文字着重标志           |
| 65      | 表意文字属性关闭           | 重置60–64的所有效果。                                  |
| 90–97   | 设置明亮的前景色           | aixterm（非标准）。                                    |
| 100–107 | 设置明亮的背景色           | aixterm（非标准）。                                    |

具体的颜色编码为：

| 名称       | 前景色代码 | 背景色代码 |
| ---------- | ---------- | ---------- |
| 黑         | 30         | 40         |
| 红         | 31         | 41         |
| 绿         | 32         | 42         |
| 黄         | 33         | 43         |
| 蓝         | 34         | 44         |
| 品红       | 35         | 45         |
| 青         | 36         | 46         |
| 白         | 37         | 47         |
| 亮黑（灰） | 90         | 100        |
| 亮红       | 91         | 101        |
| 亮绿       | 92         | 102        |
| 亮黄       | 93         | 103        |
| 亮蓝       | 94         | 104        |
| 亮品红     | 95         | 105        |
| 亮青       | 96         | 106        |
| 亮白       | 97         | 107        |
