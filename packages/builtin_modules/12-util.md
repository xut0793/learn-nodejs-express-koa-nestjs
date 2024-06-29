# Util

util模块提供了一系列实用函数，支持 Node.js 内部 API 的开发。同时，许多实用工具对应用程序开发者也很有用，所以通过 `node:util` 模块导入使用。

下面列出一个常用工具函数

## callbackify / promisify

Node.js 中的两种常用编程风格：基于 Promise 的异步编程和基于回调(callback)的异步编程。

- Promise 是现代 JavaScript 的一个特性，它提供了一种处理异步操作的新方式。一个 Promise 对象代表了一个可能现在、也可能将来才会完成的操作的结果。
- 回调（Callback） 则是更早期的处理异步操作的方法。你定义一个函数，然后作为参数传递给另一个函数。当那个异步操作完成时，这个传递的函数就会被调用。

- `util.promisify(callback)` 将遵循传统 Node.js callback 风格的函数（即接受一个(err, value) => ...回调作为最后一个参数的函数）转换成返回 promise 的函数。这在您想要使用async/await语法时非常有用。
- `util.callbackify(promise)` 把返回 Promise 的函数转换成遵循传统 Node.js 风格的回调风格的函数。

## 格式化输出

### format

- `util.format(format[, ...args])` 是一个用于字符串格式化、检查、调试等的实用工具函数，可以将多个参数按照第一个参数（即格式字符串）所指定的格式进行格式化。这在处理字符串输出、日志记录或者任何需要动态生成字符串的场景中非常有用。
- `util.formatWithOptions(inspectOptions, format[, ...args])` 允许你自定义格式化选项（inspectOptions），进而控制如何格式化给定的参数（`format[, ...args]`）。这在处理复杂对象或希望以特定方式展示信息时非常有用。

format 字符串支持几种特定的占位符：

- %s - 字符串
- %d - 数值（整数或浮点数）
- %i - 整数
- %f - 浮点数
- %j - JSON。如果对象含有循环引用，则会被替换成字符串 '[Circular]'
- %% - 百分号（'%'）。这不会消耗参数
- %o - 对象的简洁可视化（没有方法的对象）
- %O - 对象的完整可视化（包括对象的方法）
- %c - CSS 样式修饰符（仅在 Web 浏览器环境下的 console 对象有效，Node.js 中无效）。

如果传入的参数数量多于占位符的数量，多余的参数将直接拼接到结果字符串的末尾，各参数之间用空格隔开。

```js
import util from "node:util"

console.log(util.format("%s %d %j", "Score", 100, { name: "Alex" }))
// 输出: Score 100 {"name":"Alex"}

console.log(util.format("Hello", "World", 123, { foo: "bar" }))
// 多余的参数以空格分隔输出: Hello World 123 { foo: 'bar' }

let obj = { person: { name: "Bob", age: 30 }, hobby: "painting" }
// { depth: 1 }只展示到对象的第一层，colors属性添加颜色（在支持颜色的终端中）
let formattedString = util.formatWithOptions(
  { depth: 1, color: true },
  "Details: %o",
  obj
)
console.log(formattedString)
```

### inspect

- `util.inspect(object[, options]) / util.inspect(object[, showHidden[, depth[, colors]]])` 将对象转成字符串输出，可以通过 option 选项控制如何输出。
  - showHidden: 如果设置为 true，对象的不可枚举属性也会被包含在结果中。
  - depth: 指定格式化时递归多少层对象。设置为 null 表示无限层。
  - colors: 设置为 true 可以在控制台中输出彩色文本，增加可读性。如果在支持颜色的终端中运行这段代码，你会看到按照数据类型着色的输出。
  - customInspect: 当设置为 false 时，对象上的 inspect(depth, opts) 函数不会被调用。

```js
import util from "node:util"

let obj = { a: { b: { c: { d: {} } } } }

Object.defineProperty(obj, "age", {
  value: 30,
  enumerable: false,
})

console.log(util.inspect(person, { showHidden: true, depth: 2, color: true }))
// 输出：'{ age: 30, a: { b: { c: [Object] } } }'
```

