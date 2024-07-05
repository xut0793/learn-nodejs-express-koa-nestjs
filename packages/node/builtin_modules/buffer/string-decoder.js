/*
 * @Date         : 2024-07-05 09:01:03 星期5
 * @Author       : xut
 * @Description  :
 */
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
