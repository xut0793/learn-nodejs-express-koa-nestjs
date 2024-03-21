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

export const router = Router()

const __secret__ = "secret@!d23434"
const signCookieParser = cookieParser(__secret__, { decode: false })
// 当 decode 为 true 时， req.signedCookies 为空对象，所以有 cookie，即使已签名的 cookie 都会被附加到 req.cookies 对象上了。

// 实际业务中将数据存储在数据库
const users = [{ uid: "1", role: "admin", account: "root", password: "123" }]

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
    res.cookie("uid", user.uid, {
      path: "/",
      maxAge: 10000, // 10s 过期
      // httpOnly: true, // httponly=true 时，浏览器控制台中 cookie 不可见
      signed: true,
    })
    res.cookie("role", user.role, {
      path: "/",
      maxAge: 10000 /**httpOnly: true*/,
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
  /**
   * signedCookies 的使用要注意两点：
   * 1.当cookie-parser 调用时，传入 decode 为 true 时， req.signedCookies 为空对象，所以有 cookie，即使已签名的 cookie 都会被附加到 req.cookies 对象上了。
   * 2.签名加密的 cookie 需要从 signedCookies 获取，如果值是 false，则被篡改了
   */
  const uid = req.signedCookies["uid"]
  const role = req.cookies["role"]

  console.log("🚀 ~ router.get ~ signedCookies:", req.signedCookies)
  console.log("🚀 ~ router.get ~ cookies:", req.cookies)

  if (uid === false) {
    res.status(403).json({
      code: "-1",
      msg: "403 已签名的 cookie singed 的值已被篡改，无效了",
      data: null,
    })
    return
  }

  if (role !== "admin") {
    res
      .status(403)
      .json({ code: "-1", msg: "403 非管理员权限，拒绝访问", data: null })
    return
  }

  const user = users.find((i) => i.uid === uid)
  if (!user) {
    res.status(410).json({ code: "-1", msg: "410 用户不存在", data: null })
    return
  }

  res.status(200).json({ code: "0", msg: "ok", data: user })
})