默认情况下，util.inspect 会以不同的颜色高亮显示对象的不同部分，比如：在控制台中，数字可能显示为蓝色，字符串显示为红色等，这种彩色高亮可以帮助开发者更快地区分和识别数据类型和结构。
从 Node.js 版本 21.7.1 开始，你可以自定义这些颜色！这意味着你可以根据自己的偏好或需求，改变不同数据类型在控制台输出时的颜色。这是通过所谓的 ANSI 转义码来实现的，这些转义码是一系列的控制字符，用于在文本终端中控制颜色、光标位置等。

> ANSI 转义序列通常以`\x1b[`开头，后接具体的数字代码和字母m结束。比如，`\x1b[31m`会将文本颜色设置为红色。对于背景颜色，相应的代码会有所不同。

```js
import util from "node:util"

console.log(util.inspect.styles)
// 输出 inspect 的样式配置，可以看到默认的配置，比如：{ number: 'yellow', boolean: 'yellow', ... }

// 如果想要改变特定类型的颜色，可以直接修改
util.inspect.styles.number = "blue"
// 现在所有被 `inspect` 格式化的数字都将显示为蓝色

// 使用 inspect.colors 来查看或定义更多颜色
console.log(util.inspect.colors)
// 输出颜色和对应的控制台颜色代码

// 注意：这可能不是必需的，因为内置的颜色已经预设了ANSI颜色代码。
// util.inspect.colors.yellow = ['\x1b[33m', '\x1b[39m'];

let obj = {
  name: "Node.js",
  version: 21.7,
  features: ["JavaScript", "Event-driven", "Non-blocking I/O"],
}

console.log(util.inspect(obj, { colors: true }))
// 由于我们之前已经将数字颜色设置为黄色，所以对象 obj 中的 version 属性值“21.7”在控制台输出时将显示为黄色。

// 定义一个带有红色背景的错误消息
const errorMsg = util.inspect("ERROR: Something went wrong!", {
  colors: true,
  backgroundColor: "red",
})
console.log(errorMsg)
// 这会使'ERROR: Something went wrong!'这条信息在控制台中以红色背景展示出来。
```

### styleText

`util.styleText(format, text)` 是 Node.js v21.7.1 版本增加的一个工具函数。这个函数让你能够以一种简洁的方式给文本添加样式，然后输出到控制台或其他支持 ANSI 风格代码的地方。

- format：这是一个字符串，定义了你想应用于文本的样式。例如，颜色、背景色、加粗等。
- text：这是你想要添加样式的文本内容。

> 样式的应用取决于你的终端或控制台能够识别哪些 ANSI 风格代码。所以在不同的环境下，输出的效果可能有所不同。

```js
const util = require("util")

let errorMessage = util.styleText("color:red", "出错了！请检查您的输入。")
console.log(errorMessage) // 会以红色输出 “出错了！请检查您的输入。” 到控制台。

let successMessage = util.styleText("bold;bgColor:green", "操作成功！")
console.log(successMessage) // 输出加粗的文本“操作成功！”并且背景色为绿色。
```

### `util.stripVTControlCharacters(str)`

什么是 VT（Vertical Tab）控制字符。

VT 控制字符是一组控制字符，它们在文本字符串中用来控制文本的显示方式，比如颜色、背景、闪烁等等。这些控制字符通常是看不见的，它们被嵌入到文本字符串中用来告诉终端或显示设备以特定的方式展示文本。比如上面提到的控制终端输出颜色的 ANSI 转义序列的字符。

`util.stripVTControlCharacters(str)` Node.js v21.7.1 版本中新增加的一个非常实用的功能。这个方法的作用就是从一个包含有 VT 控制字符的字符串中移除所有的 VT 控制字符，返回一个清理后的字符串。

```js
const util = require("util")
const colorfulLog = "\x1b[32mSuccess:\x1b[0m Operation completed." // 这是一个含有绿色字体控制字符的字符串
const cleanedLog = util.stripVTControlCharacters(colorfulLog)
console.log(cleanedLog) // 输出将不包含VT控制字符，只有纯文本信息
```

## MIME type

在 Node.js v21.7.1 中，util.MIMEType 是一个相对较新的类，它用于解析和操作 MIME 类型。

