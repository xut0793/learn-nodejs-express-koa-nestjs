/*
 * @Date         : 2024-03-08 10:23:35 星期5
 * @Author       : xut
 * @Description  :
 */
import Koa from "koa"
import Router from "@koa/router"
import fetch from "node-fetch"

const app = new Koa()
const router = new Router()

const tickets = new Set()

router.get("/logout", (ctx) => {
  ctx.redirect(`http://passport.com:8080/logout?redirect=${ctx.host}`)
})

router.post("/logout", (ctx) => {
  const stId = ctx.query.ticket

  if (tickets.has(stId)) {
    tickets.delete(stId)
  }

  ctx.status = 200
  ctx.body = "成功失效"
})

router.get("/", async (ctx) => {
  const user = ctx.state.user

  if (user) {
    // 如果存在用户信息，说明已经登录过了，直接响应

    ctx.type = "html"
    ctx.body = `请求成功，用户信息：${JSON.stringify(user)}`
    return
  }

  // 如果局部会话存在，则添加用户信息
  const stId = ctx.cookies.get("ST")

  if (tickets.has(stId)) {
    ctx.type = "html"
    ctx.body = `请求成功，存在局部会话 ST：${stId}`
    return
  }

  /**
   * 如果没有用户信息，也没有本地会话，则没有登录过，需要去 password 服务进行身份认证。这里分两种情况：
   *
   * 1. 如果 url 中带有 ticket 信息，则去 password 服务中认证 ticket 有效性，如果有效，说明全局会话已登录，则建立当前局部会话。
   * 2. 如果 url 中没有 ticket 信息，则去 passport 进行登录。如果登录成功，passport 会将浏览器重定向到此系统并在 url 上附带 token 信息。进行步骤 1。
   */
  const ticketId = ctx.query.ticket

  if (!ticketId) {
    ctx.redirect(
      `http://passport.com:8080/login?redirect=${ctx.host + ctx.originalUrl}`
    )
  } else {
    try {
      const fetchRes = await fetch(
        `http://passport.com:8080/check_ticket?ticket=${ticketId}&service=${
          ctx.host
        }&t=${Date.now()}`
      )

      if (fetchRes.status == 200) {
        const data = await fetchRes.json()
        console.log("可以从这里获取用户信息", data.uid)
        tickets.add(ticketId)

        ctx.cookies.set("ST", ticketId, {
          domain: ctx.hostname,
          maxAge: 30 * 60 * 1000,
          httpOnly: false,
        }) // 30 minute
        ctx.type = "html"
        ctx.body = `ticket 票据认证有效，创建局部会话 uid：${data.uid}`
      } else {
        ctx.redirect(
          `http://passport.com:8080/login?redirect=${
            ctx.host + ctx.originalUrl
          }`
        )
      }
    } catch (error) {
      console.error(error)
      ctx.redirect(
        `http://passport.com:8080/login?redirect=${ctx.host + ctx.originalUrl}`
      )
    }
  }
})

app.use(router.routes()).use(router.allowedMethods())

const port = process.env.PORT || 8081
app.listen(port, () => {
  console.log(`Server ${process.env.SERVICE_NAME} listening on port: ${port}`)
})
