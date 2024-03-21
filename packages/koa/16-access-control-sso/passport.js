/*
 * @Date         : 2024-03-08 10:23:15 星期5
 * @Author       : xut
 * @Description  :
 */
import { randomBytes } from "node:crypto"
import Koa from "koa"
import Router from "@koa/router"
import { koaBody } from "koa-body"
import fetch from "node-fetch"

/**
 * 生成随机字符串
 *
 * 利用十六进制表示字符串。所以字符串长度  len * 4 / 8 = size，即 randomBytes(size) 的参数，表示要生成的字节数
 * 所以 len 最好是8的倍数
 * @param {number} len 字符串长度
 * @return {string}
 */
export function genRandomString(len) {
  const size = Math.floor((len * 4) / 8)
  return randomBytes(size).toString("hex")
}

const app = new Koa()
const router = new Router()

const services = ["www.a.com", "www.b.com"]
const ticketManagement = new Map()

/**
 * 子应用重定向到的登录页面
 * 1.如果当前没有全局会话凭证，显示登录表单
 * 2.如果全局会话已存在，再判断是否有携带服务名称，如果有，则生成局部应用的票据，并重定向子应用。
 */
router.get("/login", (ctx) => {
  const tgtId = ctx.cookies.get("TGC")

  if (ticketManagement.has(tgtId)) {
    const redirectUrl = ctx.query.redirect

    if (redirectUrl) {
      const newUrl = new URL("http://" + redirectUrl)
      const serverName = newUrl.hostname

      if (services.includes(serverName)) {
        const stId = genRandomString(16)
        const doc = ticketManagement.get(tgtId)
        doc.tickets.push(stId)
        newUrl.searchParams.set("ticket", stId)
        ctx.redirect(newUrl.href)
      } else {
        ctx.status = 401
        ctx.type = "html"
        ctx.body = `<h1>应用 ${serverName} 未知</h1>`
      }
    } else {
      ctx.type = "html"
      ctx.body = "<h1>登录成功!</h1>"
    }
  } else {
    ctx.type = "html"
    ctx.body = `
    <h1>统一登录passport</h1>
    <form method="post">
      <div>用户名：<input type="text" name="name"/></div>
      <div>密码：<input type="text" name="password"/></div>
      <div><input type="submit" value="登录"/></div>
    </form>
    `
  }
})

/**
 * 提交账号密码进行登录，校验正确后，生成全局会话 TGT
 * 然后如果携带服务名称，再生成服务票据 ST，并与 TGT 关联，然后重定向到子服务页面
 *
 */
router.post("/login", (ctx) => {
  const { name, password } = ctx.request.body

  if (name === "root" && password === "123") {
    const tgtId = genRandomString(16)

    const doc = {
      tgtId,
      tickets: [],
      logins: [],
    }

    ticketManagement.set(tgtId, doc)

    ctx.cookies.set("TGC", tgtId, {
      domain: ctx.hostname,
      maxAge: 30 * 60 * 1000,
      httpOnly: false,
    })

    const redirectUrl = ctx.query.redirect

    if (redirectUrl) {
      const newUrl = new URL("http://" + redirectUrl)
      const serverName = newUrl.hostname

      if (services.includes(serverName)) {
        const stId = genRandomString(16)
        const doc = ticketManagement.get(tgtId)
        doc.tickets.push(stId)
        newUrl.searchParams.set("ticket", stId)
        ctx.redirect(newUrl.href)
      } else {
        ctx.status = 401
        ctx.type = "html"
        ctx.body = `<h1>应用 ${serverName} 未知</h1>`
      }
    } else {
      ctx.type = "html"
      ctx.body = "<h1>登录成功!</h1>"
    }
  } else {
    ctx.html = "html"
    ctx.body = "用户名或密码错误"
  }
})

/**
 * 局部应用登出时，重定向到认证服务的登出接口,
 * 此时浏览器会携带全局会话 cookie，拿到 TGT,
 * 遍历出所有已登录局部应用的登出接口进行请求
 *
 */
router.get("/logout", async (ctx) => {
  const tgtId = ctx.cookies.get("TGC")

  ctx.cookies.set("TGC", null, {
    domain: ctx.hostname,
    expires: new Date(),
    httpOnly: false,
  })

  if (!ticketManagement.has(tgtId)) {
    ctx.type = "html"
    ctx.body = `无效的全局凭证 ${tgtId}`
    return
  }

  const logins = ticketManagement.get(tgtId).logins

  for (const item of logins) {
    await fetch(`${item.logoutUrl}?ticket=${item.stId}`, { method: "POST" })
  }

  ticketManagement.delete(tgtId)

  const redirectUrl = ctx.query.redirect

  if (redirectUrl) {
    const newUrl = new URL("http://" + redirectUrl)
    const serverName = newUrl.hostname

    if (services.includes(serverName)) {
      const redirectUrl = `http://passport.com:8080/login?redirect=${newUrl.host}`
      ctx.type = "html"
      ctx.body = `
      <h1>注销成功</h1>
      <a href=${redirectUrl}>携带应用跳转登录 ${redirectUrl}</a>
      `
    } else {
      ctx.status = 401
      ctx.type = "html"
      ctx.body = `<h1>应用 ${serverName} 未知</h1>`
    }
  } else {
    ctx.type = "html"
    ctx.body =
      "<h1>注销成功</h1><a href=http://passport:8080/login>点击登录</a>"
  }
})

/**
 * 局部会话的票据检查
 */
router.get("/check_ticket", (ctx) => {
  const stId = ctx.query.ticket
  const serverName = ctx.query.service

  for (const doc of ticketManagement.values()) {
    if (doc.tickets.includes(stId)) {
      doc.logins.push({ stId, logoutUrl: `http://${serverName}/logout` })
      ctx.status = 200
      ctx.body = { uid: "root", tgtId: doc.tgtId }
      return
    } else {
      ctx.status = 500
      ctx.body = "凭证错误"
      break
    }
  }
})

app.use(koaBody()).use(router.routes()).use(router.allowedMethods())

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Server passport.com listening on port: ${port}`)
})