MIME 类型，全称“多用途互联网邮件扩展”类型，是一种标准，用来表示文档、文件或字节流的性质和格式。在 Web 开发中，理解和使用 MIME 类型是非常重要的，因为它们帮助浏览器理解应该如何处理不同的数据。

`util.MIMEType` 类提供了一种方法来解析 MIME 类型字符串，并返回有用的信息，比如主类型（type）、子类型（subtype）以及参数（parameters）。有了这些信息，你就可以更精确地控制和理解数据的内容和预期的处理方式。

```js
const util = require("util");

// 创建一个MIMEType实例
let mimeType = new util.MIMEType("text/html; charset=UTF-8");

console.log(mimeType.type); // 输出: text
console.log(mimeType.subtype); // 输出: html
console.log(mimeType.essence ); // 输出: text/html
console.log(mimeType.parameters.get("charset")); // 输出: UTF-8

其中 `mimeType.parameters` 是一个 mimeParams 对象，可以对属性进行增删改查，类似于 URLSearchParams 对象。

```

实际例子

```js
const http = require("http")
const util = require("util")

http
  .createServer((req, res) => {
    let contentType = req.headers["content-type"]
    let mimeType = new util.MIMEType(contentType)

    // 假设我们只处理JSON
    if (mimeType.type === "application" && mimeType.subtype === "json") {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "处理JSON数据" }))
    } else {
      res.writeHead(400, { "Content-Type": "text/plain" })
      res.end("仅支持application/json类型")
    }
  })
  .listen(3000)
```

## TextEncoder / TextDecoder

### 编码 encoding

计算机底层只能识别二进制数据（0 和 1），因此需要一套规则将人类可读的文本转换为二进制数据，这个规则，就是我们所说的编码。

简单说，字符编码是一套人与计算机之间的翻译规则，就是字符（如文字和符号）与计算机存储（通常是数字）之间的转换规则。假设你写了一个字母A，在 ASCII 编码中，这个A会被翻译成数字65，计算机使用这个数字来代表A。

### TextDecoder

TextDecoder 的作用就是按照这些规则将二进制数据转换回人类可读的文本，即解码的过程。

```js
import { TextDecoder } from "util"

// 假设 data 是一个从网络获取的 Buffer 对象，包含 UTF-8 编码的文本数据
const data = Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f]) // 这个例子中的数据代表 "hello"

const decoder1 = new TextDecoder("utf-8") // 创建一个 'utf-8' 编码的 TextDecoder 实例
const text1 = decoder1.decode(data) // 将 UTF-8 编码的数据解码成字符串
console.log(text1) // 输出: hello

// 假设我们有一串UTF-8编码的二进制数据
const uint8Array = new Uint8Array([72, 101, 108, 108, 111])
const decoder2 = new TextDecoder() // 默认 'utf-8' 编码
// 使用decoder将其转换为字符串
const text2 = decoder2.decode(uint8Array)
console.log(text2) // 输出: Hello

// TextDecoder 不仅支持 UTF-8，还支持多种其他编码（如 utf-16le, iso-8859-2 等）。如果你得到了一份使用其他编码的数据，只需要在创建 TextDecoder 实例时指定正确的编码即可。
// 假设 data 是一个 Buffer 对象，包含 utf-16le 编码的文本数据
const data = Buffer.from([0xff, 0xfe, 0x61, 0x00, 0x62, 0x00, 0x63, 0x00]) // "abc" in utf-16le
const decoder3 = new TextDecoder("utf-16le")
const text3 = decoder3.decode(data)
console.log(text3) // 输出: abc
```

`new TextDecoder([encoding[, options]])` 的构造函数创建一个指定编码规则的解码器，可以接收两个参数：

