/*
 * @Date         : 2024-06-19 23:32:05 星期3
 * @Author       : xut
 * @Description  :
 */
import crypto from "node:crypto"

// 创建一个随机的密钥（32 字节，因为是 AES-256）
// const key = crypto.randomBytes(32)
const key = crypto.generateKeySync("aes", { length: 256 })
// 创建一个随机的初始化向量（16 字节，因为是 AES 的 block size）
const iv = crypto.randomBytes(16)

// 创建一个 cipher 实例，指定加密算法和上面生成的 key 和 iv
const cipher = crypto.createCipheriv("aes-256-cbc", key, iv)

// 要加密的数据
let textToEncrypt = "hello world"
// 使用 update 方法加密数据，cipher.update() 方法就是用于在加密过程中增加数据的
let encrypted = cipher.update(textToEncrypt, "utf8", "base64")
// final 方法完成剩余加密操作并返回最终结果 。cipher.final() 用于结束加密过程并获取剩余的加密数据。
encrypted += cipher.final("base64")

console.log("hello world 加密后的数据:", encrypted)

// 创建一个解密器实例
const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)
// 使用 update 方法逐步添加加密数据，可以多次调用
let decrypted = decipher.update(encrypted, "base64", "utf8")

// 最后使用 final 方法完成解密，并拼接结果
decrypted += decipher.final("utf8")

console.log("解密后的数据：", decrypted)
