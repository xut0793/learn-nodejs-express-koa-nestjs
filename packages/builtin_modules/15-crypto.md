# Crypto

Crypto 模块提供了基于常见算法实现的数据加密功能。

每类算法都有适用的场景，大概场景划分，包括：

- 哈希函数：Hash / HMac
- 加密和解密：细分为对称加密解密 AES 和非对称加密解密 RSA
- 数据签名和验证

## 哈希 Hash Function

哈希函数（Hash function）又称散列算法、哈希算法、摘要算法(digest)，是一种将任意长度的输入数据映射为固定长度输出的函数。

### hash 算法特点

1. 输出长度固定，输出结果也称为 hash 值
2. 雪崩效应，即微小的输入变化也会导致巨大的输出差异
3. 不可逆性，几乎不能从 hash 值倒推原数据
4. 好的 hash 算法冲突概率更低

### 实现算法

散列算法主要分为两类：摘要算法（Digest Algorithm）和安全散列算法族（SHA: Secure Hash Algorithm）

- 摘要算法 Digest Algorithm
  - MD4 消息摘要算法（MD4 Message-Digest Algorithm），1990 年由 Ronald L. Rivest 提出。其摘要长度为 128 位，一般 128 位长的 MD4 散列被表示为 32 位的十六进制字符和数字。
  - MD5 消息摘要算法（MD5 Message-Digest Algorithm），1992 年由 Ronald L. Rivest 提出。其摘要长度为 128 位，一般 128 位长的 MD4 散列被表示为 32 位的十六进制字符和数字。
  - MD6 消息摘要算法（MD6 Message-Digest Algorithm），2008 年由 Ronald L. Rivest 提出。算法增加了并行机制。
  - RACE 原始完整性校验消息摘要（RACE Integrity Primitives Evaluation Message Digest），1996 年由 COSIC 研究小组发布。
  - RIPEMD 以 MD4 为基础原则设计，其表现与 SHA-1 类似，RIPEMD-160 最为常用。
- 安全散列算法族（SHA: Secure Hash Algorithm）由美国国家安全局（National Security Agency，NSA）设计，美国国家标准与技术研究院（National Institute of Standards and Technology，NIST）发布。
  - SHA-0 1993 年发布，即 FIPS PUB 180 Secure Hash Standard，也被称为 SHA-0。基本已废弃。
  - SHA-1 1995 年发布，即 FIPS PUB 180-1 Secure Hash Standard，也被称为 SHA-1。输出是 160 位，即40位的十六进制的数字和字符。
  - SHA-2 2001 年发布，即 FIPS PUB 180-2 Secure Hash Standard，SHA-2 包括 SHA-224, SHA-256, SHA-384, SHA-512 算法。
  - SHA-3 2015 年发布，即 FIPS 202, SHA-3 Standard: Permutation-Based Hash and Extendable-Output Functions，也被称为 Keccak 算法。

通过 `getHashes()` 查看 crypto 支持的哈希算法

```js
import { getHashes } from "node:crypto"
console.log(getHashes())
```

输出

```
[
  "md5",  "md5-sha1",  "md5WithRSAEncryption",
  "ripemd",  "ripemd160",  "ripemd160WithRSA",  "rmd160",
  "sha1",  "sha1WithRSAEncryption",  "sha224",  "sha224WithRSAEncryption",  "sha256",  "sha256WithRSAEncryption",  "sha3-224",  "sha3-256",  "sha3-384",  "sha3-512",  "sha384",  "sha384WithRSAEncryption",
  "sha512",  "sha512-224",  "sha512-224WithRSAEncryption",  "sha512-256",  "sha512-256WithRSAEncryption",  "sha512WithRSAEncryption",
  "shake128",  "shake256",  "sm3",  "sm3WithRSAEncryption",  "ssl3-md5",  "ssl3-sha1",
  "RSA-MD5",  "RSA-RIPEMD160",  "RSA-SHA1",  "RSA-SHA1-2",  "RSA-SHA224",  "RSA-SHA256",  "RSA-SHA3-224",  "RSA-SHA3-256",  "RSA-SHA3-384",  "RSA-SHA384",
  "RSA-SHA3-512",   "RSA-SHA512",  "RSA-SHA512/224",  "RSA-SHA512/256", "RSA-SM3",  "blake2b512",  "blake2s256",
  "id-rsassa-pkcs1-v1_5-with-sha3-224",  "id-rsassa-pkcs1-v1_5-with-sha3-256",  "id-rsassa-pkcs1-v1_5-with-sha3-384",  "id-rsassa-pkcs1-v1_5-with-sha3-512",
]
```

### API

- `crypto.getHashes()` 查看 crypto 支持的哈希算法
- `crypto.createHash(algorithm[, options]): Hash` 创建一个哈希对象
  - algorithm: 指定哈希的算法
- `crypto.hash(algorithm, data[, outputEncoding])` 快速地为给定的数据生成哈希值
  - algorithm: 指定要使用的哈希算法，比如 'md5', 'sha256' 等
  - data: 需要处理的数据，可以是字符串或 buffer 对象
  - outputEncoding: 指定输出的编码类型，比如 'hex' 'base64'，未指定时返回 buffer 对象。
- Hash 类
  - `hash.update(data[, inputEncoding])` 使用给定的 data 更新哈希内容，其编码在 inputEncoding 中给出。如果未提供 encoding，且 data 是字符串，则强制为 'utf8' 编码。如果 data 是 Buffer、TypedArray 或 DataView，则忽略 inputEncoding。
  - `hash.digest([encoding])` 计算当前哈希对象内部数据的摘要，返回哈希值。可以通过 encoding 指定编码返回字符串，否则返回 buffer 对象。一旦调用该方法，该 hash 对象不能再次使用了，多次调用会报错。
  - `hash.copy([options])` 基于当前 hash 对象，创建一个新的 hash 对象。但是当调用 `hash.digest` 方法后，再尝试复制会报错

```js
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
```

### 哈希碰撞

哈希碰撞是指，两个不同的输入得到了相同的输出：

假设如下不同的输入产生了相同的输出。

```js
import { getHashes, createHash } from "node:crypto"

const hash1 = createHash("md5")
hash1.update("AaAaAa")
console.log(hash1.digest("hex")) // f905eafa206c1ce312a1a493701ac169

const hash2 = createHash("md5")
hash2.update("BBAaBB")
console.log(hash2.digest("hex")) // f905eafa206c1ce312a1a493701ac169
```

碰撞能不能避免？