- encoding：指定要使用的字符编码，默认是'utf-8'。还有其他编码类型，比如'iso-8859-2', 'gbk', 'utf-16'等。
- options：一个包含额外配置的对象。
  - fatal: 布尔值，它决定了当遇到无效的输入字节序列时，解码器（decoder）是否应该抛出错误。
    - 如果fatal设置为true，那么当解码器遇到无效的编码序列时，它会抛出一个错误。
    - 如果fatal设置为false（默认），解码器会尝试处理无效的序列，比如通过插入替代字符（通常是 �）来跳过这些无效序列。
  - ignoreBOM: BOM 表示字节顺序标记（Byte Order Mark），主要用于指明该文本流使用 Unicode 编码方式的字节顺序。在 UTF-8 编码中，BOM 是一个可选的序列 - EF BB BF，它出现在数据的最开始处。尽管在 UTF-8 中 BOM 不是必需的，但有时会使用它来标识数据确实是以 UTF-8 编码。
    - 如果 ignoreBOM 设置为 true，则 TextDecoder 在解码时会忽略掉文本中的 BOM，直接解码后面的内容。
    - 如果 ignoreBOM 设置为 false（默认值），则 TextDecoder 会自动处理 BOM，也就是说如果检测到 BOM 会将其移除，并解码之后的内容。

`textDecoder.decode([input[, options]])` 是用来将编码过的数据（一般是字节序列）转换回文本字符串。

- input: 这是要解码的数据。它可以是 Buffer、TypedArray、DataView 或其他类似的二进制数据类型。这是可选参数；如果不提供，则默认为空的 Uint8Array，解码结果是空字符串。
- options: 一个可选的配置对象，其中有一个 stream 属性。当 stream 设置为 true 时，decode 方法会将传入的数据视为流的一部分，并保持内部状态以待更多数据的到来进行解码。这对于处理大量数据或者数据分片到达的场景特别有用。

```js
const https = require("https")
const { TextDecoder } = require("util")
const decoder = new TextDecoder("utf-8")

https
  .get("https://api.example.com/data", (resp) => {
    let data = []

    // 接收数据块
    resp.on("data", (chunk) => {
      data.push(chunk)
    })

    // 数据接收结束
    resp.on("end", () => {
      // 将所有数据块合并为一个 Buffer，然后解码
      const text = decoder.decode(Buffer.concat(data))
      console.log(text)
    })
  })
  .on("error", (err) => {
    console.log("Error: " + err.message)
  })
```

### TextEncoder

TextEncoder 是一个用于将 JavaScript 字符串（即由 UTF-16 编码的文本）转换为 UTF-8 编码的二进制字节流数据 Uint8Array（无符号 8 位整数数组） 的方法。

- UTF-8 和 UTF-16 都是 Unicode 标准的编码方案，用于将字符编码为电脑可以理解的数字（即字节）。UTF-8 是一种变长的编码方式，每个字符可以占用 1 到 4 个字节，而 UTF-16 则是变长的，每个字符通常占用 2 个或者 4 个字节。
- JavaScript 字符串 在内部是使用 UTF-16 编码的。这意味着，当你在 JavaScript 中处理字符串时，每个字符被编码为一或两个 16 位的数值。

简单例子：

```js
import { TextEncoder } from "node:util"

// 创建一个TextEncoder实例，默认编码方式 uft8
const encoder = new TextEncoder()

// 将一段文本编码为UTF-8
const text = "Hello, world!"
const encodedData = encoder.encode(text)

// 现在 encodedData 是一个 Uint8Array(13) [72, 101, 108, 108, 111, 44,  32, 119, 111, 114, 108, 100,  33]
console.log(encodedData)
```

Node.js 的TextEncoder实现中，它默认只支持 UTF-8 编码方式。

UTF-8 编码是一种广泛使用的编码格式，它可以表示全世界几乎所有的字符，并且具有很好的兼容性和高效的存储特性。这使得 UTF-8 成为了互联网上的标准编码方式。

可以使用 `textEncoder.encoding` 属性查询当前编码器使用哪种字符编码方式。

例子2：当你需要通过 HTTP 请求发送数据时，将数据从字符串转换为二进制格式可以减少传输大小并增加传输效率。

```js
import { TextEncoder } from "node:util"
import http from "node:http"

const encoder = new TextEncoder()

console.log("textEncoder.encoding = ", textEncoder.encoding)

const data = encoder.encode("Hello, server!")

const options = {
  hostname: "example.com",
  port: 443,
  path: "/api/send",
  method: "POST",
  headers: {
    "Content-Type": "application/octet-stream",
    "Content-Length": data.length,
  },
}

const req = http.request(options, (res) => {
  // 处理响应...
})

req.write(data)
req.end()
```

### encodeInto

