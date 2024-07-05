## Blob

Blob: Binary Large Object

> Node.js 引入的 Blob 类是对 Web Blob 的服务器端实现，意味着你现在可以在 Node.js 环境下也使用 Blob 对象，就像在浏览器环境下一样。

## What: Blob 是什么

看下它是怎么定义的：

> 《JavaScript权威指南》
>
> Blob 是对大数据块的不透明引用或者句柄。名字源于SQL数据库，表示“二进制大数据”（Binary Large Object）。
>
> 在 JavaScript 中 Blob 通常表示二进制数据，但是不一定是大量数据。Blob 是不透明的，我们可以对它执行的操作只有获取它的大小size，MIME类型 type和将他切割成更小的Blob的方法 slice。

> [MDN Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob) 对象表示一个不可变、原始数据的类文件对象。Blob 表示的不一定是JavaScript原生格式的数据。

看了还是一头雾水，不知道它是干什么的？下面说下我的理解。

前面我们详细学习了 [ArrayBuffer / TypedArray / DataView / TextEncoder / TextDecoder](./19-arraybuffer-typedarray-dataview-textencoder-textdecoder.md) 的知识，我们知道以下事实：

ArrayBuffer 用来表示一块存储了原始二进制数据的内存区域。这些二进制数据人类是不能直观理解的，需要使用 TypedArray / DataView 对象按特定规则（特定的字节数和字节序）读取识别为数值。

如果需要将二进制数据表示为字符，还需要通过 TextDecoder 按照指定的字符编码规则（utf8/uft16LE/base64等）将数值表示的码元翻译为对应的字符。

但到目前为止，js 也仅限于二进制和数值、字符串的互转，对于那些不能通过 JS 原生数据格式表示的东西，比如能存入计算机的图片、视频、音频等文件二进制数据，js 如何表示这些东西呢。

这就是 Blob 的作用。现在再来理解这句话：“Blob 是对大数据块的不透明引用或者句柄”，是不是更清晰了。

现在总结 Blob 是什么？它是 js 对内存中二进制数据表示为以 js 语言中对象类型的抽象。并且遵循了 ArrayBuffer / TypedArray / DataView / TextEncoder / TextDecoder 一贯的逻辑：分层。

- ArrayBuffer 仍然是表示为底层二进制数据，对这段二进制数据具体是什么，看你用什么工具来翻译了。
- TypedArray / DataView 可以将二进制数据解码为数值，或将数值编码为二进制。
- TextEncoder / TextDecoder 可以将二进制数据解码为字符，或者字符编码为二进制。
- Blob 可以将二进数据解码为文件对象，`blob.type` 属性表示文件类型。

```
+-------------------------------+
|             Blob              | new Blob(buffer,{type:'text/plain'})
+-------------------------------+
+-------------------------------+
|             䉁                | new TextDecoder('utf-16').decoder(buffer)
+-------------------------------+
+---------------+---------------+
|      A        |     B         | new TextDecoder('utf8').decoder(buffer)
+---------------+---------------+
+-------------------------------+
|            16965              | new Uint16Array(buffer)
+-------------------------------+
+---------------+---------------+
|      65       |     66        | new Uint8Array(buffer)
+---------------+---------------+
+---------------+---------------+
|0|1|0|0|0|0|0|1|0|1|0|0|0|0|1|0| buffer = new ArrayBuffer(2)
+---------------+---------------+
```

这样也就分清楚 Blob 和 ArrayBuffer 的区别了，因为两者的定义表述和行为都非常接近。

- ArrayBuffer 对象用来表示通用的原始二进制数据缓冲区。它是一个字节数组，不能直接操作其中的内容，需要通过上层的 TypedArray / DataView 来读写数据。但可以通过 slice 来裁剪二进制数据生成新的 ArrayBuffer 对象。
- Blob 对象表示一个不可变、原始二进制数据的类文件对象。 它表示的内容数据是固定的，不能被修改。只能通过实例的 arrayBuffer / stream / bytes / text 方法读取，或者使用特定的工具 FileReader 类读取。虽然原始内容不能被修改，但同样可以通过 slice 来裁剪二进制数据生成新的 Blob 对象，但裁剪后所表示的文件数据可能被损坏，读取内容后可能会显示出错。

## Why: Blob 有什么用

Blob 作用之一，就是上述阐述的，用 js 对象的格式来表示那些 js 原生字面量格式不能表示的文件二进制数据。当然也可以表示原始数据格式能表示的二进制数据格式，比如将一段字符串的二进制数据表示为一个文本格式的 Blob 对象。

Blob 另一个作用，就是在 js 中实现了二进制数据的传输。比如 Blob 通过 XMLHttpRequest / Fetch 用在网络通信中传递二进制文件数据。还有 Blob 用在 postMessage 跨进程通信中传递二进制数据。

