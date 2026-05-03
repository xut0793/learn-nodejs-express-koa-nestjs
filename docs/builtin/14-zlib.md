# zlib

Node.js 中的Zlib模块是用于压缩和解压缩数据，通常作用于网络通信和文件存储时，因为它可以显著减少传输数据的大小，从而节省带宽和提高加载速度。

- 压缩（Compression）：将数据的大小减小，方便存储或传输。
- 解压缩（Decompression）：将压缩后的数据恢复到原始状态。

## 压缩算法

在 Web 开发中，在客户端和服务端间进行数据传输时通常会将数据进行压缩，特别是静态资源的请求。两都通过特定的 header 字段进行沟通。

- `'Accept-Encoding': 'br,gzip,deflate'` 客户端请求头 accept-encoding 向服务器表明可接受的压缩算法
- `’content-encoding‘：’gzip'` 服务端响应头字段 content-encoding 赂客户端表明实际的压缩算法

常用压缩算法：gzip / deflate / brotli，现代浏览器普遍支持这些压缩算法，浏览器会在接收文件时自行解压缩文件。

- gzip：表示采用 `Lempel-Ziv coding（LZ77）`压缩算法，以及 32 位 CRC 校验的编码方式。这个编码方式最初由 UNIX 平台上的 gzip 程序采用，在 HTTP 协议中，Gzip 编码被用来提升 Web 应用性能，要求 Web 服务器和客户端（浏览器）都支持。目前，几乎所有主流浏览器都已经支持了 Gzip。Gzip 可将一般纯文本内容压缩至原大小的 40%，大大减少了网站文件中的重复代码和空白字符。它提供了 9 个压缩级别，用户可以根据需要微调压缩量和压缩时间。
- deflate：采用 zlib 结构（在 RFC 1950 中规定），和 deflate 压缩算法（在 RFC 1951 中规定）。
- brotli：是 Google 在 2015 年 9 月推出一种通用的无损压缩算法，它结合使用 LZ77 算法的一个现代变体`Lempel-Ziv coding`、霍夫曼编码 Huffman 和二阶上下文建模来压缩数据。相比 Gzip 的 9 个压缩级别，Brotli 共有 11 个。此外，Brotli 还使用预定义的 120KB 字典，包含超过 13000 个常用单词、短语和其他子字符串。这些因素有效提高了 Brotli 的压缩率（根据 Certsimple 的研究，Brotli 压缩的 JavaScript 文件比 Gzip 小 14%，HTML 文件比 Gzip 小 21%，CSS 文件比 Gzip 小 17%。）。在压缩效率优势明显的代价就是，随着压缩级别的提高，Brotli 压缩所需的时间也会相应增加。换句话说，Brotli 需要更多的计算能力，这可能意味着更高的设备和软件成本。它比 gzip 有更好的压缩率，但压缩速度但比 gzip 慢。

根据 Google 发布的研究报告，Brotli 压缩算法具有多个特点，包括：

- 针对常见的 Web 资源内容，Brotli 的性能比 Gzip 提高了 17-25%；
- 当 Brotli 压缩级别为 1 时，压缩率比 Gzip 的最高级别 9 还要高；
- 在处理不同的 HTML 文档时，Brotli 依然能提供非常高的压缩率。

由于其卓越的压缩性能，Brotli 自推出以来迅速占据了压缩市场。除了 IE 和 Opera Mini 之外，几乎所有主流浏览器都已支持 Brotli 算法。

## 内存控制

压缩和解压数据通常需要消耗大量的内存资源，所以控制内存使用非常重要，zlib 对应的类都提供了可以调整内存使用的配置选项，以优化压缩或触压缩操作。

在 zlib 的 API 中，有几个选项允许你调整内存使用：