答案是不能。碰撞是一定会出现的，因为输出的字节长度是固定的，比如 md5 的摘要输出 128位，用十六进制表示为长度为 32 位的字符串。但输入的数据长度是不固定的，有无数种输入。所以，哈希算法是把一个无限的输入集合映射到一个有限的输出集合，必然会产生碰撞。

碰撞不可怕，我们担心的不是碰撞，而是碰撞的概率，因为碰撞概率的高低关系到哈希算法的安全性。所以一个安全的哈希算法必须满足：

- 碰撞概率低；
- 不能猜测到输出：即使是规律的输入也是产生不规律的输出。

```sh
str001 => hash => 123456
str002 => hash => 123457
str003 => hash => 123458
# 假设这样的规律输入产生了规律输出，那就很容易被预测 str004 输出 123459 了。所以安全的 hash 算法的输出应该是看不出任何规律的。
str001 => hash => 123456
str002 => hash => 12agd2
str003 => hash => j209sd
str004 => hash => ???
```

根据碰撞概率，哈希算法的输出长度越长，就越难产生碰撞，也就越安全。所以 SHA 算法输出 160 位（十六进制长度40）比 MD5 输出的 128 位（十六进制长度 32）碰撞概率指数级别的差距。

### 彩虹表攻击

先看一个哈希的应用场景：系统用户登录密码的存储

如果用户注册时，直接将用户设置的密码存储到数据库，那会产生极大的安全风险，因为数据库管理员有权限可以看到用户数据表的明文密码。如果数据库数据泄漏，用户明文密码也一起泄漏了。

所以通常做法是在用户注册时，会将用户输入的原始密码复用 MD5 进行哈希计算，数据库存入密码的 hash 值。当用户登录时，将登录密码进行同样的 MD5 哈希计算，与数据存储的 hash 值比较是否一致。

这样的操作，数据库管理员看不到用户密码，即使数据库数据泄漏，拿到 hash 值也无法倒推用户密码。

如果拿到 MD5 算法的 hash 值要反推密码，只有使用暴力穷举。但暴力穷举会消耗大量的算力和时间。但是，如果有一个预先计算好的常用密码和它们的MD5的对照表，就能一下子匹配出密码。

```
常用密码值  对应 MD5 算法的 hash 值
123456	  e10adc3949ba59abbe56e057f20f883e
password	5f4dcc3b5aa765d61d8327deb882cf99
hello123	f30aa7a662c728b7407c54ae6bfd27d1
19700101	570da6d5277a646f6552b8832012f5dc
…	…
20201231	6879c0ae9117b50074ce0a0d4c843060
```

这个表就称为**彩虹表**

这就是为什么不要使用常用密码，以及不要使用生日作为密码的原因。

那对抗彩虹表攻击的常用手段就是，对每个密码添加额外的随机数后再进行 hash 计算。这个方法称为加盐，这个随机数称为盐值 salt。

```js
import { createHash, getRandomValues } from "node:crypto"

// 假设密码为 123456
const pwd = "123456"

// 创建一个4个字节长度的存储随机数的容器
const arr = new Uint8Array(4)
// 用随机数填充
getRandomValues(arr)
// 将该随机数组转换为十六进制字符串
const salt = Array.from(arr, (byte) => byte.toString(16).padStart(2, "0")).join(
  ""
)
console.log("🚀 ~ salt:", salt) // 7f2de376

// 将密码和盐值组合
const token = pwd + salt

const hash = createHash("sha256")
hash.update(token)
const secret = hash.digest("hex")
console.log("🚀 ~ secret:", secret) // 27aa1a7fd50490d1635214df053692b08804de52a0f5ff4d070fb4944ad90a8e
```

经过加盐处理的密码存储，需要将盐值 salt 和 hash 值一起进行存储。这样只要存有盐值的数据库不泄漏，即使黑客使用常用的密码值进行 MD5 算法后的 hash 值埋恶意登录也不能成功。

## HMAC

要认识 HMAC 前，先认识 MAC。

### MAC

消息认证码（Message Authentication Code，简称 MAC），是密码学中的一个关键概念，主要用于确保信息在传输或存储过程中的完整性，同时提供对信息来源的身份验证。这是一种防止信息在未经授权的情况下被篡改的重要手段。

MAC 算法的核心在于它采用了一种特定的加密方式，这种方式依赖于一个只有通信双方知道的密钥。这意味着，即使攻击者能够截获到传输的信息，只要他们没有这个密钥，就无法生成有效的 MAC 值，也无法对信息进行篡改而不被发现。

### HMAC

HMac，全称 Hash-based Message Authentication Code，是一种基于哈希函数和密钥的实现 MAC（消息认证码）的算法。结合哈希函数的不可逆性和密钥的保密性，提供更高的安全性和防抵赖性，防止消息被篡改或伪造。常用于网络通信中的消息认证、数字签名、API认证等领域。

基本工作原理：

1. 密钥处理：

- Hmac 算法首先会对密钥 key 进行处理，以确保其长度符合算法的要求。通常，密钥会被填充至64字节（512位）的长度。
- 如果密钥长度小于64字节，算法会在密钥的末尾填充0，直到达到所需的长度。
- 如果密钥长度大于64字节，算法会使用传入的算法 algorithm 对密钥 key 进行哈希处理，得到一个固定长度（MD5 是128位16字节，sha算法是160位20字节）的哈希值，然后将其作为实际的密钥使用。

2. 密钥划分：

- 经过处理的密钥会被划分为两个等长的子密钥，分别称为 K1 和 K2。
- 如果密钥是原始密钥的哈希值（16字节），则K1是原始密钥与ipad（一个特定的常量）的逐位异或结果，K2是原始密钥与 opad（另一个特定的常量）的逐位异或结果。

3. 消息处理：

- 消息在进行哈希之前，通常会被划分为多个块，每个块的大小与传入的 algorithm 算法的输入块大小相同（64字节512位）。
- 对于最后一个可能不足64字节的块，需要按照特定的方式进行填充，以确保其长度达到64字节。填充的内容包括一个“1”、多个“0”以及原始消息的长度（以64位二进制数表示）。

4. 哈希计算：

- 对于每个消息块，算法会将其与子密钥 K1 一起作为输入，计算出一个中间哈希值。这是通过将 K1 附加到消息块的前面或后面，并对整个输入应用传入的 algorithm 算法来实现 hash 。
- 然后，算法会取所有中间哈希值的串联（对于多个消息块的情况），与子密钥 K2一起作为输入，进行另一次指定算法的哈希计算。最终得到的哈希值就是消息的认证码。

### API

- `crypto.createHmac(algorithm, key[, options]): Hmac` 创建一个哈希对象
  - algorithm: 指定要使用的哈希算法，比如 'md5', 'sha256' 等
  - key: 用于生成加密 HMAC 哈希的密钥，可以是字符串或 keyObject。
  - options
    - encoding: 当 key 是字符串，指定字符串编码