作用二是 ArrayBuffer / TypedArray / DataView 对象实现不了的，它们的数据要进行传递必须先转为 Blob 对象。从这层意义上讲，Blob 的范畴比 TypedArray / DataView 大。因为就从作用一来看，Blob 同 TypedArray / DataView 一样是作为读取 ArrayBuffer 二进制数据的上层抽象对象。

最后一点是 Blob 对象在进程间传输的优势，比如通过 MessagePort 将 Blob 在多个 MessageChannel 消息通道上传输时，不会对 Blob 对象底层的二进制数据进行复制，只传输其内存地址的引用，性能更高效。Blob 只有在调用 `blob.arrayBuffer() / blob.text()` 方法时，才会复制 Blob 包含的数据。

这点同 ArrayBuffer 对象操作的高效性是一致的，js 原生数组对象 `array[index]` 查找元素内部是通过 hash 算法，而类似 `uint8Array[index] / buffer[index]` 的访问是直接通过内存地址和偏移量确定的，速度更快。

## API

- `new Blob([sources[, options]])`
  - sources `<string[]> | <ArrayBuffer[]> | <TypedArray[]> | <DataView[]> | <Blob[]>` 将存储在 Blob 中的字符串数组、`<ArrayBuffer>、<TypedArray>、<DataView>` 或 `<Blob>` 对象、或此类对象的任何组合。
  - options 选项对象
    - type `<string>` Blob 内容类型。type 的目的是传达数据的 MIME 媒体类型，但是不执行类型格式的验证。
    - endings `<string>` 'transparent' 或 'native' 之一。设置为 'native' 时，字符串源部分中的行结束将转换为 `require('node:os').EOL` 指定的平台原生行结束。比如 Windows 平台的行结束符 `\r\n`。设置为 "transparent"，代表会保持blob中保存的结束符不变。
- 属性
  - blob.type 内容类型，合法的 MIME 媒体类型
  - blob.size 字节大小
- 方法
  - `blob.slice([start[, end[, type]]])` 创建并返回 start 到 end 字节范围的子集 Blob 副本，原来 Blob 内容没有改动。
  - `blob.arrayBuffer()` 返回一个 Promise 对象，兑现一个原始二进制数据的 ArrayBuffer 对象。
  - `blob.types()` 返回一个 Promise 对象，兑现一个原始二进制数据的 Uint8Array 对象，目前仅 Firefox 在 128 版本以上支持，Chrome / Edge 等都还不支持。
  - `blob.text()` 返回一个 Promise 对象，兑现一个按 UTF-8 格式解码的字符文本
  - `blob.stream()` 返回一个读取 blob 内容的 ReadableStream 流实例，可以充分利用 Stream 的 API 操作二进制数据

基本使用

```js
const string = "Hello World"

const blob = new Blob([string], { type: "text/plain" })
console.log("🚀 ~ blob:", blob)
// Blob { size: 11, type: 'text/plain' }

const partBlob = blob.slice(0, 5, "text/plain")
console.log("🚀 ~ partBlob:", partBlob)
// Blob { size: 5, type: 'text/plain' }

blob.arrayBuffer().then((buffer) => {
  console.log("🚀 ~ blob.arrayBuffer ~ buffer:", buffer)
  //  ArrayBuffer {[Uint8Contents]: <48 65 6c 6c 6f 20 57 6f 72 6c 64>, byteLength: 11 }

  const uint8 = new Uint8Array(buffer)
  console.log("🚀 ~ blob.arrayBuffer ~ uint8:", uint8)
  // Uint8Array(11) [72, 101, 108, 108, 111,  32,  87, 111, 114, 108, 100]

  const decoder = new TextDecoder()
  const str = decoder.decode(buffer)
  console.log("🚀 ~ blob.arrayBuffer ~ str:", str)
  // Hello World 不会受到 blo.slice 的影响
})

partBlob.text().then((str) => {
  console.log("🚀 ~ partBlob.text ~ str:", str) // Hello
})
```

示例：nodejs 读取图片文件，流式返回给浏览器，浏览器接收后，创建 Blob URL 显示。

服务端代码

```js
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { createReadStream } from "node:fs"
import { on } from "node:events"
import { join, dirname } from "node:path"

const __dirname = dirname(import.meta.filename)
const imagePath = join(__dirname, "./floppy_disk.png")
const indexPath = join(__dirname, "./blob-web.html")
const mimeType = "image/png"

const server = createServer()
async function handle() {
  for await (const [req, res] of on(server, "request")) {
    const url = req.url
    switch (url) {
      case "/":
        const indexStream = createReadStream(indexPath)
        res.writeHead(200, { "Content-Type": "text/html;charset='UTF-8'" })
        indexStream.pipe(res)
        break
      case "/download":
        // 常规上，在 Nodejs 操作文件，使用 fs 模块更高效和简单，这里仅作 Blob 示例演示。
        // const imageStream = createReadStream(imagePath)
        // res.writeHead(200, { "Content-Type": mimeType })
        // imageStream.pipe(res)

        const imageBuffer = await readFile(imagePath)
        const imageBlob = new Blob([imageBuffer], { type: mimeType })
        res.writeHead(200, {
          "Content-Type": mimeType,
          "Content-Length": imageBlob.size,
        })

        // Fix: 管道操作报错？？ imageBlob 属于 Web 标准的 ReadableStream 与  res 属性 Nodejs 标准 WritableStream 不能兼容？？
        // imageBlob.pipeTo(res)

        const arrayBuffer = await imageBlob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        res.end(buffer)
        break
      default:
        res.end()
        break
    }
  }
}

handle()
server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/")
})
```

