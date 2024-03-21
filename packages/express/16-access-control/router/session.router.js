/*
 * @Date         : 2024-03-02 15:28:56 星期6
 * @Author       : xut
 * @Description  : express 中 cookie 的解析依赖于 cookie-parser。会将提取的对象放在 req.cookies 上。req.signedCookies（如果已签名的值在客户端有被改动，则读取的值为false)
 *                           cookie 的设置 express 提供了内置实现，内部依赖于 cookie 包，res.cookie(key, value, options)
 *                           cookie 清除，则可以调用 res.clearCookie(name, options)
 *
 * 更详细的用法可以参照 02-request/cookie.js
 */
import { Router } from "express"
import cookieParser from "cookie-parser"
import { genRandomString } from "../utils/helper.js"

export const router = Router()

const __secret__ = "secret@!d23434"
const signCookieParser = cookieParser(__secret__, { decode: false })
// 当 decode 为 true 时， req.signedCookies 为空对象，所以有 cookie，即使已签名的 cookie 都会被附加到 req.cookies 对象上了。

// 实际业务中将数据存储在数据库
const users = [{ uid: "1", role: "admin", account: "root", password: "123" }]

// 实例业务中存储在数据库中，如 redis
const sessionMap = new Map()

/**
 * 用户登录
 *
 * 1.检查用户账号和密码是否匹配，存在用户
 * 2.不存在时，理想情况下是响应详细信息，到底是账号不对，还是密码错误。但为了避免穷举等安全风险，在此环节是避免透露详细报错信息的。
 */
router.post("/login", signCookieParser, (req, res) => {
  const params = req.body

  const { account, password } = params

  const user = users.find(
    (i) => i.account === account && i.password === password
  )

  if (user) {
    const sessionID = genRandomString(16)
    sessionMap.set(sessionID, user)

    res.cookie("SESSIONID", sessionID, {
      path: "/",
      maxAge: 10000, // 10s过期
      // httpOnly: true,
    })
    res.json({ code: 0, msg: "ok", data: { params, user } })
  } else {
    res.status(401).json({
      code: "-1",
      msg: "登录失败，请检查用户名或密码是否正确",
      data: null,
    })
  }
})

/**
 * 获取用户列表
 */
router.get("/user", signCookieParser, (req, res) => {
  const sessionID = req.cookies["SESSIONID"]

  console.log("🚀 ~ router.get ~ cookies:", req.cookies)

  if (!sessionID) {
    res.status(403).json({
      code: "-1",
      msg: "403  cookie SESSIONID 不存在",
      data: null,
    })
    return
  }

  const user = sessionMap.get(sessionID)

  if (!user) {
    res.status(410).json({ code: "-1", msg: "410 用户不存在", data: null })
    return
  }

  res.status(200).json({ code: "0", msg: "ok", data: user })
})
