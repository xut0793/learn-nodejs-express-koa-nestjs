/*
 * @Date         : 2023-12-23 20:35:44 星期6
 * @Author       : xut
 * @Description  : koa 的 cookie 解析已经内置，内部由 cookie 包提供支持
 *                 1. 获取 ctx.cookies.get(name)
 *                 2. 设置 ctx.cookies.set(name, value, options)
 *
 * 如果需要设置签名的cookies.set(name, value, {signed: true})，则同时需要设置 app.keys = ['secret']，否则会报错
 * 对于已签名的值获取同时需要 cookie.get(name, {signed: true})，如果值被篡改，则返回空。
 *
 * options
 *
 * domain： 指示 cookie 域的字符串（无默认值）。
 * path： 指示 cookie 路径的字符串（默认为 /）。
 * secure： 一个布尔值，指示 cookie 是否仅通过 HTTPS 发送（HTTP 默认为 false，HTTPS 默认为 true）。 阅读有关此选项的更多信息。
 * httpOnly： 一个布尔值，指示 cookie 是否仅通过 HTTP(S) 发送，而不可供客户端 JavaScript 使用（默认为 true）。
 * maxAge： 一个数字，表示从 Date.now() 到到期的毫秒数。
 * expires： 一个 Date 对象，指示 cookie 的到期日期（默认在会话结束时到期）。
 * sameSite： 一个布尔值或字符串，指示 cookie 是否为 "同一站点" cookie（默认为 false）。 可以将其设置为 'strict'、'lax'、'none' 或 true（映射到 'strict'）。
 * signed： 一个布尔值，指示 cookie 是否要签名（默认为 false）。 如果这是 true，则还将发送附加有 .sig 后缀的另一个同名 cookie，其中包含 27 字节 url 安全的 base64 SHA1 值，表示 cookie-name=_cookie-value 与第一个 要点 密钥的哈希值。 该签名密钥用于在下次接收到 cookie 时检测篡改情况。
 * overwrite： 一个布尔值，指示是否覆盖先前设置的同名 cookie（默认为 false）。 如果这是 true，则在设置此 cookie 时，在同一请求期间设置的具有相同名称（无论路径或域）的所有 cookie 都会从 Set-Cookie 标头中过滤掉。
 *
 */
import Koa from "koa"
import Router from "@koa/router"

const app = new Koa()
const router = new Router()

// 需要在这里设置一个用于 cookies 签名的密钥
app.keys = ["__secret__"]

router.get("/cookie/get", (ctx) => {
  ctx.body = ctx.cookies.get("name")
})

router.get("/cookie/set", (ctx) => {
  ctx.cookies.set("name", "li lei", { path: "/", maxAge: 5000 })
  ctx.body = "cookie set"
})

router.get("/cookie/sign-get", (ctx) => {
  const passwordValue = ctx.get("password", { singed: true })

  if (!passwordValue) {
    ctx.throw(401, "已签名的 cookie password 的值已被改动，失效了")
    return
  }

  ctx.body = {
    cookies: ctx.cookies.get("password"),
    singed: ctx.cookies.get("password", { signed: true }),
  }
})

router.get("/cookie/sign-set", (ctx) => {
  ctx.cookies.set("name", "lisa")

  /**
   * koa 这里的签名，不同于 express
   * 这里 signed=true 后，客户端接收的 password 值还是 123，
   * 只不过同时还会有一个同名但添加了 password.sig 的cookie，用于校次服务端校验 cookie 是否有改动
   * 如果改动了，ctx.cookies.get(name) 值为空。
   */
  ctx.cookies.set("password", "123", { signed: true })
  ctx.body = "singed cookies"
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