客户端代码

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <title>Blob 请求示例</title>
  </head>
  <body>
    <button id="btn">请求图片</button>
    <div id="image-box"></div>
  </body>
  <script>
    const btn = document.querySelector("#btn")
    const imageBox = document.querySelector("#image-box")
    const url = "http://localhost:3000/download"

    btn.addEventListener("click", async () => {
      try {
        const res = await fetch(url)

        if (res.ok) {
          const blob = await res.blob()
          const imageUrl = URL.createObjectURL(blob)

          const img = new Image(400) // width=400px
          img.addEventListener("load", () => {
            // 释放对象 URL 的引用
            URL.revokeObjectURL(imageUrl)
          })
          img.src = imageUrl
          imageBox.appendChild(img)
        } else {
          imageBox.textContent = `Response status: ${res.status}`
        }
      } catch (error) {
        imageBox.textContent = `Request error: ${error.message}`
      }
    })
  </script>
</html>
```

## File

Blob 虽然可以用来表示任何二进制格式的文件，并使数据方便在进程中传输。仅是简单的一段字符串转为二进制存储后，也可以生成文本格式 Blob 对象。

但是对于在 js 中可获取的具体文件的二进制数据，它还是缺少很多信息来表述这个文件，首先就是没有文件名称、路径等、修改时间等。所以在 Blob 的基础之上，又抽象了一层用来表述具体文件二进制数据的 File 类。

File 是 Blob 的一个子类，它继承了 Blob 的所有功能（属性和方法），并在此基础上添加了文件相关的元信息，如文件名 name、修改时间 lastModified、 相对路径 webkitRelativePath (非标准属性，未来可能变更) 等。用于文件数据在上传、下载等场景中显示相关元信息。

File 对象的实例通常由浏览器内部自动生成。现代浏览器，文件对象的来源有以下几类：

- 文件选择框 `<input type=“file” />` 选择文件，事件对象中 `event.files`
- 拖放操作返回的 DataTransfer 对象中的文件数据 `event.dataTransfer.files`。
- 私有文件系统 `FileSystemHandle.getFile()` 返回值 file

### API

- 属性，size 和 type 继承自 Blob
  - type
  - size
  - name
  - lastModified
- 操作方法继承自 Blob
  - `file.slice([start[, end[, type]]])` 创建并返回 start 到 end 字节范围的子集 Blob 副本，原来 Blob 内容没有改动。
  - `file.arrayBuffer()` 返回一个 Promise 对象，兑现一个原始二进制数据的 ArrayBuffer 对象。
  - `file.text()` 返回一个 Promise 对象，兑现一个按 UTF-8 格式解码的字符文本
  - `file.stream()` 返回一个读取 blob 内容的 ReadableStream 流实例，可以充分利用 Stream 的 API 操作二进制数据

> 在 Nodejs 中操作具体文件数据，通常会使用 fs 模块实现，将文件的二进制数据读取为 Buffer 对象。

示例1：从文件输入框选择文件

```js
const fileInput = document.querySelector("input[type=file]")
const output = document.querySelector(".output")

fileInput.addEventListener("change", async () => {
  const [file] = fileInput.files
  if (file) {
    try {
      const buffer = await file.arrayBuffer()
      const blob = new Blob(buffer, { type: file.type })
      // 也可以直接 URL.createObjectURL(file)
      const imageUrl = URL.createObjectURL(blob)
      const img = new Image(400) // width=400px
      img.addEventListener("load", () => {
        // 释放对象 URL 的引用
        URL.revokeObjectURL(imageUrl)
      })
      img.src = imageUrl
      imageBox.appendChild(img)
    } catch (error) {
      imageBox.textContent = `image read error: ${error.message}`
    }
  }
})
```

示例2：从拖放操作中获取文件

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <title>Drag File</title>
    <style>
      #dragTarget {
        border: solid black 2px;
        width: 200px;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #dragTarget.active {
        border: solid red 4px;
      }
    </style>
  </head>
  <body>
    <div>
      <div id="dragTarget">将文件拖放到此处</div>
    </div>
  </body>
  <script>
    //禁用浏览器默认打开事件
    document.addEventListener(
      "drop",
      function (e) {
        e.preventDefault()
      },
      false
    )
    document.addEventListener(
      "dragover",
      function (e) {
        e.preventDefault()
      },
      false
    )
    let dragTarget = document.getElementById("dragTarget")
    dragTarget.ondragenter = function (e) {
      let types = e.dataTransfer.types
      //判断是否是文件类型
      if (
        !types ||
        (types.contains && types.contains("Files")) ||
        (types.indexOf && types.indexOf("Files") != -1)
      ) {
        //触发高亮
        dragTarget.classList.add("active")
        dragTarget.textContent = "松手显示图片"
        return false
      }
    }
    dragTarget.ondragleave = function () {
      dragTarget.classList.remove("active")
      dragTarget.textContent = "将文件拖放到此处"
    }
    dragTarget.ondragover = function () {
      return false
    }
    dragTarget.ondrop = function (e) {
      let files = e.dataTransfer.files
      //遍历插入图片
      Array.prototype.forEach.call(files, (file) => {
        let type = file.type
        //判断是否是图片类型
        if (type.indexOf("image/") != -1) {
          let img = document.createElement("img")
          img.onload = function () {
            this.width = 100
            this.height = 100
            document.body.append(this)
            // 释放 Blob URL 引用
            URL.revokeObjectURL(file)
          }
          img.src = URL.createObjectURL(file)
        }
      })
      //完成操作，移除高亮样式
      dragTarget.classList.remove("active")
      dragTarget.textContent = "将文件拖放到此处"
      return false
    }
  </script>
</html>
```