- Hash 类
  - `hmac.update(data[, inputEncoding])` 使用给定的 data 更新哈希内容，其编码在 inputEncoding 中给出。如果未提供 encoding，且 data 是字符串，则强制为 'utf8' 编码。如果 data 是 Buffer、TypedArray 或 DataView，则忽略 inputEncoding。
  - `hmac.digest([encoding])` 计算当前哈希对象内部数据的摘要，返回哈希值。可以通过 encoding 指定编码返回字符串，否则返回 buffer 对象。一旦调用该方法，该 hash 对象不能再次使用了，多次调用会报错。
- key 密钥生成的工具函数
  - `crypto.generateKey(type, options, callback)`
  - `crypto.generateKeySync(type, options)`
    - type: 接受值 'hamc' 和 'aes'，当前应为 hmac
    - options
      - length: 要生成密钥的位长度
        - 如果是 `type='hmac'`，则最小长度为8，最大长度为 231-1。如果该值不是 8 的倍数，则生成的密钥将被截断为 `Math.floor(length / 8)`。
        - 如果 `type='aes'`，则长度必须是 128、192 或 256 之一。

```js
import { createHmac, generateKeySync } from "node:crypto"

// 要保护的数据
const message = "Hello, world!"

// 为了保证安全，我们不会自己指定key，而是通过 crypto 提供的 generateKey 生成一个安全的随机的 key。该方法有同步 generateKeySync(type, options)  和异步 crypto.generateKey(type, options, callback) 调用，返回一个 KeyObject 对象。
const key = generateKeySync("hmac", { length: 512 })
console.log("🚀 ~ key:", key.export().toString("hex"))
// 96a24a29ac19460b86dd78da581371d0aa3a5c8ba61b998182facc343f01497b2cc49b9c6526fe29b7ec0b42c7203a7d911930986514aebb471728ea845c4e07

// 创建HMAC实例
const hmac = createHmac("sha256", key)

// 更新HMAC实例的数据
hmac.update(message)

// 输出HMAC的hex表示形式
const mac = hmac.digest("hex")

console.log(`The HMAC is: ${mac}`)
// b9ad441cc8b6f8a4c5c90002869da6cf6fe0966ef881d10b991b4a754bda0611
```

通过上述例子，HMAC 可以看作是带有一个安全 salt 值的 Hash 算法。但推荐使用 HMAC 而推荐自己盐计算，主要在于：

- HMAC 使用的 key 长度是 64字节510位，更安全；
- HMAC 是标准算法，适用于对应的哈希算法；
- HMAC 输出和对应算法的哈希结果长度一致。

MD5 和 SHA1 算法近年来报告了一些安全性问题，特别是关于其潜在的碰撞性攻击风险。虽然在实际应用中尚未出现成功的攻击案例，但为了安全起见，许多组织已经开始逐步不再使用 MD5和SHA-1，转向使用更安全的哈希算法和mac 结合，比如推荐的如 HMAC-SHA256。

### 应用场景

哈希算法的目的就是为了验证原始数据是否被篡改，因此 hash 算法主要用于：加密、数据检验、版本标识、文件指纹、负载均衡、分布式（一致性 hash）。

> 指纹（Fingerprint）是一种通过将整个证书内容运行通过哈希函数生成的短字符串，可以用于快速比较证书是否相同或验证证书的真伪。因为即使是很小的改变也会导致完全不同的哈希值，所以指纹能有效地表示证书的唯一性。

示例：文件指纹

你有一个文件下载服务，你可以为每个文件创建一个 Hmac，并将这个 Hmac 与文件一起提供给用户。用户在下载文件后，可以使用相同的密钥和方法来验证文件是否完整未经篡改。

```js
const fs = require("fs")

// 当文件被创建或更新时计算Hmac
const fileBuffer = fs.readFileSync("path-to-file")
const secretKey = "文件的密钥"
const hmac = crypto.createHmac("sha256", secretKey)
hmac.update(fileBuffer)
const fileSignature = hmac.digest("hex")
// 存储fileSignature供以后验证使用

// 用户下载文件之后进行验证
const downloadedFileBuffer = fs.readFileSync("path-to-downloaded-file")
const hmacForVerification = crypto.createHmac("sha256", secretKey)
hmacForVerification.update(downloadedFileBuffer)
const downloadedFileSignature = hmacForVerification.digest("hex")

if (downloadedFileSignature === fileSignature) {
  console.log("文件验证成功，文件是完整的！")
} else {
  console.log("文件验证失败，文件可能被篡改！")
}
```

示例：数据校验

假设你正在开发一个 Web 服务，客户端发送请求时需要验证身份。你可以为每个用户生成一个密钥，并使用这个密钥对请求进行 Hmac 签名。

```js
// 客户端
const message = "用户的某些数据"
const secretKey = "用户独有的密钥"
const hmac = crypto.createHmac("sha256", secretKey)
hmac.update(message)
const signature = hmac.digest("hex")
// 将signature随请求发送到服务器

// 服务器
// 服务器接收到请求和签名后，使用相同的密钥和哈希算法验证签名是否匹配
const receivedMessage = "用户的某些数据" // 从请求中获得
const receivedSignature = "来自客户端的签名" // 从请求中获得
const hmacForVerification = crypto.createHmac("sha256", secretKey)
hmacForVerification.update(receivedMessage)
const verificationSignature = hmacForVerification.digest("hex")

if (verificationSignature === receivedSignature) {
  console.log("验证成功，消息是真实的！")
} else {
  console.log("验证失败，消息可能被篡改！")
}
```

## 加密和解密

有很多场景下，数据需要加密存储，并且需要解密后进行使用。这和前面不可逆的哈希函数不同。此类算法细分为对称加密和非对称加密

### 对称加密（Symmetric Encryption）

对称加密指加密和解密使用同一个密钥的加密方式。

