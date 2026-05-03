# Path 路径

`node:path` 模块是一个用于处理文件和目录路径的实用工具集。这个模块提供了跨平台的统一的接口来处理不同操作系统的路径。使得操作路径变得简单而高效，可以在不同系统之间移植代码。

## windows / POSIX

Windows 是微软开发的操作系统。

POSIX（Portable Operating System Interface，可移植操作系统接口）是 IEEE 为了使 Unix 操作系统兼容其他操作系统所定义的一系列 API 标准。比如 Linux 和 macOS 等操作系统大多数遵循这种标准。所以通常说 POSIX 系统指的是类 Unix 系统，包括 Linux / macOs 系统。

Windows 和 POSIX 之间有一个主要的区别：路径分隔符。

在 Windows 系统中，路径通常使用反斜杠 `\` 作为分隔符，如 `C:\user\docs\Letter.txt`，而在 UNIX 或 Linux 系统中，路径则使用正斜杠 `/` 作为分隔符，如 `/user/docs/Letter.txt`。 path 模块帮助开发者抹平了这些差异。

Node.js 通过path模块提供了一系列工具，用于处理这种差异，确保代码可以跨平台运行。默认情况下，path模块的行为会根据你的操作系统自动调整。但是，你也可以显式地使用 `path.win32` 或 `path.posix` 去处理特定风格的路径，无论你的程序在哪种操作系统上运行。

假设你正在编写一个 Node.js 应用，需要生成一个指向用户目录下某个文件的路径。你希望应用能同时在 Windows 和 POSIX 兼容系统上运行。

```js
const path = require("path")

// 跨平台方式拼接路径
const filePath = path.join("/Users", "Username", "file.txt")

console.log(filePath)
```

如果你在 POSIX 兼容系统上运行以上代码，它将输出 `/Users/UsernameName/file.txt`。 如果在 Windows 上运行，输出将是 `\Users\Username\file.txt`。注意，即便代码使用了 POSIX 风格的输入（正斜杠），`path.join` 方法还是智能地根据运行环境生成了正确的路径。

显式处理 Windows 路径，有时候你可能需要处理特定格式的路径，不管你的代码是在哪个平台上运行的。例如，解析一个从 Windows 系统传过来的路径字符串。

```js
const path = require("path")

// 显式使用 Windows 风格的路径处理
const dirname = path.win32.dirname("C:\\Path\\To\\File.txt")

// 即使这段代码在 Linux 或 macOS 上运行，使用path.win32.dirname方法仍然能够正确解析 Windows 风格的路径。
console.log(dirname) // 输出: C:\Path\To
```

同样的，如果你需要处理一个明确是 POSIX 风格的路径，即使在 Windows 上运行，也可以这样做：

```js
const path = require("path")

// 显式使用 POSIX 风格的路径处理
const dirname = path.posix.dirname("/Path/To/File.txt")

console.log(dirname) // 输出: /Path/To
```

## API

```js
path.posix // 特定 posix 系统实现的方法，可以直接使用 path.posix.join，或者直接导入 node:path/posix
path.win32 // 特定 windows 系统实现的方法，可以直接使用 path.win32.join，或者是直接导入 node:path/win32
path.delimiter // 返回特定于平台的路径定界符： Windows 系统使用 ; POSIX 系统使用 :
path.sep // 返回特定于平台的路径片段分隔符： Windows 系统是 \ POSIX 系统是 /