示例3：从私有文件系统中获取文件句柄

```js
const btn = document.querySelector("#btn")
const output = document.querySelector("#output")

btn.addEventListener("click", async () => {
  const file = await getTheFile()
  console.log("🚀 ~ btn.addEventListener ~ file:", file)
  if (file) {
    try {
      const imageUrl = URL.createObjectURL(file)
      const img = new Image(400) // width=400px
      img.addEventListener("load", () => {
        // 释放对象 URL 的引用
        URL.revokeObjectURL(imageUrl)
      })
      img.src = imageUrl
      output.appendChild(img)
    } catch (error) {
      output.textContent = `image read error: ${error.message}`
    }
  }
})

// [File System API](https://developer.mozilla.org/zh-CN/docs/Web/API/File_System_API)
async function getTheFile() {
  const pickerOpts = {
    types: [
      {
        description: "Images",
        accept: {
          "image/*": [".png", ".gif", ".jpeg", ".jpg"],
        },
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
  }

  // 打开文件选择器
  const [fileHandle] = await window.showOpenFilePicker(pickerOpts)
  // 获取文件内容
  const fileData = await fileHandle.getFile()
  return fileData
}
```

## FileReader

随着 ES6 的 Promise API 的实现，很多 Web API 也提供了基于 Promise 对象实现的方法，Blob 就是其中之一，然后 File 继承于 Blob 类，自然也可以调用此类方法，来读取 File 对象的数据。

- `file.arrayBuffer()` 返回一个 Promise 对象，兑现一个原始二进制数据的 ArrayBuffer 对象。
- `file.text()` 返回一个 Promise 对象，兑现一个按 UTF-8 格式解码的字符文本

但是，在 ES6 的 Promise API 实现之前，浏览器异步事件的处理都是基于事件监听的方式，所以 FileReader 类就是一个基于事件监听的方式来读取 File 文件数据的实现。在现代编码中更推荐使用上述基于 Promise 的实现的 File 方法。对于 FileReader 仅作了解即可。

FileReader 类继承自 EventTarget 类，所以有一系列事件可用于监听。

- 属性
  - result 文件的内容。该属性仅在读取操作完成后才有效，数据的格式取决于使用哪个方法来启动读取操作。
  - readyState 表示FileReader状态的数字。EMPTY(0) 还没有加载数据、LOADING(1) 正在加载数据、DONE(2)完成数据读取，可从 result 获取结果。
  - error 读取文件时发生的错误对象 DOMException
- 方法
  - `abort()` 中止读取操作。在返回时，readyState 属性置为 DONE。
  - `readAsArrayBuffer()`，作用同 `file.arrayBuffer()`，开始读取指定的 Blob 中的内容，一旦完成，result 属性中将包含一个表示文件数据的 ArrayBuffer 对象。
  - `readAsBinaryString()` 已弃用，由 readAsArrayBuffer 代替
  - `readAsDataURL()` 开始读取指定的 Blob 中的内容。一旦完成，result 属性中将包含一个表示文件数据的 data: URL。
  - `readAsText()`，开始读取指定的 Blob 中的内容。一旦完成，result 属性中将包含一个表示所读取的文件内容的字符串。可以指定可选的编码名称。作用同 `file.text()`，但它默认是 utf8 编码且不能指定，需要读出后自动转换。
