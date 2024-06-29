/*
 * @Date         : 2024-06-20 13:42:19 星期4
 * @Author       : xut
 * @Description  :
 */
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

const __dirname = path.dirname(import.meta.filename)

// RSA密钥对的生成
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048, // 密钥长度
})

// 打印私钥和公钥，或者输出到本地文件保存
// console.log(privateKey.export({ type: "pkcs1", format: "pem" }))
// console.log(publicKey.export({ type: "spki", format: "pem" }))
// fs.writeFileSync(
//   path.join(__dirname, "./secret/rsa_private_key.pem"),
//   privateKey.export({ type: "pkcs1", format: "pem" }),
//   { encoding: "utf8" }
// )
// fs.writeFileSync(
//   path.join(__dirname, "./secret/rsa_public_key.pem"),
//   publicKey.export({ type: "spki", format: "pem" }),
//   { encoding: "utf8" }
// )

/******************************
 * publicEncrypt / privateDecrypt
 ***************************/
let message = "Hello Bob!"
const bufferMessage = Buffer.from(message, "utf8")

// Alice 使用 Bob 的公钥加密消息
const encryptedMessage = crypto.publicEncrypt(publicKey, bufferMessage)

// 现在 Bob 接收到已经加密过的数据，并使用自己的私钥来解密消息
const decryptedMessage = crypto.privateDecrypt(privateKey, encryptedMessage)

// 将解密后的Buffer转换回字符串，以得到原始消息
console.log(decryptedMessage.toString()) // 输出: 'Hello, Bob!'

/******************************
 * privateEncrypt / publicDecrypt
 ***************************/
// // Alice 想给 Bob 发送的消息
// const message = "Hello, Bob!"

// //  将消息转换成Buffer
// const bufferMessage = Buffer.from(message, "utf8")

// // Alice 使用自己的私钥加密消息
// const encryptedMessage = crypto.privateEncrypt(privateKey, bufferMessage)

// // Bob 接家到加密的消息后，使用 Alice 的公钥解密数据
// const decryptedMessage = crypto.publicDecrypt(publicKey, encryptedMessage)

// // 打印解密后的消息
// console.log(decryptedMessage.toString("utf8")) // Hello, Bob!