- 优点：加密计算量小、速度块，适合对大量数据进行加密的场景。
- 缺点：存在密钥传输问题和密钥管理问题。速度快，安全性不高。
- 常见的对称加密算法
  - DES，数据加密标准（Data Encryption Standard），1972 年由美国 IBM 公司研制，1977 年被美国政府采纳为加密标准。
  - DEA，数据加密算法（Data Encryption Algorithm），DES 所使用的算法。
  - 3DES 或 Triple DES，三重数据加密算法，1981 年公布，是 DES 算法向 AES 算法过渡的加密算法。
  - IDEA，国际数据加密算法（International Data Encryption Algorithm），1990 年由 Xuejia Lai（来学嘉）和 James Massey 提出。在 DES 算法的基础上发展出来的，类似于 3DES。
  - **AES，高级加密标准（Advanced Encryption Standard），2001 年由美国国家标准与技术研究院（NIST）发布。**使用固定长度的块来加密和解密数据，这些固定长度可以是 128、192 或 256 位。密钥的长度决定了加密的强度：密钥越长，安全性越高。
  - Rijndael，AES 所使用的加密算法，由 Vincent Rijmen 和 Joan Daemen 开发。
  - RC4，Rivest Cipher 4，1987 年由 Ronald L. Rivest 提出的一种流加密算法，属于对称加密算法。
  - RC5，1994 年提出的分组密码算法。
  - RC6，一种新的分组密码算法，是 AES 的候选算法（最终采纳的是 Rijndael 算法）。
  - Rabbit，Rabbit Stream Cipher，流加密算法，由 Cryptico 公司在 2003 年设计发布。
  - Blowfish，分组密码算法，1993 年由 Bruce Schneider 设计，用于替代 DES，属于对称加密算法。
- 工作过程：发送方使用密钥将明文数据加密成密文，然后发送出去，接收方收到密文后，使用同一个密钥将密文解密成明文读取。

Nodejs 提供了 Cipher 类和 Decipher 类，分别用于加密和解密。两者都继承 Transfrom Stream，API 的使用方法和哈希函数的 API 使用方法类似。

```js
// 查看 nodejs 的 crypto 模块支持的非对称加密算法
crypto.getCiphers()
```

#### API

- `crypto.getCiphers()`
- `crypto.createCipher(algorithm, password[, options])` 已废弃，使用 createCipheriv 替代
- `crypto.createDecipher(algorithm, password[, options])` 已废弃，使用 createDecipheriv 替代
- `crypto.createCipheriv(algorithm, key, iv[, options])`
- `crypto.createDecipheriv(algorithm, key, iv[, options])`
  - algorithm: 算法，这指的是加密算法，例如 AES、DES 等，它定义了如何对数据进行加密。
  - key: 密钥，对称加密和解密时使用相同的秘密字节序列，通常由密码或其他机制生成。
  - iv: 初始化向量，一个随机的字节序列，用于配合密钥提供加密算法的初始状态。
  - options: 选项对象，可以提供额外的配置选项，例如输出编码格式等。
- key 密钥生成的工具函数
  - `crypto.generateKey(type, options, callback)` 生成密钥
  - `crypto.generateKeySync(type, options)`
    - type: 接受值 'hamc' 和 'aes'，当前应为 aes
    - options
      - length: 要生成密钥的位长度
        - 如果是 `type='hmac'`，则最小长度为8，最大长度为 231-1。如果该值不是 8 的倍数，则生成的密钥将被截断为 `Math.floor(length / 8)`。
        - 如果 `type='aes'`，则长度必须是 128、192 或 256 之一。

> "iv" 是指初始化向量(Initialization Vector)，它是一个随机的字节序列，用于配合密钥提供加密算法的初始状态。是一种在加密过程中使用的数据块，与密钥(key)一起用来确保即使相同的数据被加密多次，每次生成的加密文本都不相同，增强了加密的安全性。

```js
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
```

### 非对称加密（Asymmetric Encryption）

非对称加密算法，也称为“公开密钥加密算法”，是指加密密钥和解密密钥完全不同，其中一个为公钥，另一个为私钥，并且不可能从任何一个推导出另一个。

- 私钥：是一个秘密数字，只能由密钥所有者知道。
- 公钥：通过特定的数学运算与私钥相关联，可以安全地公开，用于验证由私钥创建的签名。

公开密钥与私有密钥是一对，如果用公开密钥对数据进行加密，只有用对应的私有密钥才能解密；如果用私有密钥对数据进行加密，那么只有用对应的公开密钥才能解密。因为加密和解密使用的是两个不同的密钥，所以这种算法叫作非对称加密算法。

- 优点：安全性高
- 缺点：加密与解密速度慢
- 常见的非对称加密算法
  - **RSA 加密算法，1977 年由 Ronald L. Rivest、Adi Shamir 和 Leonard Adleman 提出，RSA 即三人姓氏（未尾单词）首字母。**
  - Diffie-Hellman 或 DH，1976 年 Whitfield Diffie 和 Martin Hellman 提出一种密钥交换协议，被称为 Diffie-Hellman 密钥交换协议（Diffie-Hellman Key Exchange），使用的算法被称为 Diffie-Hellman 算法。
  - ECC，椭圆曲线加密算法（Elliptic Curve Cryptography），1985 年由 Neal Koblitz 和 Victor Miller 提出。
  - ECDH，全称 Elliptic Curve Diffie-Hellman，即椭圆曲线 Diffie-Hellman 密钥交换算法，是 Diffie-Hellman 算法的一种变体，它基于椭圆曲线离散对数问题（ECDLP），这是一个计算上难以解决的数学问题。与传统的Diffie-Hellman协议相比，ECDH提供了更高的安全性，同时使用更短的密钥长度。使得ECDH在资源受限的环境中（如移动设备和物联网设备）特别受欢迎。
  - DSS，数字签名标准（Digital Signature Standard），1991 年美国国家标准与技术研究院（NIST）提出。
  - DSA，数字签名算法（Digital Signature Algorithm），Schnorr 和 ElGamal 签名算法的变种。

#### RSA

RSA 是建立在求解大数因子这一数学难题的基础上的：把两个质数相乘很快，比如说17 \* 23 = 391，但是很难算出是哪两个质数相乘能得到14351(113x127是参考答案)。

基本工作过程

1. A 要向 B 发送信息，A 和 B 都要产生一对用于加密和解密的公钥和私钥。
2. A 的私钥保密，A 的公钥告诉 B；B 的私钥保密，B 的公钥告诉 A。
3. A 要给 B 发送信息时，A 用 B 的公钥加密信息，因为 A 知道 B 的公钥。
4. A 将这个消息发给 B（已经用 B 的公钥加密消息）。
5. B 收到这个消息后，B 用自己的私钥解密 A 的消息，其他所有收到这个报文的人都无法解密，因为只有 B 才有 B 的私钥。
6. 反过来，B 向 A 发送消息也是一样。

#### Diffie-HellmanD 密钥交换

密钥交换允许2个人或者团体在没有其他窥探者能获得这些密钥的情况下建立一组通用的加密密钥，通常情况下建立的是公共对称密钥。

基本原理分为三个阶段：

