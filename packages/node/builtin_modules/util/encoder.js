/*
 * @Date         : 2024-06-16 23:30:11 星期0
 * @Author       : xut
 * @Description  :
 */
import { TextEncoder } from "node:util"

// 创建一个TextEncoder实例，默认编码方式 uft8
const encoder = new TextEncoder()

console.log("textEncoder.encoding = ", encoder.encoding)

// 将一段文本编码为UTF-8
const text = "Hello, world!"
const encodedData = encoder.encode(text)

// 现在 encodedData 是一个 Uint8Array，
console.log(encodedData)
