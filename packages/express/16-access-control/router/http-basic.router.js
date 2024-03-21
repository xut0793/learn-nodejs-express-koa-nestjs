/*
 * @Date         : 2024-02-28 15:18:37 星期3
 * @Author       : xut
 * @Description  : 认证方案为 HTTP Basic
 *
 *  WWWW-Authenticate: Basic realm=<realm>
 *  Authorization: Basic <credentials>，其中 credentials：base64(username:password)
 *
 * 1.获取请求头 Authorization
 * 2.如果没有，返回 401 Unauthorized，并设置请求 WWW-Authenticate，浏览器才能触发弹窗，输入用户名和密码表单
 * 3.解析得到认证方式和base64编码值(弹窗表单僌用户名和密码后，浏览器自动以base64编码，格式：username:password，并挂载到请求头 Authorization 中，再次触发请求)
 * 4.解析base64编码值得到用户名和密码，格式：username:password
 * 5.然后对认证方式、认证域、用户名、密码进行校验
 * 6.如果认证方式和认证域不同，则返回 403 Forbidden 拒绝访问。拒绝访问后，用户页面不刷新情况下无法再尝试认证。
 * 7.如果用户名和密码无效，则返回 401 Unauthorized
 * 8.认证成功返回后，浏览器会自动缓存认证结果，下一次同样路径无需再认证。
 * 9.认证缓存结果无法主动清除，浏览器端需要手动清除近期缓存（谷歌浏览器->清除浏览数据->密码和其它登录数据），才能再次出现认证弹窗
 */
import { Router } from "express"

export const router = Router()

// 实际业务中将数据存储在数据库
const users = [{ uid: "1", role: "admin", account: "root", password: "123" }]

function genAuthorizationBasicToken(account, password) {
  const credentials = Buffer.from(`${account}:${password}`, "utf8").toString(
    "base64"
  )

  return credentials
}

function parseAuthorizationBasic(authorization) {
  const parsed = authorization.split(" ")

  if (parsed?.length !== 2) {
    throw new Error("authorization 格式不正确")
  }
  const type = parsed[0]
  console.log("type: ", type)

  const base64Credentials = parsed[1]
  console.log("base64: ", base64Credentials)

  const credentials = Buffer.from(base64Credentials, "base64").toString("utf8")
  const [account, password] = credentials.split(":")
  console.log("account: %s, password: %s", account, password)

  return {
    type,
    account,
    password,
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
    res.json({
      code: 0,
      msg: "ok",
      data: {
        access_token: genAuthorizationBasicToken(account, password),
        type: "Basic",
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
router.get("/user", (req, res) => {
  const authorization = req.headers["authorization"]

  if (!authorization) {
    /**
     * 这里有两种处理：
     * 1. 如果没有凭证，直接响应 403 拒绝访问，让用户登录页面输入账号和密码
     * 2. 或者利用 HTTP Authentication 的机制，响应 WWW-Authenticate 头字段，浏览器弹出弹窗，让用户输入账号和密码，这是浏览器的默认机制
     */
    res.set("WWW-Authenticate", 'Basic realm="Test"')
    res.status(401).json({ code: "-1", msg: "401 未授权访问", data: null })
    return
  }

  const { type, account, password } = parseAuthorizationBasic(authorization)

  if (!(typeof type === "string" && type.toLowerCase() === "basic")) {
    res.status(403).json({
      code: "-1",
      msg: `HTTP Basic 验证中类型 ${type}不符，拒绝访问`,
      data: null,
    })

    return
  }

  const user = users.find(
    (i) => i.account === account && i.password === password
  )

  if (!user) {
    res.status(410).json({ code: "-1", msg: "410 用户不存在", data: null })
    return
  }

  res.status(200).json({ code: "0", msg: "ok", data: user })
})