- 密钥生成：每个通信方都有一对密钥，包括一个公钥和一个私钥。公钥可以公开分享，而私钥则必须保密。
- 协商阶段：通信双方通过互相交换各自的公钥，并使用对方的公钥和自己的私钥生成一个共享的对称密钥。
- 密钥派生：通过一系列算法，通信双方使用协商得到的共享密钥生成用于加密通信的对称密钥。

基本工作过程

1. 丽丝和鲍勃两人想要进行一个安全的谈话，他们想要建立一个公共密钥，他们可以使用对称加密的方式，但是他们又不想使用非对称加密的形式进行密钥交换，此时 DH 密钥交换就有了用武之地。
1. 爱丽丝和鲍勃都有自己的秘密，我们称之为 A 和 B，同时他们也有一些公共的资料，我们称之为 C。
1. 我们需要预先做一些假设：无论何时我们所结合的秘密或资料都不可能分离或者很难分离，其次，它们进行结合时的组合顺序并不重要。
1. 然后爱丽丝和鲍勃将他们各自的秘密与共同的资料相结合，并形成 AC 和 BC，接着他们再把结合后的信息发送给对方，并把这些信息和他们各自的秘密再次结合起来，此时就形成两个完全相同的密钥： ABC。
1. 完成以上过程之后，他们就可以用ABC这个密钥进行交流了。

DH 密钥交换通常与 RSA 公钥加密一起使用，同时还可以用数字签名验证证明对方的身份，这样做可以防止有人假装自己是鲍勃：使用中间人攻击的方式攻击会话连接 。

```js
// 包含支持的椭圆曲线名称的数组。
crypto.getCurves()

// 获取支持的 Diffie-Hellman 密钥交换协议，groupName 可用值为：
// 'modp14'（2048 位，RFC 3526 第 3 节）
// 'modp15'（3072 位，RFC 3526 第 4 节）
// 'modp16'（4096 位，RFC 3526 第 5 节）
// 'modp17'（6144 位，RFC 3526 第 6 节）
// 'modp18'（8192 位，RFC 3526 第 7 节）
crypto.getDiffieHellman(groupName)
```

#### API

- Diffie-Hellman 算法
  - `crypto.getDiffieHellman(groupName)` 创建预定义的 DiffieHellmanGroup 密钥交换对象。groupName 预设组包括 modp14 (2048位) / modp15 (3072位) / modp16 (4096位) / modp17 (6144w位) / modp18 (8192位)
  - `crypto.createDiffieHellman(primeLength[, generator])` 创建 DiffieHellman 密钥交换对象并使用可选的特定数字 generator 生成 primeLength 位的质数。如果未指定 generator，则使用值 2。
  - `crypto.createDiffieHellman(prime[, primeEncoding][, generator][, generatorEncoding])` 使用提供的 prime 和可选的特定 generator 创建 DiffieHellman 密钥交换对象。如果 prime 和 generator 是字符串，那么应该通过 primeEncoding / generatorEncoding 指定对应的编码格式。
  - `crypto.createDiffieHellmanGroup(name)` getDiffieHellman 方法的别名，一样的效果，返回一个 dh 对象。
  - `crypto.diffieHellman(options)` 基于 privateKey 和 publicKey 计算 Diffie-Hellman 秘密。两个密钥必须具有相同的 asymmetricKeyType，它必须是 'dh'（对于 Diffie-Hellman）、'ec'（对于 ECDH）、'x448' 或 'x25519'（对于 ECDH-ES）之一。
  - `crypto.generatePrime(size[, options[, callback]])` 生成 size 位的伪随机素数(质数)
  - `crypto.generatePrimeSync(size[, options])` 同步方法，生成 size 位的伪随机素数
  - `crypto.checkPrime(candidate[, options], callback)` 检查入参 candidate 是不是质数（只能被 1 和它自身整除的大于 1 的整数）。
  - `crypto.checkPrimeSync(candidate[, options])` 同步方法，检查入参 candidate 是不是质数。
- 类 DiffieHellman 实例方法
  - `diffieHellman.computeSecret(otherPublicKey[, inputEncoding][, outputEncoding])` 使用 otherPublicKey 作为对方的公钥计算共享密钥，并返回计算出的共享密钥。如果公钥是字符串，应指定它的编码 inputEncoding，如果未提供 inputEncoding，则 otherPublicKey 应为 Buffer、TypedArray 或 DataView。如果给定 outputEncoding，则返回一个字符串；否则，返回 Buffer。
  - `diffieHellman.generateKeys([encoding])` 生成私有和公共密钥值，并返回指定 encoding 中的公共密钥。返回的公钥应转让给另一方的 computeSecret 方法的实参。如果提供了 encoding，则返回一个字符串；否则返回 Buffer。
  - `diffieHellman.getPrivateKey([encoding])` 返回当前 DH 实例已生成的私钥，如果提供了 encoding，则返回一个字符串；否则返回 Buffer。
  - `diffieHellman.getPublicKey([encoding])` 返回当前 DH 实例已生成的公钥，如果提供了 encoding，则返回一个字符串；否则返回 Buffer。
  - `diffieHellman.getGenerator([encoding])` 返回公共基数，如果提供了 encoding，则返回一个字符串；否则返回 Buffer。
  - `diffieHellman.getPrime([encoding])` 返回质数，如果提供了 encoding，则返回一个字符串；否则返回 Buffer。
  - `diffieHellman.setPrivateKey(privateKey[, encoding])` 手动设置 DH 对象的私钥。比如通过 openssl 生成密钥对中的私钥。这样的话，就不会像 generateKey 函数一样自动关联公钥了，必须也手动设置对应的公钥。
  - `diffieHellman.setPublicKey(publicKey[, encoding])` 手动设置 DH 对象的公钥。比如通过 openssl 生成密钥对中的公钥。
  - `diffieHellman.verifyError` DH 实例初始化期有错误，可以通过该属性返回的错误常量值判断。在 `node:constants` 定义的常量 DH_CHECK_P_NOT_SAFE_PRIME、DH_CHECK_P_NOT_PRIME、DH_UNABLE_TO_CHECK_GENERATOR、DH_NOT_SUITABLE_GENERATOR
- ECDH 算法
  - `crypto.getCurves()` 获取可用曲线名称的列表
  - `crypto.createECDH(curveName)`
- 类 ECDH 实例方法，作用同上面 DH 实例的方法
  - 静态方法：`ECDH.convertKey(key, curve[, inputEncoding[, outputEncoding[, format]]])` 转换不同编码格式的密钥，比如将十六进制的密钥字符串转成 base64 编码密钥字符串
  - `ecdh.computeSecret(otherPublicKey[, inputEncoding][, outputEncoding])`
  - `ecdh.generateKeys([encoding[, format]])`
  - `ecdh.getPrivateKey([encoding])`
  - `ecdh.getPublicKey([encoding][, format])`
  - `ecdh.setPrivateKey(privateKey[, encoding])`