如果要将数据附加到一个已经存在的字段流数组中，可以使用 `textEncoder.encodeInto(src, dest)` 它的作用是将一个给定的字符串（src）编码成 UTF-8 字节序列，并将这些字节填充到另一个数组中（dest）。与 `encode()` 方法相比，`encodeInto()`更加高效，因为它直接在目标缓冲区内修改内容，避免了创建新的数组和相关的内存分配开销。

`textEncoder.encodeInto(src, dest)`

参数：

- src (源字符串): 你希望被转换成 UTF-8 编码字节序列的字符串。
- dest (目标): 一个Uint8Array或类似数组的缓冲区，用于存储编码后的字节序列。

返回值：返回一个对象，包含两个属性：

- written: 表示有多少个字节被写入到dest中。
- read: 表示有多少个源字符被转换了。

例子

```js
import { TextEncoder } from "node:util"

// 需要创建一个TextEncoder实例。
const encoder = new TextEncoder()

// 假设已经一个Uint8Array用作目标缓冲区。
const buffer = new Uint8Array(256) // 分配一个足够大的缓冲区

// 准备待编码的字符串
const str = "Hello, World!"

// 进行编码
const result = encoder.encodeInto(str, buffer)
console.log(`Written bytes: ${result.written}, Read characters: ${result.read}`)
// 输出可能是：Written bytes: 13, Read characters: 13

// 现在buffer中包含了字符串的 UTF-8 表示，你可以将这个缓冲区的内容发送到网络服务或进行其他处理。
```

### ICU（International Components for Unicode）

世界上有成千上万的字符，包括不同语言的文字、标点符号等，为了能够表示这些多样的字符，就需要更复杂的编码系统来支持，ICU（International Components for Unicode）是一个广泛使用的 Unicode 国际化支持库，提供了对世界上大多数语言文字的支持。在处理国际化应用时，ICU 提供了字符集的转换、日期、时间格式化、货币以及语言翻译等功能。

在 Node.js 版本中通过内置的 ICU 库，使其应用能轻松实现国际化，支持多种语言的文本处理。例如，它可以处理从简体中文到阿拉伯语、从俄语到日语的文本，而无需任何额外的插件或配置。
但有时候，出于性能考虑或者是因为特定的部署限制，开发者可能会选择禁用 ICU。当 ICU 被禁用时，Node.js 支持的字符编码数量会减少。

为了控制在 Node.js 中如何使用 ICU，在编译期间提供了四个构建选项。BUILDING.md 中记录了有关如何编译 Node.js 的其他详细信息。

- `--with-intl=none/--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu`
- `--with-intl=full-icu（默认`

至于不同选项，支持的字符规则编码，具体见 [Intl 章节]()

不管何种构建选项，即使选项禁用 icu 的选项 `--with-intl=none/--without-intl`， Node.js 仍然支持一些基本但非常重要的字符编码，足以应付大多数的开发需求。

- ASCII: 这是最基本的编码，只能表示英文字符和一些基本的控制符号。每个字符占用 1 字节空间。例如，A在 ASCII 中表示为 65。
- UTF-8: 这是目前广泛使用的一个编码，支持非常多的字符集，并且对英文字符兼容 ASCII。它使用 1 到 4 个字节表示一个字符，这样可以节省空间同时又能表示全世界范围内的字符。例如，英文字符A用 UTF-8 编码仍然是 65，但中文字符中可能用 3 个字节来表示。
- Binary: 二进制编码实际上并不转换内容，它直接将信息以原始二进制形式保存。这种方式不适合人类阅读，但对于计算机来说非常自然。
- Base64: 这是一种将二进制数据编码为 ASCII 字符串的方法。由于电子邮件等一些旧系统只支持 ASCII 字符，所以当需要在这些系统中传输图片或其他二进制文件时，就会用到 Base64 编码。例如，图像文件被转换为一长串看似无意义的英文字母和数字，从而可以通过电子邮件发送。

### WHATWG supported encodings

WHATWG（Web Hypertext Application Technology Working Group）是什么。WHATWG 是负责开发 HTML 和 DOM 标准的工作组。它们对 Web 技术的演进有巨大影响。