path.basename(path[, suffix]) // 从一个完整的文件路径中获取文件的名称，提取出文件名部分。suffix 是一个可选参数，如果提供，那么返回的文件名会去除这个后缀名。
path.dirname(path) // 获取一个路径中的目录名，即文件名称的前面表示文件夹路径的一部分
path.extname(path) // 提取出文件的扩展名
path.isAbsolute(path) // 检查给定的路径是否是一个绝对路径
path.relative(from, to) // 获取从 from 路径到 to 路径的相对路径，如果两个路径相同，它会返回一个空字符串。
path.format(pathObject) // 将一个路径对象（pathObject）转换成一个路径字符串，{root, dir, base, name, ext}
path.parse(path) // 将一个路径字符串解析成路径对象，包含 {root, dir, base, name, ext}
path.normalize(path) // 将任何非标准化的路径字符串转换成一个标准化的路径字符串。比如解析掉多余的分隔符，处理相对路径的..等
path.join([...paths]) // 将多个路径片段合并成一个单一的路径。如果在路径之间缺少必要的分隔符，path.join()会自动添加这个分隔符。同样地，如果存在多余的分隔符，path.join()也会智能地去除它们。
path.resolve([...paths]) // 将多个路径片段合并成一个绝对路径，无论你提供的路径是相对的还是绝对的，path.resolve都会给出一个基于当前工作目录的绝对路径。
path.toNamespacedPath(path) // 仅针对 windows 系统，在一个普通路径上添加命名空间路径
```

示例：

```js
import path from "node:path"

/***********************************
 * basename 文件名
 **********************************/
let filePath = "/user/docs/Letter.txt"
console.log(path.basename(filePath)) // 输出：Letter.txt
console.log(path.basename(filePath, ".txt")) // 输出：Letter

/***********************************
 * dirname 目录
 **********************************/
let directory = path.dirname(filePath)
console.log(directory) // 输出：'/user/docs'

let onlyFilename = "file.txt"
console.log(path.dirname(onlyFilename)) // 只有文件名时，输出：'.' 点号代表当前工作目录

/***********************************
 * extname 扩展名称
 **********************************/
let extName = path.extname(filePath)
console.log(extName) // 输出：.txt

/***********************************
 * isAbsolute 检查给定的路径是否是一个绝对路径
 *
 * 绝对路径是从文件系统的根目录开始的完整路径。无论当前工作目录是什么，它始终指向同一个文件或目录。
 *    在 Windows 上，绝对路径可能看起来像C:\Users\Username\Documents\file.txt；
 *    在 Unix-like 系统（比如 Linux 或 MacOS）上，它可能看起来像/Users/Username/Documents/file.txt。
 * 相对路径基于当前工作目录的路径，通常以点号开头
 *  如果您的当前工作目录是/Users/Username/Documents，那么相对路径./file.txt 指的就是/Users/Username/Documents/file.txt。
 ***********************************/
// 绝对路径示例
console.log(path.isAbsolute("/home/user")) // Unix-like 系统: 输出 true
console.log(path.isAbsolute("C:\\path\\dir")) // Windows系统: 输出 true

// 相对路径示例
console.log(path.isAbsolute("./home/user")) // 输出 false
console.log(path.isAbsolute("home/user")) // 输出 false
console.log(path.isAbsolute("../user")) // 输出 false

/***********************************
 * path.relative(from, to)
 * 获取从 from 路径到 to 路径的相对路径，如果两个路径相同，它会返回一个空字符串。
 **********************************/
console.log(path.relative("/data/orandea/test/aaa", "/data/orandea/impl/bbb")) // 输出: '../../impl/bbb'

/***********************************
 * format 将一个路径对象（pathObject）转换成一个路径字符串。这个方法非常适合在你需要从各个部分构建一个完整文件路径的场景中使用。
 *
 * pathObject 包含以下属性：
 * root : 根路径，如 / 或 C:\
 * dir : 完整的目录路径，不包括文件名，例如 /home/user/dir
 * base : 完整的文件名，包括扩展名，例如 file.txt
 * name : 文件的名称，不包括扩展名，例如 file
 * ext : 文件的扩展名，包含点号，例如 .txt
 ***********************************/
let pathObject = {
  dir: "/user/docs",
  name: "Letter",
  ext: ".txt",
}
const pathStr = path.format(pathObject)
console.log(pathStr) // 输出： /user/docs/Letter.txt

/***********************************
 * parse(path) 将一个路径字符串解析成一个路径对象（pathObject）。
 *
 * pathObject 包含以下属性：
 * root : 根路径，例如 / 或 C:\
 * dir : 完整的目录路径，不包括文件名，例如 /home/user/dir
 * base : 完整的文件名，包括扩展名，例如 file.txt
 * name : 文件名，不包括扩展名，例如 file
 * ext : 文件的扩展名，包含点号，例如 .txt
 ***********************************/
