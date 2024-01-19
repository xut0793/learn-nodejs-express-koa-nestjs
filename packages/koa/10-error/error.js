/*
 * @Date         : 2024-01-11 19:41:24 星期4
 * @Author       : xut
 * @Description  :
 */
import Koa, { HttpError } from "koa"
import Router from "@koa/router"

const router = new Router({ prefix: "/error" })

router.get("/", (ctx) => {
  ctx.body = "10-error"
})

router.get("/ctx-throw", (ctx) => {
  // 默认响应 500
  const err = ctx.throw()
  console.log("err instanceof HttpError: ", err instanceof HttpError)
  throw err
})

router.get("/throw", (ctx) => {
  // 如果没有中间件处理错误的话，这个抛出错误的信息不会被响应，只会响应 500 Internal Server Error
  throw new Error("throw new Error")
})

router.get("/reject", (ctx) => {
  // 同上 /throw，如果没有中间件处理错误的话，这个抛出错误的信息不会被响应，只会响应 500 Internal Server Error
  return Promise.reject("Promise reject")
})

router.get("/next", (ctx, next) => {
  console.log("/next >>>")
  // 无用
  next(new Error("/next"))
})

router.get("/try-catch", async (ctx) => {
  try {
    console.log("/try-catch >>>")
    throw new Error("throw try-catch error")
  } catch (error) {
    return Promise.reject(error)
  }
})

router.get("/try-catch-next", async (ctx, next) => {
  try {
    console.log("/try-catch-next >>>")
    throw new Error("throw try-catch error to next(error)")
  } catch (error) {
    next(error)
  }
})

router.get("/http-errors", (ctx) => {
  console.log("/http-errors >>>")
  const err = new HttpError("http-errors")
  ctx.body = err
})

router.get("/assert", (ctx) => {
  try {
    console.log("/assert >>>")
    ctx.assert(null, 401, "please login!")
  } catch (error) {
    console.log(error.status, error.message)
    ctx.throw(error)
  }
})

const app = new Koa()

app.use(async (ctx, next) => {
  await next().catch((error) => {
    // koa 默认响应错误为 404
    ctx.status = 500
    ctx.body = error.toString()
  })
})

// app.use(async (ctx, next) => {
//   try {
//     await next()
//   } catch (error) {
//     console.log("2 try catch error >>>")
//   }
// })

app.use(router.routes()).use(router.allowedMethods())

// app.use 已经捕获错误，这里不会执行
app.on("error", (err, ctx) => {
  console.log("on error >>>", err, ctx.version)
})
app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