现代 Node.js 设计的 API 也是尽量 Web 标准，也包括编码规则遵循 WHATWG 编码标准，即 WHATWG supported encodings。 比如 `util.TextDecoder / util.textEncoder` 同样遵循 WHATWG TextDecoder / TextEncoder 接口标准，意味着它的使用方式与在浏览器环境中相似，这有利于编写跨平台代码。

## parseArgs

`util.parseArgs([config])` 用来解析命令行参数，使得在 Node.js 程序中处理命令行输入变得简单而直接。

在许多应用程序中，尤其是 CLI（命令行界面）工具中，需要根据用户在命令行中输入的参数来执行不同的操作。参数通常有两种形式：

- 选项（Options）：这些通常以一个或两个连字符开始（例如 -h 或 --help），后面可能会跟一个值。
- 位置参数（Positional arguments）：这些是不以连字符开始的参数，表示某些特定的数据值或文件路径等。

当使用 `util.parseArgs(config)` 函数时，你可以提供一个配置对象 (config) 来定义期望解析的选项及其行为。该函数返回一个对象，包含了分析后的命令行参数。

```js
// 引入 util 模块
const util = require("util")

// 定义命令行参数的配置
const optionsConfig = {
  args: process.argv.slice(2), // 默认值，可不写
  options: {
    overwrite: {
      type: "boolean",
      short: "o",
      description: "Overwrite existing files",
    },
    directory: {
      type: "string",
      short: "d",
      description: "Output directory",
    },
  },
}

// 解析命令行参数
const parsedArgs = util.parseArgs(optionsConfig)

console.log(parsedArgs.values) // 打印解析后的参数值
```

此时，使用下面的格式，在命令行执行这个脚本

```sh
node script.js -o --directory /path/to/directory someFile.txt
```

控制台将会打印出类似以下结构的对象，展示解析后的参数：

```js
{
  "overwrite": true,
  "directory": "/path/to/directory",
  "_": ["someFile.txt"] // _ 属性包含了所有未被识别为选项的位置参数，这里是 "someFile.txt" 文件名。
}
```

## parseEnv

util.parseEnv(content) 是 Node.js v21.7.1 版本新增的接口，让你能够方便地读取和使用存储在环境变量文件（通常是 .env 文件）中的设置，并将它们转换成 JavaScript 对象输出。

假设你有一个名为 .env 的环境变量文件，内容如下：

```sh
DB_HOST=localhost
DB_USER=root
DB_PASS=password123
```

使用 Node.js 的 fs 模块来读取这个文件，然后使用 util.parseEnv(content) 来解析它：

```js
const fs = require("fs")
const util = require("util")

// 读取.env文件的内容
const envContent = fs.readFileSync(".env", "utf-8")

// 使用util.parseEnv来解析环境变量
const envVars = util.parseEnv(envContent)

console.log(envVars)

// 输出
// {
//   DB_HOST: 'localhost',
//   DB_USER: 'root',
//   DB_PASS: 'password123'
// }
```

## transferableAbortSignal

基础概念:

- AbortController 和 AbortSignal: 在 JavaScript 中，AbortController提供了一种取消一个或多个 Web 请求的能力。当你创建了一个AbortController实例，你会通过它的signal属性获得一个AbortSignal。这个signal可以被传递给支持取消操作的 API（如fetch），然后你可以在任何时候调用AbortController的abort()方法来取消这些操作。
- Transferable 对象: 在 Web 平台，Transferable对象是那些可以从一个 context 传递到另一个 context 的对象，比如从主线程传递到 Web Worker。传输Transferable对象通常比复制这些对象更高效。
- 为什么要转移 AbortSignal: 在某些情况下，你可能需要在不同的环境或上下文之间取消正在进行的操作。例如，在主线程启动的操作，但是你希望能够在 Worker 线程中取消它。为此，你需要将 AbortSignal 作为 Transferable 对象来传递。

现在，我们来看 `util.transferableAbortSignal(signal)` 函数。这是 Node.js v21.7.1 中引入的一个功能，使得AbortSignal对象可以作为Transferable对象进行传输。简而言之，这允许你在不同的 worker 线程或者不同的 Node.js 环境中共享和传递AbortSignal，以便统一控制操作的取消。

假设有以下场景：在父子工作线程间取消任务:

