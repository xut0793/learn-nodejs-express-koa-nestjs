/*
 * @Date         : 2023-12-23 20:35:33 星期6
 * @Author       : xut
 * @Description  : 02-ctxuest 请求参数获取
 *
 * - 请求参数 `ctx.method / ctx.protocol / ctx.originalUrl / ctx.url / ctx.path`
 * - 查询参数 query，这个可以直接通过 `ctx.query / ctx.ctx.query` 获取，因为 koa 内部通过 qs 依赖包完成了解析。
 * - 路径参数 params，动态路由需要安装 `@koa/router` 配置路由，然后通过 `ctx.params` 获取。
 * - 请求体 body，需要安装 `koa-body` 依赖包进行解析，然后通过 `ctx.ctx.body` 获取，
 *               这个中间件会自动处理不同的 Content-Type 情况(`x-www-form-urlencoded / multipart/form-data / application/json / octet-stream`)，
 *               比较特殊的是，如果有上传文件的话 `multipart/form-data`，通过 `ctx.ctx.files` 获取，koa-body 内部依赖于 formidable 来解析 form-data 数据。
 * - 请求头 `ctx.headers`
 *   - cookie，通过 `ctx.cookies` 直接读写对象，内部通过 `cookies` 依赖包解析实现。
 *   - `ctx.headers.authorization`，或者 `ctx.get('authorization')`
 */

/******************************************************
 * koa-body 的配置 options
 * 
{
  patchNode: false, // 是否将解析出的 body 数据对象附加到 ctx.req 上。
  patchKoa: true, // 是否将解析出的 body 数据对象附加到 ctx.request 上。
  jsonLimit: '1mb', // json 对象字节数大小的限制
  formLimit: '56kb', // form body 字节数的限制
  textLimit: '56kb', // text body 字节数的限制
  encoding: "uft-8",
  multipart: false, // 是否解析 multipart/form-data 文件上传的数据
  urlencoded: true, // 解析 x-www-form-urlencoded 表单数据
  text: true, // 解析 text body,如 xml 等
  json: true, // 解析 json body
  jsonStrict: true, // 切换json严格模式;如果设置为true 只解析数组或对象
  includeUnparsed: false, // 如果设置 true，将原始的 encoded / json 请求体通过 Symbol 附加到 ctx.request.body
  formidable: {}, // 对象 multipart/form-data 数据解析依赖 formidable 包的选项对象
  onError: function, // 解析失败的回调函数
  parsedMethods: ['POST', 'PUT', 'PATCH'], // 需要对正文进行解析的HTTP方法，常规上，不会对 GET/HEAD/DELETE方法上挂载 body.
}

* 其中关于文件上传的配置 formidable 见 file.js 文件
 ***************************************************/

import koa from "koa"
import { koaBody } from "koa-body"
import Router from "@koa/router"

const app = new koa()
const router = new Router()

router.get("/url", (ctx) => {
  ctx.body = {
    method: ctx.method,
    url: ctx.url,
    protocol: ctx.protocol,
    hostname: ctx.hostname,
    secure: ctx.secure,
    pathname: ctx.pathname,
  }
})

router.get("/query", (ctx) => {
  ctx.body = ctx.query
})

router.get("/params/:id", (ctx) => {
  ctx.body = ctx.params
})

router.post("/body/urlencoded", (ctx) => {
  ctx.body = ctx.request.body
})

router.post("/body/json", async (ctx) => {
  ctx.body = ctx.request.body
})

router.get("/headers", async (ctx) => {
  ctx.body = ctx.headers
})

router.post("/headers/type", (ctx) => {
  const contentType = ctx.get("content-type")
  const authorization = ctx.get("authorization")

  ctx.body = { contentType, authorization }
})

app.use(koaBody()).use(router.routes()).use(router.allowedMethods())
app.use(async (ctx) => {
  ctx.body = "Hello World By koa"
})

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