```
level: 这个参数决定了压缩的级别，它可以是 -1 到 9 的任意整数。级别越高，压缩比越大，但是相应的内存和计算成本也越高。级别 -1 表示使用默认的压缩级别。
memLevel: 这个参数控制了用于内部压缩状态的内存量。它可以是 1 到 9 的值，其中 1 使用最少的内存，但可能压缩得不够效率，而 9 会使用最多的内存，可能会得到更好的压缩效果。
windowBits: 这个参数控制了用于压缩数据的滑动窗口的大小。滑动窗口越大，潜在的压缩率越高，但同时也会使用更多的内存。
```

基于 Brotli 算法的类的选项中，也提供了相关选项：

```
压缩器选项：
BROTLI_PARAM_QUALITY：相当于常规 zlib 的 level 选项的作用，范围从 BROTLI_MIN_QUALITY 到 BROTLI_MAX_QUALITY，默认为 BROTLI_DEFAULT_QUALITY。
BROTLI_PARAM_LGWIN：相当于常规 zlib 的 windowBits 选项的作用，范围从 BROTLI_MIN_WINDOW_BITS 到 BROTLI_MAX_WINDOW_BITS，默认为 BROTLI_DEFAULT_WINDOW，如果设置了 BROTLI_PARAM_LARGE_WINDOW 标志，则最高可达 BROTLI_LARGE_MAX_WINDOW_BITS。
BROTLI_PARAM_LARGE_WINDOW：启用“大窗口 Brotli”模式的布尔标志（与 RFC 7932 中标准化的 Brotli 格式不兼容）。


解压缩器选项：
BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION：影响内部内存分配模式的布尔标志。
BROTLI_DECODER_PARAM_LARGE_WINDOW：启用“大窗口 Brotli”模式的布尔标志（与 RFC 7932 中标准化的 Brotli 格式不兼容）。
```

示例：假设你想要压缩一个文本文件，但不希望消耗太多内存，因为你的服务器资源有限。在这种情况下，你可能会选择一个较低的 memLevel。

```js
import zlib from "node:zlib"
import fs from "node:fs"

const input = fs.createReadStream("input.txt")
const output = fs.createWriteStream("input.txt.gz")

const gzip = zlib.createGzip({
  level: 6, // 中等压缩级别
  memLevel: 4, // 较低的内存使用
})

input.pipe(gzip).pipe(output)
```

示例：解压一个大文件，并且希望解压得快一些，你的服务器有足够的内存来支持更快的操作。你可以选择增加 windowBits 和 memLevel。

```js
import zlib from "node:zlib"
import fs from "node:fs"

const input = fs.createReadStream("input.txt.gz")
const output = fs.createWriteStream("input.txt")

const gunzip = zlib.createGunzip({
  memLevel: 8, // 较高的内存使用，为了更快的解压速度
  windowBits: 15, // 默认的窗口大小
})

input.pipe(gunzip).pipe(output)
```

## 基于流传输

zlib 模块对压缩（compress）和解压缩（decompress）的实现都是基于 Steam 流数据，所以创建的压缩器或触压缩器具有 Stream 实例的方法，可以进行 pipeline 调用。 见上面例子使用 `pipe` 方法传输流数据。

## Flushing

什么是 Flushing？在压缩或解压缩数据时，数据会被分成多个块处理。flushing 是决定如何处理这些数据块的输出的机制。简单来说，它可以让你决定在某个特定点上是否要强制输出所有到目前为止处理的数据，无论这些数据是否形成了一个完整的压缩块。

简单说就是选择，压缩/解压缩了一部分就传输一部分，还是等全部数据压缩/解压缩完再一起传输。

应用场景：

