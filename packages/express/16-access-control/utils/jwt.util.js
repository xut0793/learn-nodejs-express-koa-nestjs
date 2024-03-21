/*
 * @Date         : 2023-04-03 22:57:10 星期1
 * @Author       : xut
 * @Description  : 实际项目中可以引用成熟的依赖包 jsonwebtoken 或者 jose，它们会校验支持的算法和边界情况。
 *                 这里自定义实现实现默认的 HMAC SHA256 算法签名
 *
 * 官网： https://jwt.io
 *
 * 一.jwt 原理
 * 服务器认证以后，生成一个 JSON 对象，包含一些用户的标识信息。如 {user, role}。
 * 下次与服务端通信的时候，都要发回这个 JSON 对象。服务器完全只靠这个对象认定用户身份。为了防止用户篡改数据，服务器在生成这个对象的时候，会加上签名。
 *
 * 二.jwt 验证流程
 * 1.浏览器携带用户信息发起登录流程
 * 2.服务端根据用户信息到用户数据库验证身份
 * 3.身份验证通过后，根据指定的算法，将用户相关标识信息，按 jwt规则，生成 token，响应给浏览器
 * 4.浏览器接收后，将token保存，后续每次请求时都要携带上
 * 5.服务端再次收到请求，进行验证，验证通过则响应资源。
 *
 * 这里过程有几点注意：
 * 1.按jwt规则，对包含用户标识的声明部分数据没有严格加密，所以用户标识信息不要包含敏感数据
 * 2.浏览器保存token方式没有强制规定，可以仍像session一样用cookie保存，但这样失去了jwt意义，所以一般会保存在localStorage中
 * 3.再次请求时，如何携带token，也没有强制规定，可以放在查询参数中，也可以放在请求体中，但普遍做法是继承http的认证框架，放在请求头 Authorization 中，声明认证类型为 bearer。然后服务器中声明该请求字段跨域放行
 *
 * 三、jwt 组成
 * JWT 是由三段信息构成的，将这三段信息文本用`.`链接一起就构成了 Jwt 字符串。
 * header.payload.signature
 *
 * 1. header 对象中包含两个字段：
 * {
 *   "alg": "HS256", // algorithm 签名算法，默认 HMAC SHA256
 *   "typ": "JWT"    // type 类型，指定 JWT
 * }
 *
 * 2. payload 对象就是可以附加数据的地方，官方约定了7个字段，其它可自定义
 * {
 *    iss (issuer)：签发人
 *    sub (subject)：主题
 *    aud (audience)：受众
 *    exp (expiration time)：过期时间，这个过期时间必须要大于签发时间
 *    nbf (Not Before)：生效时间，定义在什么时间之前，该jwt都是不可用的
 *    iat (Issued At)：签发时间
 *    jti (JWT ID)：编号，该 jwt的唯一身份标识，主要用来作为一次性token,从而回避重放攻击。
 *    // 自定义字段
 *    userId
 *    role
 * }
 *
 * 3. Signature 签名 对前两部分header和payload进行签名，防止数据篡改
 * 签名算法：sign = HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
 * 即对 header 和 payload 分别进行 base64UrlEncode，然后通过.点号连接，再用指定算法加盐(secret)进行加密，生一个签名 signature
 *
 * 最后，token = base64UrlEncode(header) + "." + base64UrlEncode(payload) + "." + sign 组成token
 *
 * 这里base64UrlEncode 与常规的 base64 区别：
 * 有些场合可能会把 token 放到 URL 上作为查询参数传输，比如 api.example.com/?token=xxx。
 * 但是http URL 规则里 +、/和= 这三个字符是有特殊含义的，相当于关键字，所以对签名算法生成的token中如果有这三个字符，要进行替换，约定为 =被省略、+替换成-，/替换成_ 。这就是 Base64URL 算法。
 *
 * 注意事项：
 * - 不应该在 jwt 的 payload 部分存放敏感信息，因为该部分是客户端可 base64 反解密的。
 * - 保护好 secret 私钥，该私钥非常重要。secret 是保存在服务器端的，jwt 的签发生成也是在服务器端的，secret 就是用来进行 jwt 的签发和 jwt 的验证，所以，它就是你服务端的私钥，在任何场景都不应该流露出去。一旦客户端得知这个 secret, 那就意味着客户端是可以自我签发 jwt 了。
 *
 * 四、jwt 的优劣势
 * 优势，就是克服了传统 cookie 或 session 的缺点：
 * - 因为 json 的通用性，所以 JWT 是可以进行跨语言支持的，像 JAVA,JavaScript,NodeJS,PHP 等很多语言都可以使用。
 * - 因为有了 payload 部分，所以 JWT 可以在自身存储一些其他业务逻辑所必要的非敏感信息。
 * - 便于传输，jwt 的构成非常简单，字节占用很小，所以它是非常便于传输的。
 * - 它不需要在服务端保存会话信息, 所以它易于应用的扩展
 *
 */

import crypto from "crypto"

const JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/

function base64urlEscape(str) {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function base64urlUnescape(str) {
  str += new Array(5 - (str.length % 4)).join("=") // 固定写法
  return str.replace(/\-/g, "+").replace(/_/g, "/")
}

function base64url(json, encoding = "utf8") {
  const ret = Buffer.from(JSON.stringify(json), encoding).toString("base64")
  return base64urlEscape(ret)
}

function base64urlToObj(str, encoding = "utf8") {
  const unescaped = base64urlUnescape(str)
  const objStr = Buffer.from(unescaped, "base64").toString(encoding)

  try {
    const obj = JSON.parse(objStr)
    return obj
  } catch (error) {
    return str
  }
}

export function sign(content, secret) {
  const ret = crypto
    .createHmac("sha256", secret)
    .update(content)
    .digest("base64")
  return base64urlEscape(ret)
}

const header = {
  alg: "HS256", // algorithm hmac sha256
  typ: "JWT",
}
export function createJwt(payload, secret) {
  const headerStr = base64url(header)
  // 指明了 jwt 时，payload 需要是对象
  const payloadStr = base64url(payload)
  const signature = sign(`${headerStr}.${payloadStr}`, secret)

  return `${headerStr}.${payloadStr}.${signature}`
}

export function decode(jwtString) {
  if (JWS_REGEX.test(jwtString)) {
    const [headerStr, payloadStr, sign] = jwtString.split(".")
    const header = base64urlToObj(headerStr)
    const payload = base64urlToObj(payloadStr)
    return {
      header,
      payload,
      sign,
    }
  } else {
    return new Error("jwt不规范")
  }
}

export function verify(jwtString, secret) {
  if (JWS_REGEX.test(jwtString)) {
    const [headerStr, payloadStr, signature] = jwtString.split(".")
    const newSign = sign(`${headerStr}.${payloadStr}`, secret)

    //  这里是比较简单的校验，还可以加入有效时间、jti等校验逻辑
    if (signature === newSign) {
      return true
    } else {
      return new Error("jwt被篡改")
    }
  } else {
    return new Error("jwt不规范")
  }
}

// test
// const secret = "abc123";
// const token = createJwt({ username: "tom" }, secret);
// console.log(token);

// const isValid = verify(token, secret);
// console.log(isValid);

// const decoded = decode(token);
// console.log(decoded);
