# String Decoder 字符解码器

这个模块提供了用于将 Buffer 对象解码为字符串（以保留编码的多字节 UTF-8 和 UTF-16 字符的方式）的 API。

它适合处理那些可能被分割并跨越多个缓冲区传输的多字节字符。如果直接使用 `Buffer.toString()` 方法在每个接收到的片段上，可能会导致一个字符被拆分，从而产生乱码。StringDecoder 通过 write 方法保留这些零散片段的最后几个字节，直到接收到足够的信息来正确解码字符，解决了这个问题。

这个模块是 Nodejs 早期实现，在 nodejs@0.1.99就引入了。但在现在，同样的功能，使用遵循 Web API 实现的 TextDecoder 类适合理解。

## API

- `new StringDecoder([encoding])`
- `stringDecoder.write(buffer)` 将 buffer 二进制数据按实例传入的编码规则，返回一个已解码的字符串。它会省略不完整的字节，这样在处理多字节字符时，即使它们被拆分到不同的数据片段中，也不会因为字符断裂造成乱码。
- `stringDecoder.end([buffer])` 方法的作用是处理那些可能因为流结束而留在 decoder 内部缓冲区中的任何剩余输入。如果传递了 buffer 参数，该方法首先会对提供的 buffer 进行解码。然后，如果有任何未完成的字符残留在内部缓冲区中（也就是说，在最后一个 buffer 的处理过程中，有字符因为数据片断而被截断了），`stringDecoder.end()` 将尝试使用默认字符或者特定策略来处理这些不完整的字符，并返回结果字符串。如果没有提供 buffer 参数，这个方法只会返回留在内部缓冲区中的任何剩余的解码字符串。

```js
import { StringDecoder } from "node:string_decoder"

// 假设这是分批到达的数据
const bytes = [0xe2, 0x82, 0xac, 0xe2] // 其中 0xE2 0x82 0xAC 是欧元符号 € 的 UTF-8 编码
const buffer1 = Buffer.from([bytes[0], bytes[1], bytes[2]])
const buffer2 = Buffer.from([bytes[3]])

console.log(buffer1.toString()) // 输出: '€'
console.log(buffer2.toString()) // 输出: �，这是因为 0xE2 单独构不成有效的 UTF-8 字符
console.log(buffer1 + buffer2) // €�

// 使用 StringDecoder 来正确处理
const decoder = new StringDecoder() // 默认 "utf8"
const output1 = decoder.write(buffer1)
console.log("🚀 ~ output1:", output1)
const output2 = decoder.write(buffer2) // decoder 内部处理了半个字符的情况
console.log("🚀 ~ output2:", output2)
console.log("🚀 ~ result:", output1 + output2) // 正确输出: '€'

// 结束解码操作，如果有未完成的字符，尝试解码并输出
console.log(decoder.end()) // 输出: �

const uint8 = new Uint8Array(bytes)
const textDecoder = new TextDecoder("utf8")
let text = textDecoder.decode(uint8)
console.log("🚀 ~ text:", text) // €�
```

## 源码

Nodejs 中 StringDecoder 在 js 层面的源码

```js
// lib/string_decoder.js
const kNativeDecoder = Symbol("kNativeDecoder")

function StringDecoder(encoding) {
  // 映射 nodejs 支持的合法编码类型 {"utf8" | "utf16le" | "hex" | "ascii" | "base64" | "latin1" | "base64url"}
  // 不支持的编码则报错
  this.encoding = normalizeEncoding(encoding)
  this[kNativeDecoder] = Buffer.alloc(kSize) // kSize 为 C++ 接口提供
  this[kNativeDecoder][kEncodingField] = encodingsMap[this.encoding]
}

/**
 * Returns a decoded string, omitting any incomplete multi-bytes
 * 返回已解码的字符串，省略任何不完整的多字节
 * characters at the end of the Buffer, or TypedArray, or DataView
 * @param {string | Buffer | TypedArray | DataView} buf
 * @returns {string}
 * @throws {TypeError} Throws when buf is not in one of supported types
 */
StringDecoder.prototype.write = function write(buf) {
  if (typeof buf === "string") return buf
  if (!ArrayBufferIsView(buf))
    throw new ERR_INVALID_ARG_TYPE(
      "buf",
      ["Buffer", "TypedArray", "DataView"],
      buf
    )
  if (!this[kNativeDecoder]) {
    throw new ERR_INVALID_THIS("StringDecoder")
  }

  // 调用 C++ 接口
  return decode(this[kNativeDecoder], buf)
}

/**
 * Returns any remaining input stored in the internal buffer as a string.
 * 以字符串形式返回存储在内部缓冲区中的任何剩余输入。
 * After end() is called, the stringDecoder object can be reused for new
 * input.
 * @param {string | Buffer | TypedArray | DataView} [buf]
 * @returns {string}
 */
StringDecoder.prototype.end = function end(buf) {
  let ret = ""
  if (buf !== undefined) ret = this.write(buf)
  if (this[kNativeDecoder][kBufferedBytes] > 0)
    // flush 为 C++ 接口
    ret += flush(this[kNativeDecoder])
  return ret
}
```

实际上在 Nodejs 中，TextDecoder 的实现也是基于 StringDecoder 的。

```js
// lib/internal/encoding.js

function lazyStringDecoder() {
  if (StringDecoder === undefined)
    ({ StringDecoder } = require("string_decoder"))
  return StringDecoder
}

class TextDecoder {
  constructor(encoding = "utf-8", options = kEmptyObject) {
    // 省略代码...

    encoding = `${encoding}`
    const enc = getEncodingFromLabel(encoding)

    this[kDecoder] = true
    // StringDecoder will normalize WHATWG encoding to Node.js encoding.
    this[kHandle] = new (lazyStringDecoder())(enc)
    this[kFlags] = flags
    this[kEncoding] = enc
    this[kBOMSeen] = false
  }

  decode(input = empty, options = kEmptyObject) {
    // 省略代码...

    let result =
      this[kFlags] & CONVERTER_FLAGS_FLUSH
        ? this[kHandle].end(input)
        : this[kHandle].write(input)

    return result
  }
}
```