- 实时通信: 如视频流或即时聊天，需要尽快地发送每一块数据，以减少延迟。使用适当的 flush 选项可以保证数据被及时发送。
- 网络请求压缩: 当服务器发送大量数据给客户端时（例如，一个大型的 JSON 对象），服务器可以使用zlib进行压缩，并使用flush来确保每处理完一部分数据就立即发送，而不是等待整个对象压缩完成。这样做可以提高响应的速度，改善用户体验。
- 文件压缩: 在对文件进行压缩保存到磁盘时，可以使用flush在每写入一定量的数据后确保数据被实际写入磁盘，这样即使在压缩过程中发生错误或程序崩溃，也能保证部分数据的安全。
- 实时视频流: 在实时视频通信中，视频数据需要被快速压缩并发送。在这种情况下，使用flush可以使每一个视频帧被尽快压缩并送出，最小化延迟。

## 基本使用

根据具体算法不同，zlib 模块提供了以下方法来创建压缩器对象和解压缩器对象

- gzip
  - `createGzip([options])`
  - `createGunzip([options])`
  - `createUnzip([options])`
- deflate
  - `createDeflate([options])`
  - `createDeflateRaw([options])`
  - `createInflate([options])`
  - `createInflateRaw([options])`
- brotli
  - `createBrotliCompress([options])`
  - `createBrotliDecompress([options])`

上述方法的使用步骤：

1. 创建压缩器或触压缩器对象
2. 然后传入数据对象，调用第一步生成压缩器或解压缩器执行。

但同时，在 zlib 对象上都提供了便捷的直接调用方法，并同时实现同步方法

- gzip
  - `zlib.gzip(buffer[, options], callback)`
  - `zlib.gzipSync(buffer[, options])`
  - `zlib.gunzip(buffer[, options], callback)`
  - `zlib.gunzipSync(buffer[,options])`
  - `zlib.unzip(buffer[, options], callback)`
  - `zlib.unzipSync(buffer[, options])`
- deflate
  - `zlib.deflate(buffer[, options], callback)`
  - `zlib.deflateSync(buffer[, options])`
  - `zlib.inflate(buffer[, options], callback)`
  - `zlib.inflateSync(buffer[,options])`
  - `zlib.deflateRaw(buffer[, options], callback)`
  - `zlib.deflateRawSync(buffer[, options])`
  - `zlib.inflateRaw(buffer[, options])`
  - `zlib.inflateRawSync(buffer[, options])`
- brotli
  - `zlib.brotliCompress(buffer[, options], callback)`
  - `zlib.brotliCompressSync(buffer[, options])`
  - `zlib.brotliDecompress(buffer[, options], callback)`
  - `zlib.brotliDecompressSync(buffer[, options])`

### options 选项配置

```
flush           <integer> 默认值：zlib.constants.Z_NO_FLUSH
finishFlush     <integer> 默认值：zlib.constants.Z_FINISH
chunkSize       <integer> 默认值：16 * 1024
windowBits      <integer> 设置窗口大小
maxOutputLength <integer> 使用 方便的方法 时限制输出大小。默认值：buffer.kMaxLength
info            <boolean> 如果是 true，在解压缩完成后，除了解压缩的数据，还会返回有关压缩数据的信息：带有 buffer 和 engine 的对象。


# 以下三个选项仅对压缩器才有
level           <integer> （仅压缩） 设置压缩级别
memLevel        <integer> （仅压缩） 设置压缩
strategy        <integer> （仅压缩） 设置压缩策略

# 选项仅针对 deflate/inflate
dictionary      <Buffer> | <TypedArray> | <DataView> | <ArrayBuffer> （仅 deflate/inflate，默认为空字典）
```

### constants 常量

