# 学习 Node

## 项目初始化

项目初始化，生成 package.json

```sh
pnpm init
```

## 注意事件

在node@v14.13.1以上版本，有几点注意：

- 要使用 ES module，需要在 package.json 中添加 `"type": "module"`
- import 语法导入内置模块，要添加路径描述符 `node:`，类似这样 `import http from 'node:http'`
- import 语法导入文件，必须要求添加后缀名 `import fn from 'utils.js'`

> 参考 [Node 内置模块导入路径修饰符](https://nodejs.cn/api/esm.html#node-%E5%AF%BC%E5%85%A5)

路径说明符是指用在 import 语句中 from 关键字后面的，比如 `import http from 'node:http'`语句中的 `node:`，也可以用于 export 语句中的 from 关键字后面，或者`import()`语句中。
node 中的路径说明符大致分为三类：

- 相对路径说明符：如`./`和`../`，通常用于相对当前文件路径，导入其它路径下的本地文件，强制要求带上文件后缀名，否则会被识别为导入第三方依赖包，而找不到报错。
- 绝对路径说明符：如 `file://`、`http://`、`https://`等。node 中导入网络路径的文件暂时实验性功能。
- 依赖包：直接以包名开始。因为依赖包分为 node 内置的模块和 node_module 安装的第三方依赖。所以区分为：
  - 内置模块包，统一以 `node:`说明符标识，如 `import http from 'node:http'`
  - 第三方依赖包，跟原来一样，以包名开头。如 `import { parse } from 'body-parser'`

另外 node 中在 ES Module 模式下，旧的 commonjs 模式中的 `__dirname`和`__filename`不能使用。可以使用 `import.meta.url`和`new URL`来替代原逻辑，它返回当前模块的绝对路径。

```js
// 旧的commonjs模式
const path = require("path")
const fs = require("fs")
const buffer = fs.readFileSync(path.resolve("./example.txt"))

// ES Module
// import.meta.url // 是当前文件的绝对路径
// new URL(input[, base]) 如果 input 是绝对的，则忽略 base。如果 input 是相对的，则需要 base。最终需要一个以网络协议开关的绝对网址。
import { readFileSync } from "node:fs"
const buffer = readFileSync(new URL("./example.txt", import.meta.url))

// 另一种是使用 process.cwd 生成文件路径
// process.cwd() 返回当前控制台执行 node 命令的路径，一般为项目根路径
const fileUrl = join(process.cwd(), "./src/example.txt")
```
