# Web Crypto

> [SubtleCrypto](https://developer.mozilla.org/zh-CN/docs/Web/API/SubtleCrypto)

web crypto 模块是 nodejs 基于浏览器端的 web crypto 标准实现的加密功能。

## Crypto => Crypto.subtle

有些浏览器实现了叫作 Crypto 的接口，但是它缺乏良好的定义，或在密码学上是不健全的。为了避免混乱，这个接口的方法和属性已经被浏览器所移除，并且所有的 Web Crypto API 方法都可以在新的接口中使用：SubtleCrypto。

Crypto.subtle 属性可以获取到一个实现了新接口的 SubtleCrypto 对象，它可以进行低级的加密和解密功能。

主要提供如下函数：

- digest()：生成某些数据的定长、防碰撞的消息摘要，类似 nodejs 原生模块 crypto 中的 hash 函数。
- encrypt() 和 decrypt()：加密和解密数据。根据指定的算法入参，可以执行对称加解密和非对称加解密。
- sign() 和 verify()：创建和验证数字签名。

## 算法

Web Crypto API 提供的加密函数可以由一个或多个不同的加密算法执行，函数可以通过 algorithm 参数来指定使用的算法。

如果一些算法需要额外的参数，在这些情况下可以将 algorithm 参数作为对象字典传入额外的参数。

下表总结了哪些算法适用于哪些加密操作：

- 摘要 digest: SHA-1 SHA-256 SHA-384 SHA-512
- 数据签名和验证 sign/verify: RSASSA-PKCS1-v1_5 / RSA-PSS / ECDSA / HMAC
- 加密和解密 encrypt/decrypt:
  - 对称算法：AES-CTR / AES-CBC / AES-GCM
  - 非对称算法：RSA-OAEP
  - 基于安全的椭圆曲线的加密算法：Ed25519 / Ed448 / X25519 / X448

名词解释：

- AES: 高级加密标准(Advanced Encryption Standard)，一种广泛使用的对称加密算法。对称加密意味着加密和解密都使用同一个密钥。
- CBC: 密码块链接模式(Cipher Block Chaining)，一种操作模式，在这种模式下，每个明文块先与前一个密文块进行异或后，再进行加密。首个块则与一个初始向量(IV)进行异或。
- IV(初始化向量): 用来保证即使明文相同，加密后的密文也会不同，从而增加加密的安全性。它必须是随机的，对于每次加密都应该是唯一的，但它不需要保密。在 CBC 模式中，IV 的长度必须等于加密块的大小。
- CTR 代表计数器模式（Counter Mode）。在这个模式下，而不是直接加密数据本身，加密过程对“计数器”进行加密，然后将得到的结果与数据执行异或操作来加密或解密数据。每次加密一块数据时，计数器都会增加。这允许同一密钥加密多个数据块而不降低安全性。
- Length 初始化 AES-CTR 加密时必须提供的一个参数，这个值决定了计数器占用的空间大小，它表示加密操作开始时的计数器的长度，通常是 128位，与 AES 块大小相同。
- GCM: 伽罗瓦/计数器模式（GCM）是一种操作模式，用于 AES 等对称密钥加密算法，提供加密和消息认证（也就是同时保证信息的机密性和完整性）。
- ECDSA 全称为椭圆曲线数字签名算法（Elliptic Curve Digital Signature Algorithm），是一种使用椭圆曲线密码学（ECC）来实现的数字签名技术。数字签名技术可以让你验证数据的完整性和来源，确保数据没有被篡改且来自于声称的发送者。
- "ECDH"：椭圆曲线 Diffie-Hellman 密钥交换算法，用于安全地交换密钥信息。
- Ed25519 和 Ed448 是一种签名算法。你可以把它们想象成一种特殊的笔迹或印章，用来验证信息的真实性。比如，Alice 给 Bob 发了一条消息，并用她的私钥进行了签名。当 Bob 收到这条消息时，他可以用 Alice 的公钥来验证这个签名，从而确信这条消息确实是 Alice 发的，并且没有被篡改过。
- X25519 和 X448 则是用于密钥交换的算法。想象一下，Alice 和 Bob 想要在不安全的网络上安全地交换秘密信息。他们可以使用这些算法来生成一个共享的秘密密钥，即使有人能够拦截他们的交流，也无法得知这个共享的密钥是什么。这样，他们就可以用这个共享的密钥来加密通信了。
- HKDF（HMAC Key Derivation Function）是一种基于 HMAC（Hash-based Message Authentication Code）的密钥派生函数。它用于从一个输入密钥材料（IKM）生成强加密密钥。HKDF 可以被用来生成多个密钥，并且它包含两个步骤：提取（Extract）和扩展（Expand）。
- HMAC: 一种利用加密哈希函数（如 SHA-256）和一个秘密密钥结合数据来生成消息认证码的技术，广泛用于确保信息的完整性和真实性
- PBKDF2（Password-Based Key Derivation Function 2）是一种基于密码的密钥派生函数。简单来说，它可以把一个不太安全的初始密码转换为一个更安全的长密钥。这个过程通常涉及到“盐”（一段随机数据）和多次重复计算，目的是增加破解的难度。
- Salt: “盐”在密码学中通常指的是一段随机数据，是用来提升密码处理过程中的安全性的。它是一个必需的参数，用于防止字典攻击和彩虹表攻击，增强密码的独特性。
- RSA 加密：RSA 是一种非对称加密算法，它使用一对公钥和私钥来加密和解密数据。你可以用对方的公钥来加密信息，然后对方可以用他们的私钥来解密它，反之亦然。
- OAEP（Optimal Asymmetric Encryption Padding）：这是一种填充模式，用于增强 RSA 加密的安全性。简而言之，它帮助防止对加密消息的某些攻击，通过添加一些随机性到你要加密的消息中。
- RSA-PSS（RSA Probabilistic Signature Scheme）是一种公钥加密技术的变体，主要用于加密和数字签名。不同于传统的 RSA 签名，PSS 提供了更高水平的安全性，因为它在生成签名前添加了一个随机因素（盐值）。简单地说，它类似于给你的数据或消息添加一个“保险”，以确保签名真正独一无二且难以伪造。

> 更多加密概念解释见上一章节 [Nodejs Crypto](./15-crypto.md)

## 生成密钥 generateKey

除了 `digest()`，SubtleCrypto API 中所有加密函数都会使用密钥，可以使用 `subtle.generateKey()` 方法生成密钥，根据入参的算法，可以生成对称密钥和非对称密钥（公钥和私钥对），并使用 CryptoKey 对象表示加密密钥。

- 示例1：生成 HMAC 算法的密钥，用于数字签名和验证

```js
const { subtle } = globalThis.crypto

async function generateHmacKey(hash = "SHA-256") {
  const key = await subtle.generateKey(
    {
      name: "HMAC",
      hash,
    },
    true, // 是否可导出
    ["sign", "verify"] // 密钥的用途
  )

  return key
}
```

密钥的生成，根据指定的算法，需要指定其用途。

- 'encrypt' - 密钥可用于加密数据。
- 'decrypt' - 密钥可用于解密数据。
- 'sign' - 该密钥可用于生成数字签名。
- 'verify' - 密钥可用于验证数字签名。
- 'deriveKey' - 该密钥可用于导出新密钥。
- 'deriveBits' - 密钥可用于导出位。
- 'wrapKey' - 该密钥可用于封装另一个密钥。
- 'unwrapKey' - 该密钥可用于解包另一个密钥。

有效的密钥用法取决于密钥算法（由 algorithm.name 标识），这样确保了密钥只能用于指定的目的，增加了安全性。

- 示例2：生成对称算法密钥，用于加密和解密

```js
const { subtle } = globalThis.crypto

async function generateAesKey(length = 256) {
  const key = await subtle.generateKey(
    {
      name: "AES-CBC",
      length,
    },
    true,
    ["encrypt", "decrypt"]
  )

  return key
}
```

- 示例3：生成非对称算法密钥对（公钥和私钥），用于加密和解密

```js
const { subtle } = globalThis.crypto

async function generateRsaKey(modulusLength = 2048, hash = "SHA-256") {
  let { publicKey, privateKey } = await subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048, // 密钥长度
      publicExponent: new Uint8Array([1, 0, 1]), // 常见的公开指数
      hash: "SHA-256", // 使用的哈希函数
    },
    true, // 是否可导出
    ["encrypt", "decrypt"] // 密钥用途
  )

  return { publicKey, privateKey }
}
```

- 示例4：生成基于安全曲线算法的密钥对，用于签名和验证

```js
const { subtle } = globalThis.crypto

async function generateEd25519Key() {
  const { publicKey, privateKey } = subtle.generateKey(
    {
      name: "Ed25519",
    },
    true,
    ["sign", "verify"]
  )

  return { publicKey, privateKey }
}
```

## 派生密钥

密钥派生意味着从一个密钥生成另一个密钥。这里的原始密钥称为“基础密钥”(baseKey)，而衍生出来的密钥可以用于不同的目的，比如加密。密钥派生过程通常依赖于特定算法，并可能包括额外的数据（如盐值）以增强安全性。

- `subtle.deriveBits(algorithm, baseKey, length)` 方法允许您根据给定的算法、基础密钥和期望长度来派生一段固定长度的比特串（bits）。这个方法主要用于生成密钥材料或者其他某些加密任务所需的特定长度的数据。
  - algorithm: 这是一个对象，指定了要使用的派生算法及其必要的参数。例如，如果你使用的是 PBKDF2 算法，你需要指定盐值(salt)，迭代次数(iterations)，哈希函数(hash)等。
  - baseKey: 这是派生过程中用到的原始密钥，必须是一个符合特定算法要求的密钥类型。
  - length: 指定了派生出的比特串的长度，单位是比特（bit）。例如，如果你想得到一个 256 位的密钥，你就应该将 length 设置为 256。
- `subtle.deriveKey(algorithm, baseKey, derivedKeyAlgorithm, extractable, keyUsages)` 调用该方法相当于调用 `subtle.deriveBits()` 生成原始密钥材料，然后使用 deriveKeyAlgorithm、extractable 和 keyUsages 参数作为输入将结果传递到 `subtle.importKey()` 方法。

如果为两个独立的 `deriveKey()` 函数调用提供相同的基础密码，那么你会获得两个具有相同基础值的 CryptoKey 对象。

如果你想通过密码派生加密密钥，然后从相同的密码派生相同的密钥以解密数据，那么这将会非常有用。

支持的派生加密的算法： 'ECDH' / 'HKDF' / 'PBKDF2' / 'X25519' / 'X448'

使用场景：

- 用户密码加密：当用户设置密码时，系统可以使用派生技术从该密码生成一个密钥，然后使用这个密钥来加密用户数据。即使有人拿到了加密后的数据，没有派生出的密钥也无法解密。
- 安全通信：在两台设备之间建立安全通信时，可以使用一种叫做密钥协商的方法，其中一个设备生成临时的密钥材料，并通过安全的方式将其派生出的密钥传递给另一台设备。这样，即使有人截获了传递过程中的信息，也无法得知最终的密钥是什么。

示例一：将用户的密码通过 importKey 转换成一个CryptoKey对象。然后使用 subtle.deriveBits 方法以 PBKDF2 算法派生出 256 位的密钥材料。最后，我们将这段密钥材料转换成一个可以用于 AES-GCM 加密的 CryptoKey 对象。

```js
const { subtle } = globalThis.crypto

async function deriveEncryptionKey(password, salt, iterations, digest, length) {
  // 首先，将密码转换为CryptoKey
  const encoder = new TextEncoder()
  const keyMaterial = await subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  )

  // 派生密钥
  const derivedBits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: iterations,
      hash: { name: digest },
    },
    keyMaterial,
    length
  )

  // 将派生的bits转换为用于加密的密钥
  const derivedKey = await subtle.importKey(
    "raw",
    derivedBits,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  )

  return derivedKey
}

// 使用示例
deriveEncryptionKey("userPassword", "someSalt", 1000, "SHA-256", 256)
  .then((derivedKey) => console.log("Derived Key:", derivedKey))
  .catch((err) => console.error(err))
```

示例二：从用户的密码中派生出一个加密密钥。

将用户的密码转化为一个可以用于派生密钥的 CryptoKey 对象。接着，我们指定了一个使用 PBKDF2 算法进行密钥派生的算法对象 (deriveKeyAlg)，这涉及到选择一个哈希算法（如 SHA-256）、迭代次数以及盐（增加额外的随机性，提高安全性）。然后我们定义派生密钥的类型和大小（在此例中是 AES-GCM 算法的 256 位长密钥），最后我们调用 subtle.deriveKey() 方法来生成密钥，该密钥可用于加密和解密操作。

通过这种方式，即使攻击者知道了用户的密码，没有盐值和迭代次数等具体派生参数，他们也很难获取到实际用于加密数据的密钥。

```js
const { subtle } = globalThis.crypto

async function deriveKey(password) {
  // 将用户的密码转换为 ArrayBuffer
  const enc = new TextEncoder()
  const passwordBuffer = enc.encode(password)

  // 导入密码，作为派生密钥的基础
  const keyMaterial = await subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  )

  // 定义派生密钥的参数
  const deriveKeyParams = {
    name: "PBKDF2",
    salt: crypto.getRandomValues(new Uint8Array(16)), // 使用随机盐值
    iterations: 100000, // 迭代次数
    hash: "SHA-256", // 哈希函数
  }

  // 派生出密钥
  const key = await subtle.deriveKey(
    deriveKeyParams,
    keyMaterial,
    { name: "AES-GCM", length: 256 }, // 目标密钥的算法和长度
    true,
    ["encrypt", "decrypt"] // 密钥用途
  )

  return key
}

// 使用
deriveKey("user_password").then((key) => {
  console.log(key) // 打印派生出的密钥
})
```

## 导入和导出密钥

- `subtle.exportKey(format, key)`
  - format: 这是一个字符串参数，指定了密钥导出后的格式。常见的格式有"raw"、"pkcs8"、"spki"和"jwk"。
    - "raw"：表示原生的二进制格式。
    - "pkcs8"：适用于私钥，表示私钥信息语法规范。
    - "spki"：适用于公钥，表示简单公钥基础设施。
    - "jwk"：表示 JSON Web Key，是一种轻量级的、基于 JSON 的方式来表示密钥。
  - key: 这是要导出的密钥，是一个CryptoKey对象。
- `subtle.importKey(format, keyData, algorithm, extractable, keyUsages)`

要在应用程序外部使密钥可用，你需要导出密钥，`exportKey()` 可以为你提供该功能。你可以选择多种导出格式 'raw'、'pkcs8'、'spki' 或 'jwk'。

`importKey()` 与 `exportKey()` 刚好相反。你可以从其他系统导入密钥，并且同样支持上述导出的同样格式。

```js
const { subtle } = globalThis.crypto
const algorithm = { name: "AES-GCM", length: 256 } // 使用的算法及其参数

async function generateAndExportAesGcmKey() {
  const key = await subtle.generateKey(algorithm, true, ["encrypt", "decrypt"])
  const buf = subtle.exportKey("raw", key)
  // 将密钥转换为适合传输的格式，比如Base64
  return Buffer.from(buf).toString("base64")

  // 后续可以将导出的密钥写入文件或者进行网络传输等
}

async function importAesGcmKey(keyData) {
  const buf = Buffer.from(keyData, "base64")
  // 表示以原始二进制格式导入
  const key = subtle.importKey("raw", buf, algorithm, true, [
    "encrypt",
    "decrypt",
  ])
  // 使用导入的密钥进行操作，例如解密
  return key
}
```

## 包装密钥和解包装密钥

- `subtle.wrapKey(format, key, wrappingKey, wrapAlgo)`
- `subtle.unwrapKey(format, wrappedKey, unwrappingKey, unwrapAlgo, unwrappedKeyAlgo, extractable, keyUsages)`

如果密钥是敏感的，那么在传输或存储密钥过程中，应该对敏感密钥再进行一次加密，这一过程称为包装密钥。可以使用 `wrapKey()` 函数执行包装密钥。当需要使用时，使用 `unwrapKey()` 函数解密密钥。

其中 “包装”的密钥称为包装密钥 wrappingKey，而被加密的密钥称为包装目标密钥 key。

通过这种方式，即便是在不安全的环境中，密钥的传输和存储也能保持一定的安全性，因为没有包装密钥，就无法解析出原始的数据密钥来加解密信息。这在需要高度保密性的数据传输和存储场景中非常有用，例如在线银行系统、医疗信息系统等。

```js
const { subtle } = require("crypto").webcrypto
const keyUsage = ["encrypt", "decrypt"]
const dataKeyAlgorithm = { name: "AES-GCM", length: 256 }
const wrapKeyAlgorithm = {
  name: "RSA-OAEP",
  modulusLength: 2048, // RSA密钥大小
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: "SHA-256",
}

// 首先，需要生成一对用于加解密数据的密钥（我们称之为“数据密钥”），以及一对用于包装和解包第一对密钥的密钥（我们称之为“包装密钥”）。
async function generateKeys() {
  // 生成包装密钥对
  const wrapKeyPair = await subtle.generateKey(wrapKeyAlgorithm, true, [
    "wrapKey",
    "unwrapKey",
  ])

  // 生成数据密钥
  const dataKey = await subtle.generateKey(dataKeyAlgorithm, true, [
    "encrypt",
    "decrypt",
  ])

  return {
    wrapPublicKey: wrapKeyPair.publicKey,
    wrapPrivateKey: wrapKeyPair.privateKey,
    dataKey,
  }
}

// 包装密钥，使用包装密钥对数据密钥进行加密（包装）。这样，即使有人非法获取了被包装的密钥，也无法在没有包装密钥的情况下使用它。
async function wrapKey(wrapPrivateKey, dataKey) {
  const wrappedKey = await subtle.wrapKey(
    "raw", // 导出密钥的格式
    dataKey, // 被包装的密钥
    wrapPrivateKey, // 用于包装的密钥
    wrapKeyAlgorithm
  )

  return wrappedKey // 这是一个 ArrayBuffer 对象
}

// 最后，只有在正确的包装密钥存在的情况下，收件人才能解包（解密）被包装的密钥，并使用它来解密数据。
async function unwrapKey(wrappedKey, keyUsage) {
  const unwrappedKey = await subtle.unwrapKey(
    "raw", // 被包装密钥的格式
    wrappedKey, // 已经被包装的密钥
    wrapPublicKey, // 用于解包装的密钥
    wrapKeyAlgorithm, // 使用跟包装时相同的算法用于解包
    dataKeyAlgorithm, // 被解包密钥的算法
    true,
    keyUsage // 被解包密钥的用途
  )

  return unwrappedKey
}
```

## 浏览器端存储密钥

CryptoKey 对象可以通过结构化克隆算法来存储，这意味着你可以通过 web storage API 来存储和获取它们。更为规范的方式是通过使用 IndexedDB API 来存储 CryptoKey 对象。

> [结构化克隆算法](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)

## 摘要

摘要基本类同于 nodejs 原生的 crypto 模块中的哈希函数，是一种将任意长度的输入数据，通过散列算法生成的短小的固定长度输出数据的算法。

当你对相同的数据使用相同的散列算法时，你总会得到相同的摘要值，但即使只有很小的数据变化，产生的摘要也会大不相同，这使得它非常适合检测数据是否被篡改。

- 支持的摘要算法：SHA-1 SHA-256 SHA-384 SHA-512
- `subtle.digest(algorithm, data)`

```js
const { subtle } = globalThis.crypto

async function digest(data, algorithm = "SHA-512") {
  const ec = new TextEncoder()
  const digest = await subtle.digest(algorithm, ec.encode(data))
  return digest
}
```

其中 TextEncoder 是 web 标准中，将一个字符串作为输入，并输出提供 UTF-8 字节流（TypedArray）。

其中 TypedArray 对象描述了底层二进制数据缓冲区的类数组视图，类比于 Nodejs 原生的 Buffer。

## HMAC

HMac，全称 Hash-based Message Authentication Code，是一种基于哈希函数（摘要算法）和密钥的实现 MAC（消息认证码）的算法。结合哈希函数（摘要算法）的不可逆性和密钥的保密性，提供更高的安全性和防抵赖性，防止消息被篡改或伪造。常用于网络通信中的消息认证、数字签名、API认证等领域。

HMAC 主要用于两个目的：

- 确保信息的完整性：确保数据在传输过程中没有被篡改。
- 身份验证：发送方和接收方共享一个密钥，通过检验 HMAC 值来确认对方的身份。

使用步骤：

1. 生成 HMAC 密钥：首先，你需要生成一个用于 HMAC 操作的密钥。
2. 使用密钥对数据进行签名：通过 HMAC 算法和你的密钥对特定数据进行签名。
3. 验证签名：最后，使用相同的密钥验证签名是否有效，以确保数据的完整性和验证身份。

```js
const { subtle } = globalThis.crypto

// 第一步：生 生成 HMAC 密钥
async function generateHmacKey(hash = "SHA-256") {
  const key = await subtle.generateKey(
    {
      name: "HMAC",
      hash,
    },
    true, // 是否可提取密钥
    ["sign", "verify"] // 可使用此密钥的操作
  )

  return key
}

// 第二步：使用密钥对数据进行签名
async function signDataByHmac(key, data) {
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(data)

  return await subtle.sign("HMAC", key, encodedData)
}

// 第三步：验证签名
async function verifySignatureByHmac(key, signature, data) {
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(data)

  return await subtle.verify("HMAC", key, signature, encodedData)
}
```

## 对称加密解密

对称加密指加密和解密使用同一个密钥的加密方式。

- 优点：加密计算量小、速度块，适合对大量数据进行加密的场景。
- 缺点：存在密钥传输问题和密钥管理问题。速度快，安全性不高。
- 对称算法：AES-CTR / AES-CBC / AES-GCM
- `subtle.encrypt(algorithm, key, data)` 加密数据
- `subtle.decrypt(algorithm, key, data)` 解密数据

```js
const { subtle } = globalThis.crypto

async function encryptDecryptExample() {
  const keyMaterial = await subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  )

  const data = new TextEncoder().encode("Hello, world!") // 要加密的数据
  const iv = crypto.randomBytes(12) // 初始化向量

  // 加密
  const encrypted = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    keyMaterial,
    data
  )

  // 解密
  const decrypted = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    keyMaterial,
    encrypted
  )

  console.log(new TextDecoder().decode(decrypted)) // 输出: Hello, world!
}

encryptDecryptExample()
```

IV 或初始化向量是 AES-GCM 加密中的一个重要组成部分。它是一段随机数据，用于与明文一起加密，以确保即使相同的数据（明文）被加密多次，每次生成的密文也都不同。这大大增强了加密方案的安全性。IV 在加密和解密时都必须使用，且在加密过程中要保证其唯一性。通常，IV 并不需要保密，但不应重复使用同一个 IV 进行多次加密。

## 非对称加密解密

非对称加密算法，也称为“公开密钥加密算法”，是指加密密钥和解密密钥完全不同，其中一个为公钥，另一个为私钥，并且不可能从任何一个推导出另一个。

- 私钥：是一个秘密数字，只能由密钥所有者知道。
- 公钥：通过特定的数学运算与私钥相关联，可以安全地公开，用于验证由私钥创建的签名。

公开密钥与私有密钥是一对，如果用公开密钥对数据进行加密，只有用对应的私有密钥才能解密；如果用私有密钥对数据进行加密，那么只有用对应的公开密钥才能解密。因为加密和解密使用的是两个不同的密钥，所以这种算法叫作非对称加密算法。

- 优点：安全性高
- 缺点：加密与解密速度慢
- 非对称算法：RSA-OAEP
- `subtle.encrypt(algorithm, key, data)` 加密数据
- `subtle.decrypt(algorithm, key, data)` 解密数据

```js
const { subtle } = globalThis.crypto

async function asymmetricEncryptDecryptExample() {
  // 生成 RSA-OAEP 密钥对
  const { publicKey, privateKey } = await subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048, // 模长
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 公钥指数
      hash: "SHA-256", // 使用的哈希函数
    },
    true, // 是否可提取
    ["encrypt", "decrypt"] // 密钥用途
  )

  const data = new TextEncoder().encode("Hello, world!") // 要加密的数据

  // 加密
  const encrypted = await subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    data
  )

  // 解密
  const decrypted = await subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey, // 使用之前生成的私钥
    encrypted // 要解密的数据
  )

  console.log(new TextDecoder().decode(decrypted)) // 输出: Hello, world!
}
```

## 签名和验证

API

- `subtle.sign(algorithm, key, data)`
- `subtle.verify(algorithm, key, signature, data)`

算法
目前支持的算法包括：`'HMAC' / 'RSASSA-PKCS1-v1_5' / 'RSA-PSS' / 'ECDSA' / 'Ed25519' / 'Ed448'`

应用场景：

- 文件的数据签名：数字签名是证明文件真实性的一种方法，使用你的私钥对文档进行加密，如果有人想验证这个签名的真实性（该签名是否是你的签名），他们会使用你的公钥对文档进行解密，并检查文件是否匹配。。
- web证书：证书也是公钥加密的一个关键用途,证书能连接到数字签名，使用它们的一个常见地方是 HTTPS协议。
- SSH 登录：使用公钥和私钥来证明客户端是服务器上的有效授权用户。客户端生成公钥和私钥对，本地存储私钥，将公钥存储到远程服务器上。SSH 密钥对一般使用RSA算法加密。登录的时候，远程主机会向用户发送一段随机字符串，用户用自己的私钥加密后，再发回来。远程主机用事先储存的公钥进行解密，如果成功，就证明用户是可信的，直接允许登录shell，不再要求密码。

签名与验证的过程：

1. 生成签名：

- 发送方有一段重要信息需要发送给接收方。
- 发送方使用自己的私钥对这段信息进行加密，生成一个“签名”。

2. 验证签名：

- 接收方收到这段信息以及它的签名。
- 接收方使用发送方的公钥来解密签名。
- 如果使用公钥可以成功解密签名并且解密后的信息与接收到的原始信息匹配，那么就证明了这条信息是由持有相应私钥的发送方所发送，并且在传输过程中未被篡改。

```js
const { subtle } = globalThis.crypto

const signAlgorithm = {
  name: "ECDSA",
  hash: { name: "SHA-256" },
}

async function generateECDSAKey() {
  const keyPair = await subtle.generateKey(
    {
      name: "",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  )

  const { publicKey, privateKey } = keyPair

  return { publicKey, privateKey }
}

async function createECDSASignature(payload, privateKey) {
  const data = new TextEncoder().encode(payload)
  const signature = await subtle.sign(signAlgorithm, keyPair.privateKey, data)
  return Buffer.from(signature).toString("base64")
}

async function verify(_signature, publicKey, data) {
  const signature = Buffer.from(_signature, "base64")
  const encodeData = new TextEncoder.encode(data)
  const isVerified = await subtle.verify(
    signAlgorithm,
    publicKey,
    signature,
    encodeData
  )

  return isVerified
}
```

## 随机数

### `crypto.getRandomValues(typedArray)`

`crypto.getRandomValues(typedArray)`方法让你可以获取符合密码学要求的安全的随机值。传入参数的数组被随机值填充（在加密意义上的随机）。

为了确保足够的性能，不使用真正的随机数生成器，但是它们正在使用具有足够熵值伪随机数生成器。它所使用的 PRNG 的实现与其他不同，但适用于加密的用途。该实现还需要使用具有足够熵的种子，如系统级熵源。

函数接受一个 typedArray 作为参数，是一个基于整数的 TypedArray，它可以是 Int8Array、Uint8Array、Int16Array、 Uint16Array、 Int32Array 或者 Uint32Array，但是不可使用 Float32Array 或者 Float64Array。在数组中的所有的元素会被随机数填充或重写，这意味着函数执行完成后，你传入的数组会被更新，包含了随机生成的数据。

> typedArray 是一种特殊的数组，它存储的是固定类型的数据，比如只有数字的数组。在 JavaScript 中，我们有多种类型的 typedArray，例如 Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array 等等。这些类型主要区别在于它们可以存储的整数类型（无符号、有符号）以及大小（8 位、16 位、32 位）。

```js
const { getRandomValues } = globalThis.crypto

// 创建一个Uint8Array类型的数组，长度为16
let randomBytes = new Uint8Array(16)

// 使用getRandomValues方法填充随机值
getRandomValues(randomBytes)

console.log(randomBytes)
```

使用 `crypto.getRandomValues(typedArray)`来生成随机数比其他方法更安全，因为它基于底层操作系统提供的加密级别的随机数生成器。这比 JavaScript 内置的 `Math.random()` 提供了更高的安全性和不可预测性，特别是在安全敏感的应用场景中，如密码学和身份验证。

> TODO: crypto.getRandomValues 和 Math.random 的区别

### `crypto.randomUUID()`

`crypto.randomUUID()` 函数用于生成符合 RFC 4122 规范的版本4（随机）UUID（通用唯一识别码）。这个函数非常实用，因为它能够生成几乎唯一的字符串，这些字符串在很多情况下都可以作为对象的唯一标识符使用。

UUID 是由 32 个十六进制数字组成的，格式为 `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` 其中 x 是任意十六进制数字，而 y 是 `8、9、A、B` 中的一个，确保了该 UUID 的版本和变体。

crypto.randomUUID() 函数自动处理这些细节，返回一个满足上述格式的字符串。

```js
const { randomUUID } = globalThis.crypto
// 当新用户访问应用时
const sessionId = randomUUID()
console.log(`Session ID for the new user: ${sessionId}`)

// 用户上传文件时
const originalFileName = "user_picture.png"
const uniqueFileName = `${randomUUID()}-${originalFileName}`
console.log(`Unique file name for the uploaded file: ${uniqueFileName}`)
// 然后可以安全地将文件保存在服务器上，避免名称冲突
```
