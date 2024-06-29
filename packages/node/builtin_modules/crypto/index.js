/*
 * @Date         : 2024-06-19 11:29:42 星期3
 * @Author       : xut
 * @Description  :
 */
import {
  getHashes,
  createHash,
  getRandomValues,
  createSecretKey,
  createHmac,
  generateKey,
  generateKeySync,
  getCiphers,
} from "node:crypto"

// console.log(getHashes())
console.log(getCiphers().join(" "))

// const hash1 = createHash("md5")
// hash1.update("hello123")
// console.log(hash1.digest("hex"))

// const hash2 = createHash("md5")
// hash2.update("BBAaBB")
// console.log(hash2.digest("hex"))

// 假设密码为 123456
// const pwd = "123456"

// // 创建一个4个字节长度的存储随机数的容器
// const arr = new Uint8Array(4)
// // 用随机数填充
// getRandomValues(arr)
// // 将该随机数组转换为十六进制字符串
// const salt = Array.from(arr, (byte) => byte.toString(16).padStart(2, "0")).join(
//   ""
// )
// console.log("🚀 ~ salt:", salt)

// // 将密码和盐值组合
// const token = pwd + salt

// const hash = createHash("sha256")
// hash.update(token)
// const secret = hash.digest("hex")
// console.log("🚀 ~ secret:", secret)

// 可以使用
// const key = generateKeySync("hmac", { length: 512 })
// console.log("🚀 ~ key:", key.export().toString("hex"))

// // 创建HMAC实例
// const hmac = createHmac("sha256", key)

// // 要保护的数据
// const message = "Hello, world!"

// // 更新HMAC实例的数据
// hmac.update(message)

// // 输出HMAC的hex表示形式
// const mac = hmac.digest("hex")

// console.log(`The HMAC is: ${mac}`)