- 你在主线程中创建了一个复杂的计算任务，但是这个任务是在一个 Worker 线程中执行的。
- 用户突然取消这个任务的需求。
- 你可以在主线程创建一个 AbortController 和对应的 AbortSignal，利用`util.transferableAbortSignal(signal)`将这个信号转换成可传输的形式，并发送到工作线程。
- 在工作线程中，你接收到这个信号并可以基于这个信号取消任务。

主线程代码

```js
const { Worker } = require("worker_threads")
const { transferableAbortSignal, AbortController } = require("util")

const abortController = new AbortController()
const signal = transferableAbortSignal(abortController.signal)

const worker = new Worker("./worker.js", { workerData: { signal } })

setTimeout(() => {
  // 假设用户请求取消任务
  abortController.abort()
}, 1000)
```

工作线程(worker.js)代码

```js
const { workerData } = require("worker_threads")

workerData.signal.addEventListener("abort", () => {
  console.log("任务被取消")
  // 清理工作，停止执行任务
})
```

## util.types

在 JavaScript 中，我们通常使用typeof或者instanceof来检测一个变量的类型。但是，这两种方法有时候并不能满足我们的需求。例如，typeof对于所有的对象都会返回"object"，这使得我们无法区分是一个普通的对象、一个数组还是一个正则表达式。同样地，instanceof也有它的局限性，尤其是在涉及到从不同的上下文（如不同的 iframe 或者 vm 模块创建的沙盒环境）中创建的对象时。

此时，util.types 模块就派上用场了。它提供了一系列的方法，能够帮助我们更精确地识别各种不同的 JavaScript 值的类型。旧版本中提供过一些简单的类型判断，比如 isArray / isNumber 之类的，随着 js 原生能力的提供，已经废弃。

- `isBoxedPrimitive(value)` 用于判断一个值是否为“boxed primitive”，即“包装后的原始类型”。
- `isNumberObject(value)` 用于判断传入的值是否为一个数值包装对象，即使用 `new Number(number)` 创建的数值包装对象。如果是，它返回true；如果不是，它返回false。
- `isStringObject(value)` 用于判断传入的值是否为一个字符串包装对象，即使用 `new String(string)` 创建的数值包装对象。如果是，它返回true；如果不是，它返回false。
- `isBooleanObject(value)` 用来区分给定的值是否为通过 new Boolean() 创建的对象形式的布尔值。比如 `new Boolean(true)` 或 `new Boolean(false)`。注意 Boolean 对象与布尔原始值（true 或 false）是不同的。
- `isSymbolObject(value)`检查传入的值是否是一个 Symbol 对象
- `isProxy(value)` 检查一个给定的值是否是一个 Proxy 对象
- `isRegExp(value)` 检查一个值是否为正则表达式对象。
- `isDate(value)` 检查一个给定的值是否为一个日期对象 (Date 对象)
- `isMap(value)` 判断给定的值是否是一个 Map 对象。
- `isSet(value)` 是一个用于判断给定的值是否为一个 Set 对象。
- `isWeakMap(value)` 判断给定的变量是否是一个 WeakMap 类型的对象。
- `isWeakSet(value)` 判断给定的变量是否是一个 WeakSet 类型的对象。
- `isArgumentsObject(value)` 方法就是用来检查一个值是否为这种特殊的arguments对象。如果是，则返回true；如果不是，返回false。
- `isNativeError(value)` 用于判断传入的值（value）是否是一个原生错误类型。所谓“原生错误”，就是指 JavaScript 自带的错误类型，例如 Error、TypeError、SyntaxError 等。
- `isPromise(value)` - 判断给定的值是否是一个 Promise 对象。
- `isAsyncFunction(value)` - 判断给定的值是否是一个异步函数（async function）。
- `isGeneratorFunction(value)` 是一个用来判断给定的值是否是一个生成器函数（Generator Function）的方法
- `isGeneratorObject(value)` 函数接收一个参数 value，然后判断这个值是否是一个生成器对象。如果是，它会返回 true；否则，返回 false。
- `isCryptoKey(value)` 检查给定的值是否为一个有效的加密密钥对象。如果是，它会返回true，否则返回false。
- `isKeyObject(value)` 检验给定的值是否是一个密钥对象（KeyObject）。
- `isArrayBuffer(value)` - 检查一个值是否为 ArrayBuffer 对象。
- `isAnyArrayBuffer(value)` 来检查一个值是否为任意类型的ArrayBuffer了
- `isTypedArray(value)` - 检查一个值是否为 TypedArray（如 Uint8Array, Float32Array 等）
- `isDataView(value)`
- `isArrayBufferView(value)` 这个函数，它的作用就是检查传入的 value 是否为一个 ArrayBuffer 视图，即它检查 value 是否是一个 Typed Array 或者 DataView 的实例。
- `isBigInt64Array()` 确认传入的不是一个 BigInt64Array 类型。
- `isBigUint64Array(value)` 确认一个变量是否为 BigUint64Array 类型
- `isInt8Array(value)`
- `isInt16Array(value)`
- `isInt32Array(value)`
- `isFloat32Array(value)` 检查给定的值是否是一个 Float32Array 实例。如果是，它返回 true；如果不是，它返回 false。
- `isFloat64Array(value)` 检查给定的值是否是一个 Float64Array 类型
- `isSharedArrayBuffer(value)` 判断一个值是否为一个“SharedArrayBuffer”
- `isModuleNamespaceObject(value)` 检查某个值是否是模块命名空间对象。