示例1：DiffieHellman 实例方法

```js
import crypto from "node:crypto"

const dh = crypto.createDiffieHellman(2048)
// 生成私有和公共 Diffie-Hellman 密钥值（除非它们已生成或计算），并返回指定 encoding 中的公共密钥
const publicKey = alice.generateKeys("hex")
console.log("🚀 ~ publicKey:", publicKey)

const privateKey = dh.getPrivateKey("hex")
const _publicKey = dh.getPublicKey("hex")
console.log("🚀 ~ privateKey:", privateKey)
console.log("🚀 ~ publicKey === _publicKey:", publicKey === _publicKey) // true

const prime = dh.getPrime("hex")
const generator = dh.getGenerator("hex")
console.log("🚀 ~ prime:", prime)
console.log("🚀 ~ generator:", generator)
```

示例2：Diffie-Hellman 密钥交换

```js
import crypto from "node:crypto"

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
```

示例3：ECDH 密钥交换

```js
const crypto = require("crypto")

// Alice 创建 ECDH 实例
const aliceECDH = crypto.createECDH("prime256v1")
// Alice 生成公私钥对
const alicePublicKey = aliceECDH.generateKeys()

// Bob 创建 ECDH 实例
const bobECDH = crypto.createECDH("prime256v1")
// Bob 生成公私钥对
const bobPublicKey = bobECDH.generateKeys()

// Alice 和 Bob 交换公钥（在真实情况下，这将通过某种形式的通信发生，例如通过互联网）
// ...

// Alice 使用 Bob 的公钥来生成共享密钥
const aliceSharedKey = aliceECDH.computeSecret(bobPublicKey)

// Bob 使用 Alice 的公钥来生成共享密钥
const bobSharedKey = bobECDH.computeSecret(alicePublicKey)

// 现在，Alice 和 Bob 都有了相同的共享密钥，并且可以用它来加密通信内容
console.log(aliceSharedKey.toString("hex") === bobSharedKey.toString("hex")) // 应该输出 true
```

## 数字签名和验证

除了不可逆的哈希算法、数据加密算法，还有专门用于签名和验证的算法。

- 数字签名用于验证消息的完整性和来源，
- 而验证则相对地确认签名是否有效。

### 应用场景

- 文件的数据签名：数字签名是证明文件真实性的一种方法，使用你的私钥对文档进行加密，如果有人想验证这个签名的真实性（该签名是否是你的签名），他们会使用你的公钥对文档进行解密，并检查文件是否匹配。。
- web证书：证书也是公钥加密的一个关键用途,证书能连接到数字签名，使用它们的一个常见地方是 HTTPS协议。
- SSH 登录：使用公钥和私钥来证明客户端是服务器上的有效授权用户。客户端生成公钥和私钥对，本地存储私钥，将公钥存储到远程服务器上。SSH 密钥对一般使用RSA算法加密。登录的时候，远程主机会向用户发送一段随机字符串，用户用自己的私钥加密后，再发回来。远程主机用事先储存的公钥进行解密，如果成功，就证明用户是可信的，直接允许登录shell，不再要求密码。

### 算法

常用的签名算法主要包括 RSA、DSA、ECDSA 等，这些算法都提供了对信息来源的确定和检测信息是否被篡改的能力。

- RSA 签名算法：
  - RSA 是目前计算机密码学中最经典的算法，也是目前使用最广泛的数字签名算法。RSA数字签名算法的密钥实现与RSA的加密算法是一样的，都使用RSA这个名称。
  - RSA 数字签名算法主要包括 MD 和 SHA 两种算法，例如我们熟知的 MD5 和 SHA-256 即是这两种算法中的一类。
- DSA 签名算法（Digital Signature Algorithm）：
  - DSA 是另一种常用的数字签名算法，它使用 ElGamal 数字签名算法。
  - DSA 只能配合SHA使用，常见的算法有 SHA1withDSA、SHA256withDSA 和 SHA512withDSA。
  - 与 RSA 数字签名相比，DSA 的优点是更快。
- ECDSA 签名算法（Elliptic Curve Digital Signature Algorithm）：
  - ECDSA 是一种基于椭圆曲线的数字签名算法，它的特点是可以从私钥推出公钥。
  - 比特币的签名算法就采用了 ECDSA 算法，使用标准椭圆曲线 secp256k1。
  - BouncyCastle 提供了 ECDSA 的完整实现。

以上算法全部为非对称加密算法，所以一般数字签名也要提供公钥和私钥对。

### API

- `crypto.createSign(algorithm[, options])：Sign` 创建并返回一个指定算法实现的签名对象 sign
- `crypto.createVerify(algorithm[, options]): Verify` 创建并返回一个指定算法实现的签名验证对象 verify
- 类：Sign
  - `sign.update(data[, inputEncoding])` 使用给定的 data 更新 sign 对象的内容，其编码在 inputEncoding 参数中指定。如果未提供 encoding，且 data 是字符串，则强制为 'utf8' 编码。如果 data 是 Buffer、TypedArray 或 DataView，则忽略 inputEncoding。
  - `sign.sign(privateKey[, outputEncoding]): signature` 使用 privateKey 计算通过 update 写入数据的签名。 Sign 对象在调用 `sign.sign()` 方法后不能再次使用。多次调用 sign.sign() 将导致抛出错误。
- 类：Verify
  - `verify.update(data[, inputEncoding])` 使用给定的 data 更新 Verify 内容，其编码在 inputEncoding 中给出。如果未提供 inputEncoding，且 data 是字符串，则强制为 'utf8' 编码。如果 data 是 Buffer、TypedArray 或 DataView，则忽略 inputEncoding。
  - `verify.verify(object, signature[, signatureEncoding]): Boolean` 使用给定的 object 和 signature 验证提供的数据是否合法。
- 快捷方法
  - `crypto.sign(algorithm, data, privateKey[, callback])`
  - `crypto.verify(algorithm, data, privateKey, signature[, callback])`
