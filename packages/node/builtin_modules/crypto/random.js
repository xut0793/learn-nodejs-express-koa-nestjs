/*
 * @Date         : 2024-06-20 14:26:24 星期4
 * @Author       : xut
 * @Description  :
 */
import crypto from "node:crypto"

/*************************************
 * randomBytes
 *************************************/
const size = 32 // 例如，AES-256 需要32字节的密钥
crypto.randomBytes(size, function (err, keyBuffer) {
  const key = keyBuffer.toString("hex")
  console.log(`Encryption key: ${key}`) // 16449df0b8e7889914d5a3474e00d9fbefed6448eec5b5ba266f6953753ef4a4
})

/*************************************
 * getRandomValues
 *************************************/
// 创建一个长度为 32 字节的 Uint8Array
const array = new Uint8Array(32)
// 填充随机值
crypto.getRandomValues(array)
// 将该随机数组转换为十六进制字符串作为 token
const token = Array.from(array, (byte) =>
  byte.toString(16).padStart(2, "0")
).join("")
console.log("getRandomValues >>>", token) // 输出例如：'4f3c1a...（共 64 位十六进制字符）'

/*************************************
 * randomFill
 *************************************/
// Uint32Array 是一种类型化数组，用来表示一个包含 32 位无符号整数的数组。
const typedArray = new Uint32Array(8)
const randomFill = crypto.randomFillSync(typedArray)
console.log(`randomFill >>> ${randomFill.join(", ")}`)

/*************************************
 * randomInt
 *************************************/
// 同步生成一个 5 到 15 之间的随机整数（不包括 15）
let randomNumber = crypto.randomInt(5, 15)
console.log("randomInt >>>", randomNumber) // 输出一个 5 到 14 之间的随机整数

/*************************************
 * randomUUID
 *************************************/
// 生成一个随机的 UUID，一个全新的、几乎不可能重复的字符串。
const uuid = crypto.randomUUID()
console.log("randomUUID >>>", uuid) // 输出类似：'f47ac10b-58cc-4372-a567-0e02b2c3d479'