const parsed = path.parse(filePath)
console.log(parsed)
// 输出
// {
//   root: '/',
//   dir: '/user/docs',
//   base: 'Letter.txt',
//   name: 'Letter',
//   ext: '.txt'
// }

/***********************************
 * path.normalize(path) 将任何非标准化的路径字符串转换成一个标准化的路径字符串。包括：
 * 1. 解析掉多余的分隔符：将连续的、重复的分隔符替换为单个分隔符。
 * 2. 处理特殊的相对路径标记：比如 . 表示当前目录，.. 表示上级目录。
 * 3. 保证路径的一致性：确保路径字符串符合当前操作系统的路径规范。
 **********************************/
let dirtyPath_1 = "/foo////bar//baz"
let normalizedPath_1 = path.normalize(dirtyPath_1)
console.log(normalizedPath_1) // 输出: '/foo/bar/baz'

let dirtyPath_2 = "/foo/bar/../../baz"
let normalizedPath_2 = path.normalize(dirtyPath_2)
console.log(normalizedPath_2) // 输出: '/baz'

let dirtyPath_3 = "C:\\foo\\..\\bar\\\\baz///qux\\..\\quux"
let normalizedPath_3 = path.normalize(dirtyPath_3)
console.log(normalizedPath_3) // 如果是在Windows平台，输出: 'C:\bar\baz\quux'

/***********************************
 * path.join([...paths])
 * 将多个路径片段合并成一个单一的路径，结果是相对路径还是绝对路径取决于输入的 paths。
 * 如果在路径之间缺少必要的分隔符，path.join()会自动添加这个分隔符。
 * 同样地，如果存在多余的分隔符，path.join()也会智能地去除它们。
 **********************************/
// 假设用户输入的文件夹和文件名
const folder = "用户/文档"
const fileName = "报告.txt"

// 这是一个不推荐的做法
const badPath = folder + "/" + fileName

// 使用path.join合并成完整的文件路径，可以避免跨系统路径分隔符不一致的问题
const fullPath = path.join(folder, fileName)

console.log(fullPath)
// 在Linux或macOS上，输出：用户/文档/报告.txt
// 在Windows上，输出：用户\文档\报告.txt

/***********************************
 * path.resolve([...paths])
 * 将多个路径片段合并成一个绝对路径，无论你提供的路径是相对的还是绝对的，path.resolve都会给出一个基于当前工作目录的绝对路径。
 *
 * 处理步骤：
 * 1. 开始于最右边的路径片段，看它是否足够构造出一个绝对路径。
 * 2. 如果不是，则将其与左边的一个路径片段合并。
 * 3. 重复此过程，直到构造出一个绝对路径或已处理所有路径片段。
 * 4. 如果到最后都没有构成绝对路径，则将当前工作目录加到最前面。
 **********************************/
// 假设当前工作目录是 /home/user/project
console.log(path.resolve("src", "app.js")) // 输出: '/home/user/project/src/app.js'
console.log(path.resolve("/foo", "bar")) // 输出: '/foo/bar'
console.log(path.resolve("src", "..", "tests")) // 输出: '/home/user/project/tests' 注意没有 src 目录了

/***********************************
 * path.toNamespacedPath(path) // 仅针对 windows 系统，在一个普通路径上添加命名空间路径
 *
 * Windows 系统支持一种特殊的命名空间路径格式，这种格式可以用来访问某些特殊的文件或设备，同时也能够处理长路径问题。这种特殊的路径格式以 \\?\ 开头，例如 \\?\C:\Users\Example。
 **********************************/
// 假设我们有一个普通的Windows路径
let normalPath = "C:\\Users\\Example"

// 使用path.toNamespacedPath()将其转换成命名空间路径
let namespacedPath = path.toNamespacedPath(normalPath)

console.log(namespacedPath) // 输出： '\\?\C:\Users\Example'
```