- 事件
  - load 读取成功完成时触发。
  - loadend 读取完成时触发，无论成功与否。
  - loadstart 读取开始时触发。
  - progress 读取数据时定期触发。
  - abort 当读取被中止时触发，例如因为程序调用了 FileReader.abort() 方法。
  - error 当读取由于错误而失败时触发。

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <title>FileReader</title>
  </head>
  <body>
    <div class="example">
      <div class="file-select">
        <label for="image">选择图片：</label>
        <input
          type="file"
          id="image"
          name="image"
          accept="image/png, image/jpeg"
        />
      </div>

      <div class="event-log">
        <label for="eventLog">事件日志：</label>
        <textarea readonly class="event-log-contents" id="eventLog"></textarea>
      </div>

      <div class="img-preview"></div>
    </div>
  </body>
  <script>
    const fileInput = document.querySelector('input[type="file"]')
    const preview = document.querySelector(".img-preview")
    const eventLog = document.querySelector(".event-log-contents")

    const reader = new FileReader()

    function handleEvent(event) {
      eventLog.textContent += `${event.type}：总共 ${event.total} 字节，已传输了 ${event.loaded} 字节\n`

      if (event.type === "load") {
        const img = new Image(400) // width=400px
        img.src = reader.result
        preview.appendChild(img)
      }
    }

    function addReaderListeners(reader) {
      reader.addEventListener("loadstart", handleEvent)
      reader.addEventListener("load", handleEvent)
      reader.addEventListener("loadend", handleEvent)
      reader.addEventListener("progress", handleEvent)
      reader.addEventListener("error", handleEvent)
      reader.addEventListener("abort", handleEvent)
    }

    function handleSelected(e) {
      eventLog.textContent = ""
      const selectedFile = fileInput.files[0]
      if (selectedFile) {
        addReaderListeners(reader)
        reader.readAsDataURL(selectedFile)
      }
    }

    fileInput.addEventListener("change", handleSelected)
  </script>
</html>
```

## URL schema / Blob URL / DataURL 区别

### URL scheme

URL scheme 是统一资源标识符（URI）的组成部分，用于指定访问资源所使用的协议类型。它是URI的第一部分，位于冒号之前。例如，在URL `http://www.example.com` 中，http 就是 URL scheme。

URL scheme定义了如何访问、检索、操作或表现资源。常见的URL scheme包括http、https、ftp、mailto等。

### Blob URL / Object URL

Blob URL，也称为 Object URL 是一种伪协议，是浏览器内部生成的一种特殊URL，让支持 url 协议的元素，如果 img link 等引用 Blob 或 File 对象的数据源。

在浏览器中，我们使用 `URL.createObjectURL(blob)` 方法来创建 Blob URL，该方法接收一个 Blob 对象，并为其创建一个唯一的 URL，其形式为 `blob:<origin>/<uuid>`，示例如下：`blob:https://example.org/40a5fb5a-d56d-4a33-b4e2-0acf6a8e5f641`

浏览器内部为每个通过 URL.createObjectURL 生成的 URL 存储了一个 URL → Blob 映射。因此，此类 URL 相比 Data URL 长度较短，但存在周期受限，只能在浏览器的单个实例中和同一个会话中有效。

上述的 Blob URL 看似很不错，但实际上它也有副作用。虽然存储了 URL → Blob 的映射，但 Blob 本身仍驻留在内存中，浏览器无法释放它。只有当所在的文档卸载时自动清除，Blob 对象才被释放内存。

但是，如果应用程序寿命很长，释放不会很快发生。因此，如果我们创建一个 Blob URL，即使不再需要该 Blob，它也会存在内存中。
为避免这种情况，我们应该主动调用 `URL.revokeObjectURL(url)` 方法，从内部映射中删除引用，从而主动释放 Blob 引用（如果没有其他引用，浏览器会自动删除），并释放内存。

