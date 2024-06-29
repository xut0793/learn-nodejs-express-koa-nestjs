/*
 * @Date         : 2024-06-19 19:36:46 星期3
 * @Author       : xut
 * @Description  :
 */
import crypto from "node:crypto"

const data = "123456"

const hash = crypto.createHash("md5")
hash.update(data)
const digest1 = hash.digest("hex")
console.log("🚀 ~ digest1:", digest1) // e10adc3949ba59abbe56e057f20f883e

// 或者一步到位
const digest2 = crypto.hash("md5", data, "hex")
console.log("🚀 ~ digest2:", digest2) // e10adc3949ba59abbe56e057f20f883e

// 使用 buffer 数据
const buffer = Buffer.from(data, "utf8")
const hashedBuffer = crypto.hash("md5", buffer)
const digest3 = hashedBuffer.toString("hex")
console.log("🚀 ~ digest3:", digest3) // e10adc3949ba59abbe56e057f20f883e
