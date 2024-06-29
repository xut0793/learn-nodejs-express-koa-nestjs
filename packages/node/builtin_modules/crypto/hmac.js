/*
 * @Date         : 2024-06-19 20:05:44 星期3
 * @Author       : xut
 * @Description  :
 */
import { createHmac, generateKeySync } from "node:crypto"

const key = generateKeySync("hmac", { length: 512 })
console.log("🚀 ~ key:", key.export().toString("hex"))

// 创建HMAC实例
const hmac = createHmac("sha256", key)

// 要保护的数据
const message = "Hello, world!"

// 更新HMAC实例的数据
hmac.update(message)

// 输出HMAC的hex表示形式
const mac = hmac.digest("hex")

console.log(`The HMAC is: ${mac}`)
