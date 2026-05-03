# 认证 Authentication

服务端接收用户在浏览器登录表单中输入的用户信息后，当再次访问其它资源时，如何认证这些用户还是之前登录过的用户呢？

换个说法：如何解决 HTTP(s) 的无状态性，即如何维持 HTTP 的登录态？

> HTTP(s) 无状态：服务器无法知道两个请求是否来自同一个浏览器，即服务器不知道用户上一次做了什么，每次请求都是完全相互独立。

- 最初的方法 Cookie / Session
- 通用的 HTTP Authentication 认证框架。常见的验证方式有 Basic / Digest / Bearer 等。[HTTP Authentication](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Authentication)
- OAuth2

## 认证的对象和场景

> 出处：[Jeff Tian 知乎答案](https://www.zhihu.com/question/392620649/answer/3363436041)

从认证对象的角度，可以粗分为两类：

- request Authentication，暂且理解为用户的访问
- Peer Authentication ，暂且理解同类的应用程序

> 极客时间里周志明老师的《周志明的软件架构课》中提到认证对象的分类：分别是“Request Authentication”和“Peer Authentication”。

在企业认证场景中，也是可以粗分为两类，分别是“对内”和“对外”，而进一步也可以细分为“ABCDE”，如下所示：

- 对内认证
  - 2A (To Application)，面向应用接口的身份认证
  - 2B (To Business)，面向内部业务系统的身份认证
  - 2D (To Developer)，面向开发者的身份认证，如企业内部的日志系统、监控系统等。
  - 2E (To Employee)，面向内部员工的身份认证
- 对外认证
  - 2C (To Consumer / To Customer)，面向终端客户、使用产品的消费者的身份认证
  - 2D (To Developer)，面向开发者的身份认证，如大型企业对外开放平台等。

> 一个企业内部会存在多个领域和子领域，能力的复用也可以通过 API 的形式来提供。
> API 可以分为同步 API 和异步 API：
>
> - 同步 API 多是我们熟悉的 Restful API / GraphQL / RPC 等。
> - 而异步 API 一般使用事件驱动中间件，如 RabbitMQ / Kafka 等。
>
> 建议的方式是领域内部通过同步 API 来调用，而跨领域之间使用异步 API 来解耦。
> 引用：Jeff Tian 知乎答案：https://www.zhihu.com/question/392620649/answer/3363436041

## cookie

[Cookie 起源与发展](https://zhuanlan.zhihu.com/p/74042200)

### 什么是 Cookie

Cookie 是由服务器发给浏览器的特殊数据，这些数据以文本的形式存放在浏览器本地中，以后浏览器每次向服务器发送请求的时候都会自动被带上之前缓存的数据到服务器上。

通常，它用于告知服务端两个请求是否来自同一浏览器，保持用户的登录状态。Cookie 使基于无状态的 HTTP 协议记录稳定的状态信息成为了可能。

> 在1994年，由网景公司当时一名员工Lou Montulli（卢-蒙特利）将“cookies”的概念应用于网络通信，用来解决用户网上购物的购物车历史记录，而当时最强大的浏览器正是网景浏览器，在网景浏览器的支持下其他浏览器也渐渐开始支持Cookie，到目前所有浏览器都支持Cookie了。

### Cookie 实现流程

cookie 在 HTTP 中通过 Set-Cookie 和 Cookie 两个头字段实现，具体流程：

- 用户在输入用户名和密码之后，浏览器将用户名和密码发送给服务器
- 服务器进行验证，验证通过之后将用户信息混淆后按 Cookie 规定格式封装
- 服务器通过 Set-Cookie 请求头将封装的 Cookie 数据返回给浏览器。
- 浏览器收到服务器返回数据，会自动将请求头 Set-Cookie 的值缓存在本地
- 以后每次浏览器再请求服务器的时候，缓存的 Cookie 会自动被放在请求头 Cookie 中传给服务器
- 服务器中解析 Cookie 请求头中的数据，认证用户。

```
                    +--------+                      +--------+
                    | 浏览器 |                      | 服务器 |
                    +---+----+                      +---+----+
                        |                               |
                        |                               |
                        +------------------------------->
                        |  1.HTTP请求，发送用户名和密码     |
                        |                               +----+  2.进行认证
                        |                               |    |  将用户信息封装成Cookie
                        |                               <----+
                        |                               |
                        <-------------------------------+
                        |  3.HTTP响应，设置Set-Cookie     |
4.浏览器自动保存     +-----+                               |
  js也可以读取      |     |                               |
                  +----->                               |
                        |                               |
                        +------------------------------->
                        |  5.HTTP请求，自动带上Cookie      |
                        |                               +----+  6.解析Cookie
                        |                               |    |  获取用户信息
                        |                               <----+
                        |                               |
                        <-------------------------------+
                        |  7.HTTP响应，返回对应用户的数据   |
                        |                               |
                        |                               |
                        +                               +
```

### Cookie 格式

Cookie 的值是一个字符串，但它是由多个部分组成，以 ; 分隔。

Set-Cookie 响应设置时，一次设置一个name-value值，可以设置多次，格式为：

```
Set-Cookie: <name>=<value>; Domain=<domain-value>; Path=<path-value>; Secure; HttpOnly; SameSite=Strict
```

Cookie 请求头，是浏览器自动行为，无法干预，只携带 name-value，多个时以分号分隔。

```
Cookie: name1=value1;name2=value2
```

设置 Set-Cookie 值的选项：

| 字段     | 类别         | 描述                                                                                                                                                                                                                               |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name     | cookie-name  | 不包含特殊字符的 ASCII 字符                                                                                                                                                                                                        |
| value    | cookie-value | 不包含特殊字符的 ASCII 字符。如果设置中文，因为是 Unicode 字符需要转码，设置时可以使用 encodeURIComponent 编码，读取时用 decodeURIComponent 解码。                                                                                 |
| Expires  | 有效性       | 设置有效期限，时间戳或 UTC 格式时间(date.toUTCString)。如果没有设置，就是一个会话期 cookie。                                                                                                                                       |
| Max-Age  | 有效性       | 设置有效时长，单位秒。1.如果 MaxAge 为正数，只要时长没到 cookie 就有限；如果如果 MaxAge 为负数，表示临时性 cookie，仅在当前会话内有效。默认值是-1；如果 MaxAge 为零，表示删除 cookie。如果 MaxAge 和 Expires 同时存在，优先 MaxAge |
| Domain   | 作用域       | 指定了当前 cookie 在什么域内生效。默认是请求头 origin 指定的域。Cookie 的隐私安全机制决定 Cookie 是不可跨域名的。                                                                                                                  |
| Path     | 作用域       | 指定了允许访问当前 cookie 的路径，默认'/'，                                                                                                                                                                                        |
| HttpOnly | 安全性       | 因为浏览器可以通过 document.cookie 进行读写操作。所以为了禁止浏览器对 cookie 的写操作，允许只传，可以设置 HttpOnly，只允许服务器进行更改。                                                                                         |
| Secure   | 安全性       | 将 cookie 的限制在 HTTPS 协议网络中传输。                                                                                                                                                                                          |
| SameSite | 安全性       | 限制 cookie 跨站发送的行为，避免 CSRF 跨站网点攻击。值可以为 None/Lax/Strict。None 是无限制，允许第三方 cookie 存在。Lax 限制在文档链接、预加载、GET 的表单请求中携带第三方 cookie。Strict 则完全禁止第三方 cookie。               |

> 具体属性含义 [HTTP Cookie](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies)

另外，Cookie 与域关联。如果此时操作的域与您所在页面的域相同，则该 cookie 称为第一方 cookie（ first-party cookie）。如果域不同，则称为第三方 cookie（third-party cookie）。比如页面有个链接跳转到 github，如果点击访问，则此时相对于当前页面，携带的 cookie 就称为第三方 cookie。

### cookie 劣势

- Cookie 内容保存在浏览器，数据主动权在浏览器，业务逻辑无法干预浏览器对Cookie的行为。
- 浏览器实现 Cookie 数据保存，有数量和大小限制，每个域下最多有 20-50 条，并且每个 cookie 通常为不超过 4kb，超过会被截断。
- Cookie 信息在浏览器是可见的（控制台可以查看），并且可以被浏览器读写（httponly 属性保护的除外）

### Cookie 服务器代码实现

```js
function generateCookie(name, value, options) {
  const cookie = `${name}=${value}`

  if (options.maxAge) cookie += "; max-age=" + options.maxAge
  if (options.path) cookie += "; path=" + options.path
  if (options.expires) cookie += "; expires=" + options.expires.toUTCString()
  if (options.domain) cookie += "; domain=" + options.domain
  if (options.sameSite)
    cookie +=
      "; samesite=" +
      (options.sameSite === true ? "strict" : options.sameSite.toLowerCase())
  if (options.secure) cookie += "; secure"
  if (options.httpOnly) cookie += "; httponly"

  return cookie
}
```

#### express 设置 cookie

在 express 框架中，通过依赖 cookie-parser 包来解析和设置 cookie。并且了对 cookie 进行签名的功能，以加强 cookie 值的安全性，避免被篡改。

```js

```

#### koa 设置 cookie

koa 已经内置 cookie 的解析和设置，内部由 cookie 包提供支持。

1. 获取 ctx.cookies.get(name)
2. 设置 ctx.cookies.set(name, value, options)

如果要设置签名 `cookies.set(name, value, {signed: true})`，则同时需要设置 `app.keys = ['secret']`，提供用于签名的密钥，否则会报错。

对于已签名的值获取 `cookie.get(name, {signed: true})`，如果值被篡改，则返回空。

```js

```

## Session

### Session 出现背景

像上述通过 Cookie 维持浏览器与服务器之间会话状态。实现方式是将用户数据直接放到了 Cookie 中，不管该 Cookie 内容是否有加密保证，仍存在上述缺点，主要是将敏感数据暴露在浏览器端的不安全性。
加上随着浏览器和网络的发展，Cookie 除了认证功能外，也常常被用于其它目的，比如第三方 Cookie 泛滥，容易导致 csrf 风险等。所以软件工程人员觉得 cookie 不安全也不方便，所以出现了一种新的维持 HTTP 状态的机制 Session。

> 换个角度思考：既然敏感数据存放在客户端不安全，那就把数据存放在服务器端。将作为数据查询映射的标志，比如称为 sessionId，存放在 cookie 中保存，就能同样维持了会话状态，又提高了安全性。

### Session 是什么

Session 翻译为会话，原本指的是，浏览器从第一次请求服务器开始，到关闭浏览器结束称为一个会话周期。

之后，将这个概念延展到 HTTP 认证中，通常指的是用户通过浏览器与服务器建立交流开始，到用户主动结束或 SessionId 过期为止。

### Session 交互流程

简单讲：

1. 当用户登录服务器时，服务器将用户信息存储在服务器端，并为该用户的存储的数据创建一个标识，惯例上被命名为 SessionID。随后将 SessionID 设置到 Cookie 中进行响应。
2. 随后的所有请求中，服务器会从 Cookie 中读取 SessionID，然后通过它读取存储的用户信息。如果要使它该用户会话失效，只要删除储存的用户信息，让下次请求的 SessionID 读取不到对应的用户即可。

```
+--------+                      +--------+                        +------+
| 浏览器  |                      | 服务器  |                        | 缓存 |
+---+----+                      +---+----+                        +--+---+
    |                               |                                |
    |                               |                                |
    +-------------------------------+       2.进行认证                |
    |  1.HTTP请求，发送用户名和密码     |       将用户信息进行缓存       |
    |                               +-------------------------------->
    |                               |                                |
    |                               <--------------------------------+
    |                               |       返回 SessionID            |
    <-------------------------------+                                |
    |  3.HTTP响应，设置Set-Cookie     |                                |
    |   将SessionID封装成Cookie       |                                |
    |                               |                                |
    |                               |                                |
    |                               |                                |
    +------------------------------->                                |
    |  5.HTTP请求，自动带上Cookie      |                                |
    |                               +----+  6.解析Cookie              |
    |                               |    |  获取SessionID             |
    |                               <----+                           |
    |                               |                                |
    |                               +-------------------------------->
    |                               |    7.通过SessionID拿到用户信息    |
    |                               |                                |
    |                               <--------------------------------+
    <-------------------------------+     返回用户信息                 |
    |  8.HTTP响应，返回对应用户的数据    |                                |
    |                               |                                |
    |                               |                                |
    v                               v                                v
```

### Session 劣势

- 因为 Session 还是要基于 Cookie 实现，所以同样存在 Cookie 不安全的风险。比如CSRF 跨站伪造请求攻击
- 服务器压力大，占用服务器内存。每个用户通过认证之后都会将基本用户数据数据保存在服务器的内存中，而当用户量增大时，服务器的压力增大。
- 扩展性不强。在微服务架构或集群服务器架构中，session信息无法共享。虽然可以使用数据库存储解决，比如内存数据库 redis。

在实际业务中，Session 一般更适用于保存在 Redis 中：

- session 访问频繁，对性能要求高，redis 属于内存数据库，读写速度比 mysql 的硬盘速度更快
- session 只是用于会话保持，可以不考虑断电或服务中断后数据丢失问题
- session 用于会话保持的数据量不会太大，相比于 mysql 的数据保存。

### Session 服务器示例代码

#### express 实现 session

#### koa 实现 session

## Bearer Token

回过头想想，我们用 SessionId 封装了什么数据，一些能标识当前请求的基本用户数据，比如用户ID、用户角色等简单数据。这些数据在数据库用户详细数据中也肯定存储了，然后为了实现用户认证，使用 Session 方案还要存储一次。浪费了存储空间。

并且在微服务盛行的今天，如果不把 Session 存储到一个共享的服务中的话，还无法实现多服务的认证。

那有没有可能直接将这些基本的用户标识数据直接在前后端 HTTP 中流通，以及服务端各微服务间流通呢。

这就是出现了另一个方案 Bearer Token，它能将这些基本用户标识数据直接封装到一个 token 令牌中，用这个令牌在 HTTP 和各微服务间流通，而不用在服务端存储。当服务需要用户ID进行认证时，可以直接从 token 中提取。

生成的 token，相当于 SessionID 的作用，而之前 SessionID 通常基于 Cookie 在 HTTP 中传输。所以理论上 token 也可以通过 Cookie 在浏览器和服务器间传输。但为了避免 Cookie 带来的弊端，最佳的实践是依赖于 HTTP 提供了一套 HTTP Authentication 认证框架中 bearer 方案来实现前后端传输。

这种方案在客户端代码逻辑中，不再依赖于浏览器请求时会自动携带 Cookie 的自主行为，而是由业务逻辑主动实现，将 token 设置为请求头 Authorization 的值发送到服务器端。

把基本用户数据直接通过 token 在 HTTP 中传输，所以 token 的安全性很重要，目前普遍使用的一种生成 token 的方式是 JWT 方案。

### JWT

JWT 全称 Json Web Token。常用于用户访问令牌的生成，

#### jwt 组成

JWT 是由三段信息构成的，将这三段信息文本用点号`.`链接一起就构成了 Jwt 字符串：`header.payload.signature`

1. header 对象中包含两个字段：

```js
{
  "alg": "HS256", // algorithm 签名算法，默认 HMAC SHA256
  "typ": "JWT"    // type 类型，指定 JWT
}
```

2. payload 对象就是可以附加数据的地方，官方约定了7个字段，其它可自定义

```
{
   iss (issuer)：签发人
   sub (subject)：主题
   aud (audience)：受众
   exp (expiration time)：过期时间，这个过期时间必须要大于签发时间
   nbf (Not Before)：生效时间，定义在什么时间之前，该jwt都是不可用的
   iat (Issued At)：签发时间
   jti (JWT ID)：编号，该 jwt的唯一身份标识，主要用来作为一次性token,从而回避重放攻击。
   // 自定义字段
   userId
   role
}
```

3. Signature 签名 对前两部分 header 和 payload 进行签名，防止数据篡改

签名算法：`sign = HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)`

即对 header 和 payload 分别进行 base64UrlEncode 编码，然后通过`.`点号连接，再用指定算法加盐(secret)进行加密，生一个签名 signature

最后组成 `token = base64UrlEncode(header) + "." + base64UrlEncode(payload) + "." + sign`

> 这里base64UrlEncode 与常规的 base64 有些区别，有些场合可能会把 token 放到 URL 上作为查询参数传输，比如 `api.example.com/?token=xxx`。
> 但是http URL 规则里 +、/和= 这三个字符是有特殊含义的，相当于关键字，所以对签名算法生成的token中如果有这三个字符，要进行替换，约定为 =被省略、+替换成-，/替换成\_ 。这就是 Base64URL 算法。

#### jwt 的优势及注意事项

优势：

- 因为 json 的通用性，所以 JWT 是可以进行跨语言支持的，像 JAVA,JavaScript,NodeJS,PHP 等很多语言都可以使用。
- 因为有了 payload 部分，所以 JWT 可以在自身存储一些其他业务逻辑所必要的非敏感信息。
- 便于传输，jwt 的构成非常简单，字节占用很小，所以它是非常便于传输的。
- 它不需要在服务端保存会话信息, 所以它易于应用的扩展

注意事项：

- 不应该在 jwt 的 payload 部分存放敏感信息，因为该部分是客户端可 base64 反解密的。
- 保护好 secret 私钥，该私钥非常重要。secret 是保存在服务器端的，jwt 的签发生成也是在服务器端的，secret 就是用来进行 jwt 的签发和 jwt 的验证，所以，它就是你服务端的私钥，在任何场景都不应该流露出去。一旦客户端得知这个 secret, 那就意味着客户端是可以自我签发 jwt 了。
- 如果可以，请使用 https 协议。
- 在微服务或集群服务中，需要共享 secret，以便 jwt 验证。

鉴于 jwt 的优劣势，后续发展了安全性更高的 jws / jwe / jwk 等方案，但更普遍使用的仍然是 Jwt。

> [JWT、JWE、JWS 、JWK 都是什么鬼？还傻傻分不清？](https://juejin.cn/post/7031144825059704869)

#### jwt 用于认证流程

见下面 HTTP Bearer 介绍。

## HTTP Authentication

2014 年，HTTP 提供一个用于权限控制和认证的通用框架。服务器可以用来质询客户端的请求，客户端则可以提供身份认证凭据来证明“我是谁”的问题。

通用 HTTP Authentication 通用的身份谁框架可以被多种验证方案使用。不同的验证方案会在安全强度以及在客户端或服务器端软件中可获得的难易程度上有所不同。

IANA 维护了[一系列的验证方案](https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml)，目前包括：

- Basic: 基本认证，使用 base64 编码凭据
- Digest: 摘要认证，以前的版本仅支持 MD5 散列（不建议），现代浏览器，比如 Firefox 93 及更高版本支持 SHA-256 算法。
- Bearer: 令牌认证
- 其它还有一些不常见或特定场景下采用的方案。

被广泛使用的仍然是 Bearer 方案，其它方案因为不安全性或者复杂性原因都不流行。

### HTTP Basic

HTTP Basic 基本认证方案依赖于以下请求头：

- `WWWW-Authenticate: Basic realm=<realm>`
- `Authorization: Basic <credentials>`，其中 `credentials：base64(username:password)`

基本交互流程：

1. 获取请求头 Authorization
2. 如果没有，返回 401 Unauthorized，并设置请求 WWW-Authenticate，浏览器才能触发弹窗，输入用户名和密码表单
3. 解析得到认证方式和 base64 编码值(弹窗表单僌用户名和密码后，浏览器自动以base64编码，格式：username:password，并挂载到请求头 Authorization 中，再次触发请求)
4. 解析 base64 编码值得到用户名和密码，格式：username:password
5. 然后对认证方式、认证域、用户名、密码进行校验
6. 如果认证方式和认证域不同，则返回 403 Forbidden 拒绝访问。拒绝访问后，用户页面不刷新情况下无法再尝试认证。
7. 如果用户名和密码无效，则返回 401 Unauthorized
8. 认证成功返回后，浏览器会自动缓存认证结果，下一次同样路径无需再认证。
9. 认证缓存结果无法主动清除，浏览器端需要手动清除近期缓存（谷歌浏览器->清除浏览数据->密码和其它登录数据），才能再次出现认证弹窗

### HTTP Digest

HTTP Digest 摘要认证，注意以逗号分隔，`<>`中的字段都是加双引号，与 Basic 区别在于算法更复杂，基本交互流程基本一致。

- `WWW-Authenticate：Digest realm=<realm>, qop=<auth,auth-int>, nonce=<nonce>， algorithm=<algorithm>, stale=<stale>`
- `Authorization：Digest username=<username>, realm=<realm>, qop=<auth,auth-int>, nonce=<nonce>, uri=<uri> nc=<nc>, cnonce=<cnonce>, response=<response>`
- `Authentication-Info: nextnonce=<nextnonce> qop=<auth,auth-int> rspauth=<rspauth> cnonce=<cnonce>`

字段解释：

- type: Digest 表示以摘要的形式来进行认证
- realm：指示进行认证的范围
- qop: 保护质量，包含auth（默认的）和 auth-int（增加了报文完整性检测）两种策略，（可以为空，但是）不推荐为空值
- nonce：服务端向客户端发送质询时附带的一个随机数，这个数会经常发生变化。客户端计算密码摘要时将其附加上去，使得多次生成同一用户的密码摘要各不相同，用来防止重放攻击
- nc：nonce计数器，是一个16进制的数值，表示同一nonce下客户端发送出请求的数量。例如，在响应的第一个请求中，客户端将发送“nc=00000001”。这个指示值的目的是让服务器保持这个计数器的一个副本，以便检测重复的请求
- cnonce：客户端随机数，这是一个不透明的字符串值，由客户端提供，并且客户端和服务器都会使用，以避免用明文文本。这使得双方都可以查验对方的身份，并对消息的完整性提供一些保护
- response：这是由用户代理软件（浏览器）计算出的一个字符串，以证明用户知道口令。后续服务端需要相同规则计算后匹配它来判断认证
- Authorization-Info：认证成功，返回的响应头，用于返回一些与授权会话相关的附加信息
- nextnonce：下一个服务端随机数，使客户端可以预先发送正确的摘要
- rspauth：响应摘要，用于客户端对服务端进行认证
- stale：当密码摘要使用的随机数过期时，服务器可以返回一个附带有新随机数的401响应，并指定stale=true，表示服务器在告知客户端用新的随机数来重试，而不再要求用户重新输入用户名和密码了

摘要算法，有两种，默认：MD5，也可以指定 MD5-sess。具体看浏览器实现，以前的浏览器版本仅支持MD5散列，现在浏览器，比如 Firefox 93 及更高版本支持 SHA-256 算法。

默认MD5摘要算法规则：`MD5(MD5(A1):<nonce>:<nc>:<cnonce>:<qop>:MD5(A2))`，其中：

- A1 规则根据算法不同而不同：
  - 默认MD5：`<username>:<realm>:<password>`
  - MD5-sess: `MD5(<username>:<realm>:<password>):<nonce>:<cnonce>`
- A2 规则根据指定的 qop 值不同而不同：
  - 默认 auth: `<request-method>:<uri>`
  - auth-int: `<request-method>:<uri>:MD5(<request-entity-body>)`

### HTTP Bearer

HTTP Bearer 令牌认证。其中令牌的生成常见方式为 JWT（见上面）。

认证流程

1. 浏览器携带用户信息发起登录流程
2. 服务端根据用户信息到用户数据库验证身份
3. 身份验证通过后，将用户基本标识信息，按 jwt 规则，指定算法，生成 token，响应给浏览器
4. 浏览器接收后，将 token 保存在本地，后续每次请求时，主动将 token 通过 Authorization 请求带上
5. 服务端再次收到请求，获取 token，按 jwt 规则进行签名验证，验证通过则响应请求资源。

这里过程有几点注意：

1. 按jwt规则，对包含用户标识的部分数据没有严格加密，所以用户标识信息不要包含敏感数据，只包含用户标识即可。
2. 浏览器保存token方式没有强制规定，可以仍像 session 一样用 cookie 保存，但这样失去了jwt意义，所以一般会保存在 localStorage 中。
3. 再次请求时，如何携带token，也没有强制规定，可以放在查询参数中，也可以放在请求体中，但普遍做法是遵循 HTTP Authentication 认证框架中 bearer 方案，放在请求头 Authorization 中，然后服务器中从该请求字段读取并解析 token。

### OIDC

OIDC: OpenID Connect 联合身份认证。

> TODO

### OAuth

OAuth 是一个开放的认证和授权规范，按照它的约定可以有多种实现。

开头说了，认证的理解可以粗分为对内和对外，而 OAuth 就是用于对外开放资源的解决方案。理解它可以从两个视角来说：

- 站在应用角度：简单理解，就是允许用户的认证过程交给一个可信的第三方进行担保。这里的第三方可以公司自己部署的授信服务，也可以是外部应用，如微信，支付宝等。这种情况下，目的通常是为了从第三方获取到用户标识，来完成自身应用后续的授权和鉴权。类似于在银行里可以使用从派出所那里领到的身份证来证明你是谁。
- 站在提供 OAuth 服务的应用角度：OAuth 是一种认证第三方应用的解决方案。约定了一系列 HTTP 请求和响应的交互流程，识别出用户的身份和第三方应用身份，从而根据用户的授权，允许第三方应用从你这边获取用户相关的信息。这里的第三方应用指的就是业务应用。

OAuth 有两个版本：OAuth 1.0a 和 OAuth 2.0。这些规范彼此完全不同，不能一起使用：它们之间没有向后兼容性。OAuth 2.0 是使用最广泛的 OAuth 形式。因此，绝大部分场景中，每当说“OAuth”时，通常都是指 OAuth 2.0。

OAuth 具体介绍见下一章 [OAuth.md](./oauth.md)

### SSO (Single Sign On)

web系统由单系统发展成多系统组成的应用群，复杂性应该由系统内部承担，而不是用户。无论web系统内部多么复杂，对用户而言，都应该是一个统一的整体，也就是说，用户访问web系统的整个应用群与访问单个系统一样，登录和登出只要一次就够了。

单点登录（Single Sign On），简称为 SSO，是比较流行的企业业务子系统整合的解决方案之一。SSO 适用于在多个应用系统中，用户只需要登录一次就可以访问所有相互信任的应用系统，并且只要在某处操作登出，其它系统也同时注销登录状态。

具体介绍见 [SSO.md]('./sso.md')

## Passport

社区流行的统一认证框架 [Passport]('./passport.md')