> [Chrome 浏览器内部协议 `Chrome://` 收集](https://www.cnblogs.com/yingjie13/p/11313376.html)
>
> chrome://blob-internals 查看二进制大型物件(BLOB)储存的入口

> [Blob 二进制数据存储在哪里？](https://stackoverflow.com/questions/38239361/where-is-blob-binary-data-stored)
>
> [Blob 数据驻留在何处？](https://stackoverflow.com/questions/17820303/where-does-blob-data-reside)
>
> [Blob 会持续多长时间？](https://stackoverflow.com/questions/13966186/how-long-does-a-blob-persist)

### Data URL

Data URL 是一种特殊的 URL，它以 `data:` 协议开头，后面跟着媒体类型（MIME type）和数据的编码（通常是Base64）。Data URL 允许内容创建者将较小的文件直接嵌入到文档中，而无需进行外部资源请求。

Data URL由四部分组成：data:前缀、MIME类型（表明数据类型）、base64标志位（如果是Base64编码，则为;base64，否则可选）以及数据本身，格式如 `data:[<mimetype>][;base64],<data>`。

Data URL常用于网页文档中嵌入小图片、CSS 样式或 JavaScript 代码等，减少资源请求。但 Base64 编码算法实际上是把原数据的3个字节映射成了4个字节，所以相比于原数据长度，编码后的长度会增加1/3。这也会降低传输效率。比如如果图片较大，图片的色彩层次比较丰富，则不适合使用这种方式，因为该图片经过 base64 编码后的字符串非常大，会明显增大 HTML 页面的大小，从而影响加载速度。

### Base64 算法

> 引用 [什么是Base64算法？——全网最详细讲解](https://blog.csdn.net/qq_19782019/article/details/88117150)

Base64 是一种基于64个可打印字符来表示二进制数据的算法，并且算法中以6个二进制 bit 分组，即 `2^6=64`。可打印的字符通常是 `a-zA-z0-9+/`。

Base64编码字符映射表

```
索引 编码	 索引	 编码	索引	编码	索引	编码
0	    A	   16	   Q	 32	   g	  48	  w
1	    B	   17	   R	 33	   h	  49	  x
2	    C	   18  	 S	 34	   i	  50	  y
3	    D	   19	   T	 35    j	  51	  z
4	    E	   20	   U	 36	   k	  52	  0
5	    F	   21	   V	 37	   l	  53	  1
6	    G	   22	   W	 38	   m	  54	  2
7	    H	   23	   X	 39	   n	  55	  3
8	    I	   24	   Y	 40	   o	  56	  4
9	    J	   25	   Z	 41	   p	  57	  5
10	  K	   26	   a	 42	   q	  58	  6
11	  L	   27	   b	 43	   r	  59	  7
12	  M	   28	   c	 44	   s	  60	  8
13	  N	   29	   d	 45	   t	  61	  9
14	  O	   30	   e	 46	   u	  62	  +
15	  P	   31	   f	 47	   v	  63	  /
```

Base64编码的基本流程如下：

1. 将给定的数据转换成二进制编码，转换成二进制编码的方式可以是ASCII，UTF-8等。
2. 对给定的编码做分组转换操作，每3个字节（24bit）分为一组，然后将这24bit划分为4组6bit。
3. 对获得的4组6bit编码进行补位，向6bit编码的高位补2bit 0，变成4组8bit编码。
4. 将每个8bit编码转换为十进制编码。
5. 以十进制编码为索引，映射为上表中对应的字符。
6. 特殊情况下，若是分组中少了“位”，即使用0填充。若是少了组，直接用“=”代替。

以字符串 “Man” 的 Base64 编码 “TWFu” 为例讲解。

1. 我们一个一个字符来分析，首先对于“M”来说，"M"对应的ASCII编码是77，二进制形式即01001101；同理，字符“a”对应的ASCII编码是97，二进制表现形式为01100001；“n” 的ASCII编码为110，二进制形式为：01101110。
2. 这三个字符的二进制位组合在一起就变成了一个 24位的字符串 “010011010110000101101110”，接下来，我们从左至右，每次抽取6位作为1组（因为6位一共有2^6=64种不同的组合），因此每一组的6位又代表一个数字（0~63），接下来，我们查看上述 Base64 编码字符映射表，找到这个数字对应的字符。
3. 24 位字符串：“010011010110000101101110”的第一组6位数是“010011”，对应的十进制数是19，我们查找索引表发现，19对应的字符是“T”，因此，第一组6位数对应的字符就是“T”；同理，第二组6位数是“010110”，对应的十进制数是22，查找索引表，22对应的字符是“W”；同理，第三组6位数是“000101”，对应的十进制是5，查表得，5对应的字符是“F”；同理，第四组6位数是“101110”，对应的十进制是46，查表得，46对应的字符是“F”。到此，“Man”字符串的Base64编码得到 “TWFu”。

特殊情况举例 “M" 的Base64 编码 ”TQ==“。

1. 字符“M”只有8位，根本不够24位凑成一组。那么我们仍然先来解析第一组的6位，第一组6位数是“010011”，对应的十进制数是19，我们查找索引表发现，19对应的字符是“T”，第二组只有2位，剩下的4位按照规则填充0,则第二组6位数是“010000”，对应的十进制数是16，我们查找索引表发现，16对应的字符是“Q”，第3组没有任何二进制位，直接用“=”代替，同理，第4组也没有任何二进制位，用“=”代替。

### Base64 算法的劣势

我们发现，3个ASCII字符，一共24位，最后编码成了4个ASCII字符32位。因此，从24位到32位的转变，使得Base64编码的结果要比原来的值变得更大，且大1/3。降低了传输效率。

### URL Base64算法

Get方式和Post方式是Http请求常用的两种方式，某些情况下会要求使用Get方式来传递二进制数据。这时，可以先通过Base64编码来将二进制数据转换成字符串数据。由于符号"+"和符号"/"是不允许出现在Url中的，所以，产生了Url安全的Base64算法，所谓的Url安全的Base64算法，其实主要包含两个方面。

- 首先，"+"和"/"是不能出现在Url中的，所以Url安全的Base64算法将原映射表中的"+"和"/"替换成了"-"和"\_"。
- 其次，在原来的Url算法中，当数据长度不能被3整除时，编码结果会在末尾填充"="，而在Url中，"="是有特殊含义的，所以"="不能出现在结果中。对于这个问题，目前有两种解决方案。
  - (1) 将"="替换为其他字符，例如，可以用其他符号替代，例如可以用""，"."等符号替代，但是""与文件系统冲突，不能使用，有的文件系统会认为连续的两个"."是错误。
  - (2) 去掉后面的填充的"="，去掉”=“后怎么解码呢？因为Base64是把3个字节变为4个字节，所以，Base64编码的长度永远是4的倍数，因此，解码时，如果数据长度不是4的整数倍，在数据后面填充"="，把Base64字符串的长度变为4的倍数，就可以正常解码了。

由于Url Base64 算法并没有形成统一的规范，有的软件可能会使用自定义的映射表。

## Nodejs 中 Blob 类源码

删除了一些代码，主要是了解 Blob 类的构造

```js
// lib/internal/blob.js
"use strict"

const kHandle = Symbol("kHandle")
const kType = Symbol("kType")
const kLength = Symbol("kLength")
const kNotCloneable = Symbol("kNotCloneable")
const disallowedTypeCharacters = /[^\u{0020}-\u{007E}]/u

const enc = new TextEncoder()

// Yes, lazy loading is annoying but because of circular
// references between the url, internal/blob, and buffer
// modules, lazy loading here makes sure that things work.

function lazyReadableStream(options) {
  // 省略...
  return new ReadableStream(options)
}

function isBlob(object) {
  return object?.[kHandle] !== undefined
}

function getSource(source, endings) {
  if (isBlob(source)) return [source.size, source[kHandle]]

  if (isAnyArrayBuffer(source)) {
    source = new Uint8Array(source)
  } else if (!isArrayBufferView(source)) {
    source = `${source}`
    if (endings === "native")
      source = RegExpPrototypeSymbolReplace(/\n|\r\n/g, source, EOL)
    source = enc.encode(source)
  }

  // We copy into a new Uint8Array because the underlying
  // BackingStores are going to be detached and owned by
  // the Blob.
  const { buffer, byteOffset, byteLength } = source
  const slice = buffer.slice(byteOffset, byteOffset + byteLength)
  return [byteLength, new Uint8Array(slice)]
}

class Blob {
  constructor(sources = [], options) {
    if (
      sources === null ||
      typeof sources[SymbolIterator] !== "function" ||
      typeof sources === "string"
    ) {
      throw new ERR_INVALID_ARG_TYPE("sources", "a sequence", sources)
    }
    validateDictionary(options, "options")

    let { type = "", endings = "transparent" } = options ?? kEmptyObject

    endings = `${endings}`

    if (endings !== "transparent" && endings !== "native")
      throw new ERR_INVALID_ARG_VALUE("options.endings", endings)

    let length = 0
    const sources_ = ArrayFrom(sources, (source) => {
      const { 0: len, 1: src } = getSource(source, endings)
      length += len
      return src
    })
    // 即是 Blob 是二进制数据表示的大对象，但仍不然超过 V8 的内存限制，32位系统是1GB，64位系统4GB
    if (length > kMaxLength) throw new ERR_BUFFER_TOO_LARGE(kMaxLength)

    this[kHandle] = _createBlob(sources_, length)
    this[kLength] = length

    type = `${type}`
    this[kType] =
      RegExpPrototypeExec(disallowedTypeCharacters, type) !== null
        ? ""
        : StringPrototypeToLowerCase(type)
  }

  get type() {
    if (!isBlob(this)) throw new ERR_INVALID_THIS("Blob")
    return this[kType]
  }

  get size() {
    if (!isBlob(this)) throw new ERR_INVALID_THIS("Blob")
    return this[kLength]
  }

  slice(start = 0, end = this[kLength], contentType = "") {
    if (!isBlob(this)) throw new ERR_INVALID_THIS("Blob")
    if (start < 0) {
      start = MathMax(this[kLength] + start, 0)
    } else {
      start = MathMin(start, this[kLength])
    }

    if (end < 0) {
      end = MathMax(this[kLength] + end, 0)
    } else {
      end = MathMin(end, this[kLength])
    }

    contentType = `${contentType}`
    if (RegExpPrototypeExec(disallowedTypeCharacters, contentType) !== null) {
      contentType = ""
    } else {
      contentType = StringPrototypeToLowerCase(contentType)
    }

    const span = MathMax(end - start, 0)

    return createBlob(
      this[kHandle].slice(start, start + span),
      span,
      contentType
    )
  }

  arrayBuffer() {
    if (!isBlob(this)) return PromiseReject(new ERR_INVALID_THIS("Blob"))

    const { promise, resolve, reject } = createDeferredPromise()
    const reader = this[kHandle].getReader()
    const buffers = []
    const readNext = () => {
      reader.pull((status, buffer) => {
        if (status === 0) {
          // EOS, concat & resolve
          // buffer should be undefined here
          resolve(concat(buffers))
          return
        } else if (status < 0) {
          // The read could fail for many different reasons when reading
          // from a non-memory resident blob part (e.g. file-backed blob).
          // The error details the system error code.
          const error = lazyDOMException(
            "The blob could not be read",
            "NotReadableError"
          )
          reject(error)
          return
        }
        if (buffer !== undefined) buffers.push(buffer)
        queueMicrotask(() => readNext())
      })
    }
    readNext()
    return promise
  }

  async text() {
    if (!isBlob(this)) throw new ERR_INVALID_THIS("Blob")

    dec ??= new TextDecoder()

    return dec.decode(await this.arrayBuffer())
  }

  bytes() {
    if (!isBlob(this)) throw new ERR_INVALID_THIS("Blob")

    return PromisePrototypeThen(
      this.arrayBuffer(),
      (buffer) => new Uint8Array(buffer)
    )
  }

  stream() {
    if (!isBlob(this)) throw new ERR_INVALID_THIS("Blob")

    const reader = this[kHandle].getReader()
    return new lazyReadableStream(
      {
        type: "bytes",
        start(c) {
          // There really should only be one read at a time so using an
          // array here is purely defensive.
          this.pendingPulls = []
        },
        pull(c) {
          const { promise, resolve, reject } = createDeferredPromise()
          this.pendingPulls.push({ resolve, reject })
          const readNext = () => {
            reader.pull((status, buffer) => {
              // If pendingPulls is empty here, the stream had to have
              // been canceled, and we don't really care about the result.
              // We can simply exit.
              if (this.pendingPulls.length === 0) {
                return
              }
              if (status === 0) {
                // EOS
                c.close()
                // This is to signal the end for byob readers
                // see https://streams.spec.whatwg.org/#example-rbs-pull
                c.byobRequest?.respond(0)
                const pending = this.pendingPulls.shift()
                pending.resolve()
                return
              } else if (status < 0) {
                // The read could fail for many different reasons when reading
                // from a non-memory resident blob part (e.g. file-backed blob).
                // The error details the system error code.
                const error = lazyDOMException(
                  "The blob could not be read",
                  "NotReadableError"
                )
                const pending = this.pendingPulls.shift()
                c.error(error)
                pending.reject(error)
                return
              }
              // ReadableByteStreamController.enqueue errors if we submit a 0-length
              // buffer. We need to check for that here.
              if (buffer !== undefined && buffer.byteLength !== 0) {
                c.enqueue(new Uint8Array(buffer))
              }
              // We keep reading until we either reach EOS, some error, or we
              // hit the flow rate of the stream (c.desiredSize).
              queueMicrotask(() => {
                if (c.desiredSize < 0) {
                  // A manual backpressure check.
                  if (this.pendingPulls.length !== 0) {
                    // A case of waiting pull finished (= not yet canceled)
                    const pending = this.pendingPulls.shift()
                    pending.resolve()
                  }
                  return
                }
                readNext()
              })
            })
          }
          readNext()
          return promise
        },
        cancel(reason) {
          // Reject any currently pending pulls here.
          for (const pending of this.pendingPulls) {
            pending.reject(reason)
          }
          this.pendingPulls = []
        },
        // We set the highWaterMark to 0 because we do not want the stream to
        // start reading immediately on creation. We want it to wait until read
        // is called.
      },
      new CountQueuingStrategy({ highWaterMark: 0 })
    )
  }
}

function TransferableBlob(handle, length, type = "") {
  markTransferMode(this, true, false)
  this[kHandle] = handle
  this[kType] = type
  this[kLength] = length
}

ObjectSetPrototypeOf(TransferableBlob.prototype, Blob.prototype)
ObjectSetPrototypeOf(TransferableBlob, Blob)

function createBlob(handle, length, type = "") {
  const transferredBlob = new TransferableBlob(handle, length, type)

  // Fix issues like: https://github.com/nodejs/node/pull/49730#discussion_r1331720053
  transferredBlob.constructor = Blob

  return transferredBlob
}

ObjectDefineProperty(Blob.prototype, SymbolToStringTag, {
  __proto__: null,
  configurable: true,
  value: "Blob",
})

module.exports = {
  Blob,
  createBlob,
  createBlobFromFilePath,
  isBlob,
  kHandle,
  resolveObjectURL,
}
```

## Nodejs 中 File 源码

```js
class File extends Blob {
  #name
  #lastModified

  constructor(fileBits, fileName, options = kEmptyObject) {
    if (arguments.length < 2) {
      throw new ERR_MISSING_ARGS("fileBits", "fileName")
    }

    super(fileBits, options)

    let { lastModified } = options ?? kEmptyObject

    if (lastModified !== undefined) {
      // Using Number(...) will not throw an error for bigints.
      lastModified = +lastModified

      if (NumberIsNaN(lastModified)) {
        lastModified = 0
      }
    } else {
      lastModified = DateNow()
    }

    this.#name = StringPrototypeToWellFormed(`${fileName}`)
    this.#lastModified = lastModified
  }

  get name() {
    return this.#name
  }

  get lastModified() {
    return this.#lastModified
  }
}

module.exports = {
  File,
}
```
