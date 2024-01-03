/*
 * @Date         : 2024-01-03 19:48:05 星期3
 * @Author       : xut
 * @Description  : HTTP 响应
 *
 * 一、响应报文
 * HTTP/1.1 200 OK                             // 协议版本 状态码 状态描述
 * Content-Length: 1024
 * Content-Type: application/json
 *
 * {"code":200,"message":null,"data":"xxx"}
 *
 * 二、响应数据设置
 * 1.状态码和状态文本 ctx.status / ctx.message
 * 2.响应头 ctx.set(field, value) / ctx.set({field: value}) / ctx.remove(field) /  ctx.has(field) / ctx.type / ctx.attachment(filename, options) / ctx.cookies
 * 3.响应体 ctx.body / ctx.throw(status, msg)
 * 4.重定向 ctx.redirect()
 */
import { resolve } from "node:path"
import { createReadStream } from "node:fs"
import koa from "koa"
import Router from "@koa/router"

const app = new koa()
const router = new Router()

// 需要在这里设置一个用于 cookies 签名的密钥
app.keys = ["__secret__"]

router.get("/status-code", (ctx) => {
  ctx.status = 200
})

router.get("/header", (ctx) => {
  ctx.set("Content-Type", "text/html")
  ctx.set("X-Power-By", "koa")
  ctx.set("X-Foo", "bar")

  if (ctx.has("x-foo")) {
    ctx.remove("x-foo")
  }

  ctx.status = 200
  ctx.body = "<h1>koa header</h1>"
})

router.get("/cookie/set", (ctx) => {
  ctx.cookies.set("name", "li lei", { path: "/", maxAge: 5000 })
  ctx.body = "cookie set"
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

router.get("/redirect", (ctx) => {
  ctx.redirect("http://www.bing.com")
})

/**
 * 如果没有设置 response.status，Koa 会根据 response.body 自动将状态设置为 200 或 204。
 * 如果 response.body 没有设置或者已经设置为 null 或 undefined，Koa 会自动将 response.status 设置为 204
 * 如果 response.body 有内容,则会设置 200
 *
 * 另外会根据 body 的内容,来设置 content-type 响应头
 * 1. 如果是字符串, Content-Type 默认为 text/html 或 text/plain，两者的默认字符集均为 utf-8。 还设置了内容长度字段。
 * 2. 如果是对象, Content-Type 默认为 application/json。 这包括普通对象 { foo: 'bar' } 和数组 ['foo', 'bar']。
 * 3. 如果是 buffer, Content-Type 默认为 application/octet-stream，并且还设置了 Content-Length。
 * 4. 如果是 stream, Content-Type 默认为 application/octet-stream。
 */
router.get("/body/text", (ctx) => {
  ctx.type = "text/plain"
  ctx.body = "/body/text"
})

router.get("/body/html", (ctx) => {
  ctx.type = "html"
  ctx.body = "<h1>/body/html</h1>"
})

router.get("/body/json", (ctx) => {
  // ctx.type = 'json'
  ctx.body = { author: "lisa", createTime: Date.now() }
})

router.get("/body/download", (ctx) => {
  const filename = "test.txt"
  const filePath = resolve(process.cwd(), "../../public", filename)
  ctx.attachment(filename, { type: "attachment" })
  ctx.body = createReadStream(filePath)
})

router.get("/body/file", (ctx) => {
  const filename = "test.txt"
  const filePath = resolve(process.cwd(), "../../public", filename)
  ctx.body = createReadStream(filePath)
})

app.use(router.routes()).use(router.allowedMethods())
app.use((ctx) => {
  ctx.status = 404
})
app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