### 原始类型和包装对象

什么是原始类型（Primitive Types），以及什么叫做包装后（Boxed）。

- 原始类型（Primitive Types）指的是那些不是对象的基本类型：Number / String / Boolean / undefined / null / Symbol / BigInt
- 包装后的原始类型，`new Number() / new String() / new Boolean() / Object(Symbol()) / Object(BigInt())`

### 外部类型

什么是外部类型？

在 Node.js 中，"外部"类型指的是直接由 V8 引擎管理的内存之外的对象。这通常涉及到 Node.js 与 C++插件或其他底层资源的交互。简单来说，如果一个对象不是直接由 JavaScript 的数据类型（如：Number, String, Object 等）所代表，而是由 Node.js 底层通过 C++等语言实现的特殊对象，那么它就可能被认为是一个外部类型。

比如，Buffer 类用于操作二进制数据流，它实际上是一个外部类型，因为它的数据是在 Node.js 的 JavaScript 引擎之外的内存中分配的。

```js
const util = require("util")
const buffer = Buffer.from([1, 2, 3])
const obj = { name: "Node.js" }

console.log(util.types.isExternal(buffer)) // 输出：true
console.log(util.types.isExternal(obj)) // 输出：false
```

### 模块命名空间对象

在 Node.js 中，模块是指可以被其他程序通过require 或 import 语句引入的独立功能块。Node.js 有它自己的一套 CommonJS 模块系统，但随着时间的发展，ECMAScript 模块（即 ES Modules 或 ESM）成为了 JavaScript 官方的标准模块系统，并得到 Node.js 的支持。

ES Modules (ESM) 提供了一个静态的模块结构，在编译时就确定了模块间的依赖关系，而不是在运行时。这意味着，使用 ESM，导入和导出模块的语法更加统一和规范。在 ESM 中，可以使用import和export语句来导入和导出模块。

好，现在我们来到util.types.isModuleNamespaceObject(value)的主题上。这是 Node.js 提供的一个工具函数，用来判断给定的值是否是一个模块命名空间对象。那么，什么是模块命名空间对象呢？

在 ESM 中，当你使用import \* as name from 'someModule'这样的语法时，你实际上是将someModule模块中导出的所有内容作为一个对象引入，这个对象就是所谓的模块命名空间对象。这个对象包含了从模块中导出的所有绑定（变量、函数等）。因此，util.types.isModuleNamespaceObject(value)函数的作用是检查某个值是否正是这种类型的对象。

```js
// 假设有一个 ES Module 文件 namedExports.js，内容如下：
export const a = "Hello"
export function b() {
  return "World"
}

// 在另一个文件中尝试导入 namedExports.js 的所有导出
import * as myModule from "./namedExports.js"

// 使用 util.types.isModuleNamespaceObject() 验证 myModule 是否是有效的模块命名空间对象
import { types } from "util"

if (types.isModuleNamespaceObject(myModule)) {
  console.log("myModule 是模块命名空间对象")
} else {
  console.log("myModule 不是模块命名空间对象")
}
```
