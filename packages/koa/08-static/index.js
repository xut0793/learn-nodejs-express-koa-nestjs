/*
 * @Date         : 2024-01-08 20:29:42 星期1
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import Koa from "koa"
import koaStaticCache from "koa-static-cache"
const app = new Koa()

app.use(
  koaStaticCache(resolve(process.cwd(), "./08-static/public"), {
    prefix: "/static", // 如果当前请求的url是以/static开始，则作为静态资源请求
    maxAge: "1d", // 强缓存时间，单位秒，默认0
    gzip: true, // 启用 gzip 压缩，默认 true
  })
)

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
