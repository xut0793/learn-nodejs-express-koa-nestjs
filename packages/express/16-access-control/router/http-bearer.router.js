/*
 * @Date         : 2024-02-28 15:18:37 星期3
 * @Author       : xut
 * @Description  : 认证方案为 HTTP bearer jwt
 *
 *  WWWW-Authenticate: Bearer realm=<realm>
 *  Authorization: Bearer <credentials>，其中 credentials 采用 jwt 规范生成的 token
 *
 * 流程：
 * 1. 浏览器携带用户信息发起登录流程
 * 2. 服务端根据用户信息到用户数据库验证身份
 * 3. 身份验证通过后，将用户基本标识信息，按 jwt 规则，指定算法，生成 token，响应给浏览器
 * 4. 浏览器接收后，将 token 保存在本地，后续每次请求时，主动将 token 通过 Authorization 请求带上
 * 5. 服务端再次收到请求，获取 token，按 jwt 规则进行签名验证，验证通过则响应请求资源。
 */
import { Router } from "express"
import * as jwt from "../utils/jwt.util.js"

export const router = Router()

// 实际业务中将数据存储在数据库
const users = [{ uid: "1", role: "admin", account: "root", password: "123" }]
const __SECRET__ = "abc123" // 服务端存储的密钥

function parseAuthorizationBearer(authorization) {
  const parsed = authorization.split(" ")

  if (parsed?.length !== 2) {
    throw new Error("authorization 格式不正确")
  }
  return {
    type: parsed[0],
    token: parsed[1],
  }
}

function authenticate(req, res, next) {
  try {
    const authorization = req.headers["authorization"]

    const { type, token } = parseAuthorizationBearer(authorization)

    if (!(typeof type === "string" && type.toLowerCase() === "bearer")) {
      throw new Error(`HTTP Basic 验证中类型 ${type}不符，拒绝访问`)
    }

    const isValid = jwt.verify(token, __SECRET__)

    if (!isValid) throw new Error("token 无效")

    const jwtObj = jwt.decode(token)

    req.user = jwtObj.payload

    next()
  } catch (error) {
    res.status(403).json({
      code: "-1",
      msg: error.message,
      data: null,
    })
  }
}

/**
 * 用户登录
 *
 * 1.检查用户账号和密码是否匹配，存在用户
 * 2.不存在时，理想情况下是响应详细信息，到底是账号不对，还是密码错误。但为了避免穷举等安全风险，在此环节是避免透露详细报错信息的。
 */
router.post("/login", (req, res) => {
  const params = req.body

  const { account, password } = params

  const user = users.find(
    (i) => i.account === account && i.password === password
  )

  if (user) {
    const jwtPayload = {
      uid: user.uid,
      role: user.role,
      exp: Date.now() + 24 * 3600 * 1000, // 1天
    }

    const token = jwt.createJwt(jwtPayload, __SECRET__)

    res.json({
      code: 0,
      msg: "ok",
      data: {
        access_token: token,
        type: "Bearer",
        user,
      },
    })
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
router.get("/user", authenticate, (req, res) => {
  const uid = req.user?.uid
  const user = users.find((i) => i.uid === uid)

  if (!user) {
    res.status(410).json({ code: "-1", msg: "410 用户不存在", data: null })
    return
  }

  res.status(200).json({ code: "0", msg: "ok", data: user })
})
