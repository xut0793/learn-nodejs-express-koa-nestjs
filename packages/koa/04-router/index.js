import koa from "koa"
import userRouter from "./user.router.js"
import orderRouter from "./order.router.js"

const app = new koa()
app.use(userRouter.routes()).use(userRouter.allowedMethods())
app.use(orderRouter.routes()).use(orderRouter.allowedMethods())

/**
 * routes() 组装好所有路由，作为中间件提供给 koa 调用。
 * allowedMethods(options)
 * options = {
 *    throw: boolean, // 直接抛出错误，而不是设置状态和头
 *    notImplemented: function, // 遇到客户端请求未实现的 HTTP 方法时，自定义响应行为，以覆盖内部默认行为。
 *    methodNotAllowed: function, // 遇到客户端请求不允许的方式时，自定义响应行为，以覆盖内部默认行为。
 * }
 */

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