```
flush 刷新值，可用的常量值：
  zlib.constants.Z_NO_FLUSH
  zlib.constants.Z_PARTIAL_FLUSH
  zlib.constants.Z_SYNC_FLUSH
  zlib.constants.Z_FULL_FLUSH
  zlib.constants.Z_FINISH
  zlib.constants.Z_BLOCK
  zlib.constants.Z_TREES

level 压缩级别，可用的常量值：
  zlib.constants.Z_NO_COMPRESSION
  zlib.constants.Z_BEST_SPEED
  zlib.constants.Z_BEST_COMPRESSION
  zlib.constants.Z_DEFAULT_COMPRESSION

strategy 压缩策略，可用的常量值：
  zlib.constants.Z_FILTERED
  zlib.constants.Z_HUFFMAN_ONLY
  zlib.constants.Z_RLE
  zlib.constants.Z_FIXED
  zlib.constants.Z_DEFAULT_STRATEGY

压缩/解压缩 函数的返回代码。负值是错误，正值用于特殊但正常的事件。
  zlib.constants.Z_OK
  zlib.constants.Z_STREAM_END
  zlib.constants.Z_NEED_DICT
  zlib.constants.Z_ERRNO
  zlib.constants.Z_STREAM_ERROR
  zlib.constants.Z_DATA_ERROR
  zlib.constants.Z_MEM_ERROR
  zlib.constants.Z_BUF_ERROR
  zlib.constants.Z_VERSION_ERROR
```

示例

```js
const fs = require("fs")
const zlib = require("zlib")

// 创建一个具有自定义压缩级别的Deflate压缩流
const deflate = zlib.createDeflateRaw({
  level: zlib.constants.Z_BEST_COMPRESSION, // 最高压缩级别
  strategy: zlib.constants.Z_FILTERED, // 适用于已经部分排序的数据
})

// 创建文件流
const input = fs.createReadStream("input.txt")
const output = fs.createWriteStream("output.gz")

// 将输入文件流通过Gzip对象压缩后，输出到output.gz文件
input.pipe(deflate).pipe(output)
```

### Brotli options

Brotli 类对应的选项和常量相对于常用的 gzip / deflate 是独立的。

```
flush           <integer> 默认值：zlib.constants.Z_NO_FLUSH
finishFlush     <integer> 默认值：zlib.constants.Z_FINISH
chunkSize       <integer> 默认值：16 * 1024
maxOutputLength <integer> 使用 方便的方法 时限制输出大小。默认值：buffer.kMaxLength
params          <Object>  设置 brotli 的键值对参数，key 键值可以从 zlib.constants.BROTLI_PARAM_* 开头常量
```

可设置的常量，包括

```
flush 刷新选项，可设置的常量值，这个特定的操作可能很难在 Node.js 上下文中使用，因为流层很难知道哪些数据会在这个帧中结束。此外，目前无法通过 Node.js API 使用这些数据。
  zlib.constants.BROTLI_OPERATION_PROCESS（所有操作的默认值）
  zlib.constants.BROTLI_OPERATION_FLUSH（调用 .flush() 时默认）
  zlib.constants.BROTLI_OPERATION_FINISH（最后一个块的默认值）
  zlib.constants.BROTLI_OPERATION_EMIT_METADATA


压缩器选项：可以在 Brotli 编码器上设置的选项，影响压缩效率和速度，可以作为选项 params 对象的键和值。

BROTLI_PARAM_MODE：设置压缩模式
  BROTLI_MODE_GENERIC（默认）
  BROTLI_MODE_TEXT，针对 UTF-8 文本进行了调整
  BROTLI_MODE_FONT，针对 WOFF 2.0 字体进行了调整

BROTLI_PARAM_QUALITY：相当于常规 zlib 的 level 选项的作用，范围从 BROTLI_MIN_QUALITY 到 BROTLI_MAX_QUALITY，默认为 BROTLI_DEFAULT_QUALITY。
BROTLI_PARAM_LGWIN：相当于常规 zlib 的 windowBits 选项的作用，范围从 BROTLI_MIN_WINDOW_BITS 到 BROTLI_MAX_WINDOW_BITS，默认为 BROTLI_DEFAULT_WINDOW，如果设置了 BROTLI_PARAM_LARGE_WINDOW 标志，则最高可达 BROTLI_LARGE_MAX_WINDOW_BITS。
BROTLI_PARAM_SIZE_HINT：表示预期输入大小的整数值；对于未知的输入大小，默认为 0。
BROTLI_PARAM_LGBLOCK：范围从 BROTLI_MIN_INPUT_BLOCK_BITS 到 BROTLI_MAX_INPUT_BLOCK_BITS。
BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING：降低压缩率以提高解压速度的布尔标志。
BROTLI_PARAM_LARGE_WINDOW：启用“大窗口 Brotli”模式的布尔标志（与 RFC 7932 中标准化的 Brotli 格式不兼容）。
BROTLI_PARAM_NPOSTFIX：范围从 0 到 BROTLI_MAX_NPOSTFIX。
BROTLI_PARAM_NDIRECT：范围从 0 到 15 << NPOSTFIX，步长为 1 << NPOSTFIX。


解压选项：这些高级选项可用于控制解压缩：

BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION：影响内部内存分配模式的布尔标志。
BROTLI_DECODER_PARAM_LARGE_WINDOW：启用“大窗口 Brotli”模式的布尔标志（与 RFC 7932 中标准化的 Brotli 格式不兼容）。
```

