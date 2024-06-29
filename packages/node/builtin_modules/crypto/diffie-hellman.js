/*
 * @Date         : 2024-06-20 10:11:12 星期4
 * @Author       : xut
 * @Description  : 运行会比较耗时
 */
import crypto from "node:crypto"

/****************************************
 * 简单的单方面示例
 **************************************/
// const dh = crypto.createDiffieHellman(2048)
// // 生成私有和公共 Diffie-Hellman 密钥值（除非它们已生成或计算），并返回指定 encoding 中的公共密钥
// const publicKey = alice.generateKeys("hex")
// console.log("🚀 ~ publicKey:", publicKey)

// const privateKey = dh.getPrivateKey("hex")
// const _publicKey = dh.getPublicKey("hex")
// console.log("🚀 ~ privateKey:", privateKey)
// console.log("🚀 ~ publicKey === _publicKey:", publicKey === _publicKey) // true

// const prime = dh.getPrime("hex")
// const generator = dh.getGenerator("hex")
// console.log("🚀 ~ prime:", prime)
// console.log("🚀 ~ generator:", generator)

/*********************************
 * Alice
 *********************************/

// 创建 DiffieHellman 密钥交换对象
const alice = crypto.createDiffieHellman(2048) // 这里的数字代表密钥的位数，越大越安全

// 生成 Alice 的密钥对（公钥和私钥），私钥会自动保存在 alice 对象内部，返回的是对应的公钥
const alicePublicKey = alice.generateKeys()

// 获取公共基数和素数，传递给 bob 使用，使用默认的Buffer格式，也可以直接传入编码格式 getPrime('hex') / getGenerator('hex)
const prime = alice.getPrime() // 或者 prime.toString("hex") 使用'hex'编码打印出十六进制表示的素数值
const generator = alice.getGenerator() // 或者  generator.toString("hex"))  使用'hex'编码打印出十六进制表示的素数值

// 现实业务中，可能通过网络将 prime / generator / alicePublicKey 发送给 bob

/*********************************
 * Bob
 *********************************/
// 现实业务中，接收alice 发过来的 prime / generator / alicePublicKey 创建 dh 实例 
// Bob 使用与 Alice 相同的素数和基数创建自己的 DiffieHellman 实例
const bob = crypto.createDiffieHellman(prime, generator)

// 生成 Bob 的密钥，私钥会自动保存在 alice 对象内部，返回的是对应的公钥
const bobPublicKey = bob.generateKeys()

// 现实业务中，可能通过网络将 bobPublicKey 发送给 alice

/*********************************
 * 共享密钥
 *********************************/
// Alice 用 Bob 的公钥生成她的共享密钥
const aliceSecret = alice.computeSecret(bobPublicKey)

// Bob 同样用 Alice 的公钥生成他的共享密钥
const bobSecret = bob.computeSecret(alicePublicKey)

// 如果一切正常，Alice 和 Bob 的共享秘密应该相同
console.log(aliceSecret.toString("hex") === bobSecret.toString("hex")) // 应该输出 true
