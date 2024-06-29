/*
 * @Date         : 2024-06-19 19:08:59 星期3
 * @Author       : xut
 * @Description  :
 */
import crypto from "node:crypto"

// 生成公私钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
})

const data = "data to sign"

// 签名
const signer = crypto.createSign("sha256")
signer.update(data)
const signature = signer.sign(privateKey, "hex")
console.log("🚀 ~ signature:", signature)

// 验证签名
const verifier = crypto.createVerify("sha256")
verifier.update(data)
const verified = verifier.verify(publicKey, signature, "hex")

console.log(`Signature Verified: ${verified}`)