- 公钥和私钥的生成函数
  - `crypto.generateKeyPair(type, options, callback) `
  - `crypto.generateKeyPairSync(type, options)` 返回一个对象 `{ publicKey, privateKey }`
    - type：必须是 'rsa'、'rsa-pss'、'dsa'、'ec'、'ed25519'、'ed448'、'x25519'、'x448' 或 'dh' 之一。
    - options: 对象，根据指定的 type 值有不同的选项，具体见 [generateKeyPairSync](https://nodejs.cn/api/crypto.html#cryptogeneratekeypairsynctype-options)

```js
import crypto from "node:crypto"

// 生成公钥和私钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048, // 以位为单位的密钥大小，适用于 RSA、DSA 。
})

// 模拟消息数据，或者读取的文件内容
const data = "data to sign"

// 签名
const signer = crypto.createSign("sha256")
signer.update(data)
const signature = signer.sign(privateKey, "hex")
console.log("🚀 ~ signature:", signature) // 2447c5f03144cd33e5a655...

// 验证签名
const verifier = crypto.createVerify("sha256")
verifier.update(data)
const verified = verifier.verify(publicKey, signature, "hex")

console.log(`Signature Verified: ${verified}`) // true
```

## 密钥格式的转化

- `KeyObject.from(key)` 将 CryptoKey (web crypto 生成的 key) 实例转换为 KeyObject（node:crypto 模块使用的 key 对象）：
- `crypto.createSecretKey(key[, encoding])：KeyObject` 通过 key 创建并返回新的密钥对象，可用于对称加密或 Hmac 的密钥，key 可以是字符串、buffer 等。encoding 为密钥对象 keyObject 转成字符串输出的编码
- `crypto.createPrivateKey(key)` 通过 key 创建并返回包含私钥的新密钥对象。如果 key 是字符串或 Buffer，则假定 format 为 'pem'；否则，key 必须是具有上述属性的对象。如果私钥被加密，则必须指定 passphrase。密码的长度限制为 1024 字节。
- `crypto.createPublicKey(key)` 通过 key 创建并返回包含公钥的新密钥对象。如果 key 是字符串或 Buffer，则假定 format 为 'pem'；如果 key 是类型为 'private' 的 KeyObject，则公钥是从给定的私钥派生的；否则，key 必须是具有上述属性的对象。
- `crypto.privateEncrypt(privateKey, buffer)` 用 privateKey 加密 buffer。返回的数据可以使用相应的公钥解密，比如通过 `crypto.publicDecrypt`
- `crypto.privateDecrypt(privateKey, buffer)` 用 privateKey 解密 buffer。buffer 是之前通过 `crypto.publicEncrypt` 公钥加密的数据。
- `crypto.publicDecrypt(key, buffer)` 使用 publicKey 解密之前通过私钥加密的 buffer
- `crypto.publicEncrypt(key, buffer)` 使用 publicKey 加密 buffer 数据，返回的数据可以使用 privateDecrypt 方法解密
- `crypto.scrypt(password, salt, keylen[, options], callback)` Scrypt 是一个基于密码的密钥派生函数，其设计在计算和内存方面都非常昂贵，以使蛮力攻击毫无回报。
- `crypto.scryptSync(password, salt, keylen[, options])` 同步实现

示例1：生成可用的公钥和私钥

方式一：可以使用本地的 openssl openssl 生成的私钥和公钥文本。

```sh
# 生成 rsa 私钥
openssl genrsa -out rsa_private_key.pem 2048
# 用上面的私钥，生成公钥
openssl rsa -in rsa_private_key.pem -pubout -out rsa_public_key.pem
```

也可以直接使用 `crypto.generateKeyPairSync` 方法生成，nodejs 的 crypto 底层也是集成了 openssl。

```js
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
fs.writeFileSync(
  path.join(__dirname, "./secret/rsa_private_key.pem"),
  privateKey.export({ type: "pkcs1", format: "pem" }),
  { encoding: "utf8" }
)
fs.writeFileSync(
  path.join(__dirname, "./secret/rsa_public_key.pem"),
  publicKey.export({ type: "spki", format: "pem" }),
  { encoding: "utf8" }
)
```

输出的文件内容如下：

公钥文件

```
-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDI6d306Q8fIfCOaTXyiUeJHkrIvYISRcc73s3vF1ZT7XN8RNPwJxo8pWaJMmvyTn9N4HQ632qJBVHf8sxHi/fEsraprwCtzvzQETrNRwVxLO5jVmRGi60j8Ue1efIlzPXV9je9mkjzOmdssymZkh2QhUrCmZYI/FCEa3/cNMW0QIDAQAB
-----END PUBLIC KEY-----
```

私钥文件

```
-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQC+L0rfjLl3neHleNMOsYTW8r0QXZ5RVb2p/vvY3fJNNugvJ7lo4+fdBz+LN4mDxTz4MTOhi5e2yeAqx+v3nKpNmPzC5LmDjhHZURhwbqFtIpZD51mOfno2c3MDwlrsVi6mTypbNu4uaQzw/TOpwufSLWF7k6p2pLoVmmqJzQiD0QIDAQABAoGAakB1risquv9D4zX7hCv9MTFwGyKSfpJOYhkIjwKAik7wrNeeqFEbisqv35FpjGq3Q1oJpGkem4pxaLVEyZOHONefZ9MGVChT/MNH5b0FJYWl392RZy8KCdq376Vt4gKVlABvaV1DkapL+nLh7LMo/bENudARsxD55IGObMU19lkCQQDwHmzWPMHfc3kdY6AqiLrOss+MVIAhQqZOHhDe0aW2gZtwiWeYK1wB/fRxJ5esk1sScOWgzvCN/oGJLhU3kipHAkEAysNoSdG2oWADxlIt4W9kUiiiqNgimHGMHPwp4JMxupHMTm7D9XtGUIiDijZxunHv3kvktNfWj3Yji0661zHVJwJBAM8TDf077F4NsVc9AXVs8N0sq3xzqwQD/HPFzfq6hdR8tVY5yRMb4X7+SX4EDPORKKsgnYcur5lk8MUi7r072iUCQQC8xQvUne+fcdpRyrR4StJlQvucogwjTKMbYRBDygXkIlTJOIorgudFlrKP/HwJDoY4uQNl8gQJb/1LdrKwIe7FAkBl0TNtfodGrDXBHwBgtN/t3pyi+sz7OpJdUklKE7zMSBuLd1E3O4JMzvWP9wEE7JDb+brjgK4/cxxUHUTkk592
-----END RSA PRIVATE KEY-----
```

示例2：读取本地 pem 文件，并转成 keyObject 对象。如果是通过 `crypto.generateKeyPairSync` 方法生成，可以直接使用返回的 keyObject 对象。

```js
import crypto from "node:crypto"
import fs from "node:fs"

// 确定密钥文件的路径
const privateKeyPath = "/path/to/your/secret/rsa_private_key.pem"
// 同步地读取文件内容
const privatePem = fs.readFileSync(privateKeyPath, "utf8")
// 创建一个私钥对象，如果 key 是字符串或 Buffer，则假定 format 为 'pem'；
const privateKey = crypto.createPrivateKey(privatePem)

const publicKeyPath = "/path/to/your/secret/rsa_public_key.pem"
const publicPem = fs.readFileSync(publicKeyPath, "utf8")

// 创建公钥对象，另一种方式是使用对象形式入参，指明 key, format 属性。如果 key 是字符串，还需要通过 encoding 指定当前字符串编码
const publicKey = crypto.createPublicKey({
  key: publicPem,
  format: "pem",
})
```

示例3：公钥加密和解密 publicEncrypt / privateDecrypt

如果数据是用公钥加密 publicEncrypt，则解密时需要使用 privateDecrypt 方法并入参对应的私钥。

```js
// Alice 想给 Bob 发送的消息
let message = "Hello, Bob!"

// Alice 使用 Bob 的公钥加密消息
const encryptedMessage = crypto.publicEncrypt(publicKey, Buffer.from(message))

// 现在 Bob 接收到已经加密过的数据，并使用自己的私钥来解密消息
const decryptedMessage = crypto.privateDecrypt(privateKey, encryptedMessage)

// 将解密后的Buffer转换回字符串，以得到原始消息
console.log(decryptedMessage.toString()) // 输出: 'Hello, Bob!'
```

示例4：私钥加密和解密 privateEncrypt / publicDecrypt

如果数据是用私钥加密 privateEncrypt，则解密时需要使用 publicDecrypt 方法并入参对应的公钥。

```js
// Alice 想给 Bob 发送的消息
const message = "Hello, Bob!"

//  将消息转换成Buffer
const bufferMessage = Buffer.from(message, "utf8")

// Alice 使用自己的私钥加密消息
const encryptedMessage = crypto.privateEncrypt(privateKey, bufferMessage)

// Bob 接家到加密的消息后，使用 Alice 的公钥解密数据
const decryptedMessage = crypto.publicDecrypt(publicKey, encryptedMessage)

// 打印解密后的消息
console.log(decryptedMessage.toString("utf8")) // Hello, Bob!
```

## 安全随机数

> [阮一峰周刊：随机数，这是一个问题](https://mp.weixin.qq.com/s/8HQErnpHyZlCj7uy_ucJbA)

- `crypto.getRandomValues(typedArray)` web crypto 中 getgetRandomValues 快捷方式，相对 randomBytes 方法使用上更繁琐。
- `crypto.randomBytes(size[, callback])` 生成加密强伪随机数据。size 参数是数字，指示要生成的字节数。
- `crypto.randomFill(buffer[, offset][, size], callback)` 此函数类似于 crypto.randomBytes()，但要求第一个参数是将被填充的 Buffer。它还要求传入回调。
- `crypto.randomFillSync(buffer[, offset][, size])` 同步实现
- `crypto.randomInt([min, ]max[, callback])` 返回随机整数 n，使得 min <= n < max。
- `crypto.randomUUID([options])` 生成一个随机的 RFC 4122 版本 4 UUID。UUID 是使用加密伪随机数生成器生成的。options.disableEntropyCache 默认情况下，为了提高性能，Node.js 会生成并缓存足够多的随机数据，以生成多达 128 个随机 UUID。要在不使用缓存的情况下生成 UUID，请将 disableEntropyCache 设置为 true。默认值：false。

```js
import crypto from "node:crypto"

/*************************************
 * randomBytes
 *************************************/
const size = 32 // 例如，AES-256 需要32字节的密钥
crypto.randomBytes(size, function (err, keyBuffer) {
  const key = keyBuffer.toString("hex")
  console.log(`Encryption key: ${key}`) // 6449df0b8e7889914d5a3474e00d9fbefed6448eec5b5ba266f6953753ef4a4
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
```

## 常见的加密单词

- Plaintext：明文，加密前的数据，通常是文本，但也可能是照片或其他文件。
- Ciphertext ：密文，加密明文、加密数据的结果
- Cipher：加密法，加密或解密数据的一种方法。现代密码是加密的，但也有许多非加密的密码，如凯撒密码。
- Encryption：加密，用密码把数据转换成密文。
- Encoding：编码，不是一种加密形式，只是一种数据表示形式 例如 base64。
- Key：密钥，正确解密密文和获取明文所需的一些信息。
- Passphrase：口令（密码短语），与密钥分开，口令与密码类似，都能用于保护密钥。
- Asymmetric encryption：非对称加密，使用不同的密钥进行加密和解密。
- Symmetric encryption：对称加密，使用相同的密钥进行加密和解密
- Brute force：暴力破解，通过尝试每个不同的密码或每个不同的密钥来攻击加密
- Cryptanalysis：密码分析，通过发现基础数学的弱点来攻击密码学（通过发现基数的弱点来攻击密码加密技术）
- Alice and Bob（国外常用）通常用来代表两个想要交流的人，他们被命名为爱丽丝和鲍勃，因为他们的首字母分别是 A 和 B。延伸开来也可以通过字母表上的其他字母，来代表许多不同的人参与交流
- TLS 全称“传输层安全性协议（Transport Layer Security）”，SSL 全称“安全套接字层协议（Secure Sockets Layer）”。SSL 最初由网景公司（Netscape）设计开发，后 IETF 将 SSL 标准化为 TLS，它是 HTTPS 的基础。
- OpenSSL 是一个开源的 TLS/SSL 协议工具包，同时除了实现 TLS/SSL 协议（libssl），还提供通用的密码学算法库（libcrypto）和命令行工具（openssl），可以使用命令行生成公钥和私钥对。

> 口令和密码的区别
>
> 当你输入一串字符，如果不经过任何处理直接送到服务器来验证，它一定不是密码，只是一个口令
>
> 如果输进去的字符，通过密码运算得出另外一个结果，当这个结果可以验证你是否是合法的用户时，这个口令就变成了密码

## 安全性

nodejs 的 crypto 模块由于兼容低版本，仍然支持一些已经被泄露的算法，但现在这些算法已经不建议使用。

基于 NIST SP 800-131A 的建议：

- MD5 和 SHA-1 在需要抗冲突性（例如数字签名）的情况下不再被接受。
- RSA、DSA 和 DH 算法使用的密钥建议至少 2048 位，ECDSA 和 ECDH 的曲线至少 224 位，才能安全使用几年。
- modp1、modp2、modp5 的 DH 组密钥长度小于 2048 位，不推荐使用。

有关其他建议和详细信息，请参阅参考资料。一些已知弱点且在实践中几乎没有相关性的算法只能通过 旧版提供器 获得，默认情况下不启用。

## 延伸知识

- [crypto 101](https://www.crypto101.io/)
- [密码学 101](https://github.com/terwer/crypto101-cn)
