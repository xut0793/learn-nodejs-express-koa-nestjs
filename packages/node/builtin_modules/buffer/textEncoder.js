/*
 * @Date         : 2024-07-01 19:23:22 星期1
 * @Author       : xut
 * @Description  :
 */
// const buffer = new ArrayBuffer(1)
// const uint8 = new Uint8Array(buffer)

// // 使用 TextEncoder 编码字符串，默认是生成 web 通用的 UTF-8 编码方案
// const textEncoder = new TextEncoder()
// // encodeInto(string, uint8Array) 返回 read 表示字符串编码的码元数量，written 表示写入内存的字节数量
// const { read, written } = textEncoder.encodeInto("A", uint8)
// console.log("🚀 ~ read, written:", read, written) // 1 1

// // new TextDecoder(utfLabel, options)，其中 uftLabel 默认 uft8 / uft-8
// const uft8decoder = new TextDecoder()
// // decode(buffer) buffer 可以是一个 ArrayBuffer / TypedArray / DataView 对象
// const str = uft8decoder.decode(uint8)
// console.log("🚀 ~ str:", str) // A

// 假设我们有一个分块的字节流
const byteChunks = [
  new Uint8Array([0x48, 0x65, 0x6c]), // "Hel"
  new Uint8Array([0x6c, 0x6f]), // "lo"
  new Uint8Array([0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64]), // " World"
]

// 使用非流式解码器
const nonStreamDecoder = new TextDecoder("utf-8")
let nonStreamResult = ""
for (const chunk of byteChunks) {
  nonStreamResult += nonStreamDecoder.decode(chunk, { stream: false })
}
console.log(nonStreamResult)
// 输出可能是乱码，因为非流式解码器期望一次性接收完整的字节序列

// 使用流式解码器
const streamDecoder = new TextDecoder("utf-8")
let streamResult = ""
for (const chunk of byteChunks) {
  streamResult += streamDecoder.decode(chunk, { stream: true }) // 正确使用 { stream: true }
}
console.log(streamResult)
// 输出 "Hello World"，因为流式解码器能够正确处理分块的字节流
