/*
 * @Date         : 2024-03-07 16:47:35 星期4
 * @Author       : xut
 * @Description  :
 */
import { createReadStream } from "node:fs"
import { resolve } from "node:path"
import express from "express"
import cookieParser from "cookie-parser"
import fetch from "node-fetch"
import cors from "cors"

function renderIndexPage(res) {
  const loginHtmlPath = resolve(
    process.cwd(),
    "./16-access-control-sso/public/a.index.html"
  )
  res.type("html")
  createReadStream(loginHtmlPath).pipe(res)
}

const CAS_URI = "http://cas.com:8080"
const port = process.env.PORT || 8081
const serverTickets = new Set()

/**
 * 身份校验中间件
 * 1.如果存在用户信息，说明已经登录过了，直接响应
 * 2.如果局部会话存在，则添加用户信息
 * 3.如果没有用户信息，也没有本地会话，则没有登录过，需要去 cas 服务进行身份认证。这里分两种情况：
 *   3.1. 如果 url 中带有 ticket 信息，则去 cas 服务中认证 ticket 有效性，如果有效，说明全局会话已登录，则建立当前局部会话。
 *   3.2. 如果 url 中没有 ticket 信息，则去 cas 进行登录。如果登录成功，cas 会将浏览器重定向到此系统路径上，并附带 token 信息。进行步骤 1。
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns
 */
async function authenticateMiddleware(req, res, next) {
  //如果存在用户信息，说明已经登录过了，直接响应
  if (req.user) return next()

  const sessionId = req.cookies["SESSIONID"]
  // 如果局部会话存在，则添加用户信息
  if (serverTickets.has(sessionId)) return next()

  const stId = req.query.ticket

  /**
   * 如果没有用户信息，也没有本地会话，则没有登录过，需要去 cas 服务进行身份认证。这里分两种情况：
   *
   * 1. 如果 url 中带有 ticket 信息，则去 cas 服务中认证 ticket 有效性，如果有效，说明全局会话已登录，则建立当前局部会话。
   * 2. 如果 url 中没有 ticket 信息，则去 cas 进行登录。如果登录成功，cas 会将浏览器重定向到此系统路径上，并附带 token 信息。进行步骤 1。
   */
  if (stId) {
    const fetchRes = await fetch(
      `${CAS_URI}/serviceValidate?ticket=${stId}&service=${req.hostname}`
    )

    if (fetchRes.status == 200) {
      const resData = await fetchRes.json()
      console.log("🚀 ~ authenticateMiddleware ~ resData:", resData)

      req.user = resData.user
      serverTickets.add(stId)

      res.cookie("SESSIONID", stId, {
        domain: req.hostname,
        maxAge: 30 * 60 * 1000,
        httpOnly: false,
      })
      // 这里重定向一次，第二次 url 没有 ticket，避免 ST 长时间暴露在地址栏中
      return res.redirect("/")
    }
  }

  return res.redirect(`${CAS_URI}/login?service=${req.hostname}`)
}

const app = express()
app.use(cors())
app.use(cookieParser())

/**
 * 如果访问系统登出接口，重定向到 CAS 服务的登出接口，注销全局会话及所有已登录服务
 */
app.get("/logout", (req, res) => {
  res.redirect(`${CAS_URI}/logout?service=${req.hostname}`)
})

/**
 * 登出接口，提供给 CAS 服务调用，注销局部会话
 */
app.post("/logout", (req, res) => {
  const stId = req.query.ticket

  if (serverTickets.has(stId)) {
    serverTickets.delete(stId)
  }

  res.status(200).json({ code: "0", msg: "ok", data: null })
})

/**
 * 其它所有接口都进行身份校验
 */
app.get("*", authenticateMiddleware, (req, res) => {
  res.type("html")
  res.send(`单点登录成功，当前应用服务：${process.env.SERVICE_NAME}`)
})

app.listen(port, () => {
  console.log(`Server ${process.env.SERVICE_NAME} listening on port: ${port}`)
})