示例

```js
const stream = zlib.createBrotliCompress({
  chunkSize: 32 * 1024,
  params: {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: fs.statSync(inputFile).size,
  },
})
```

## 综合例子

开发 Node.js 服务器，你想为请求的响应启用压缩。

```js
import http from "node:http"
import zlib from "node:zlib"
import fs from "node:fs"
import { pipeline } from "node:stream"

http
  .createServer((request, response) => {
    const raw = fs.createReadStream("index.html")
    // Store both a compressed and an uncompressed version of the resource.
    response.setHeader("Vary", "Accept-Encoding")

    let acceptEncoding = request.headers["accept-encoding"]

    if (!acceptEncoding) {
      acceptEncoding = ""
    }

    const onError = (err) => {
      if (err) {
        // If an error occurs, there's not much we can do because
        // the server has already sent the 200 response code and
        // some amount of data has already been sent to the client.
        // The best we can do is terminate the response immediately
        // and log the error.
        response.end()
        console.error("An error occurred:", err)
      }
    }

    // Note: This is not a conformant accept-encoding parser.
    // See https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
    if (/\bdeflate\b/.test(acceptEncoding)) {
      response.writeHead(200, { "Content-Encoding": "deflate" })
      pipeline(raw, zlib.createDeflate(), response, onError)
    } else if (/\bgzip\b/.test(acceptEncoding)) {
      response.writeHead(200, { "Content-Encoding": "gzip" })
      pipeline(raw, zlib.createGzip(), response, onError)
    } else if (/\bbr\b/.test(acceptEncoding)) {
      response.writeHead(200, { "Content-Encoding": "br" })
      pipeline(raw, zlib.createBrotliCompress(), response, onError)
    } else {
      response.writeHead(200, {})
      pipeline(raw, response, onError)
    }
  })
  .listen(1337)
```

开发客户端请求

```js
// Client request example
import http from "node:http"
import zlib from "node:zlib"
import fs from "node:fs"
import { pipeline } from "node:stream"

const request = http.get({
  host: "example.com",
  path: "/",
  port: 80,
  headers: { "Accept-Encoding": "br,gzip,deflate" },
})

request.on("response", (response) => {
  const output = fs.createWriteStream("example.com_index.html")

  const onError = (err) => {
    if (err) {
      console.error("An error occurred:", err)
      process.exitCode = 1
    }
  }

  switch (response.headers["content-encoding"]) {
    case "br":
      pipeline(response, zlib.createBrotliDecompress(), output, onError)
      break
    // Or, just use zlib.createUnzip() to handle both of the following cases:
    case "gzip":
      pipeline(response, zlib.createGunzip(), output, onError)
      break
    case "deflate":
      pipeline(response, zlib.createInflate(), output, onError)
      break
    default:
      pipeline(response, output, onError)
      break
  }
})
```
