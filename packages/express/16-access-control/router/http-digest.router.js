/*
 * @Date         : 2024-02-28 15:18:37 星期3
 * @Author       : xut
 * @Description  : 认证方案为 HTTP Digest
 *
  注意以逗号分隔，<>中的字段都是加双引号
 * WWW-Authenticate：Digest realm=<realm>, qop=<auth,auth-int>, nonce=<nonce>， algorithm=<algorithm>, stale=<stale>
 * Authorization：Digest username=<username>, realm=<realm>, qop=<auth,auth-int>, nonce=<nonce>, uri=<uri> nc=<nc>, cnonce=<cnonce>, response=<response>
 * Authentication-Info: nextnonce=<nextnonce> qop=<auth,auth-int> rspauth=<rspauth> cnonce=<cnonce>
 *
 * type: Digest 表示以摘要的形式来进行认证
 * realm：指示进行认证的范围
 * qop: 保护质量，包含auth（默认的）和 auth-int（增加了报文完整性检测）两种策略，（可以为空，但是）不推荐为空值
 * nonce：服务端向客户端发送质询时附带的一个随机数，这个数会经常发生变化。客户端计算密码摘要时将其附加上去，使得多次生成同一用户的密码摘要各不相同，用来防止重放攻击
 * nc：nonce计数器，是一个16进制的数值，表示同一nonce下客户端发送出请求的数量。例如，在响应的第一个请求中，客户端将发送“nc=00000001”。这个指示值的目的是让服务器保持这个计数器的一个副本，以便检测重复的请求
 * cnonce：客户端随机数，这是一个不透明的字符串值，由客户端提供，并且客户端和服务器都会使用，以避免用明文文本。这使得双方都可以查验对方的身份，并对消息的完整性提供一些保护
 * response：这是由用户代理软件（浏览器）计算出的一个字符串，以证明用户知道口令。后续服务端需要相同规则计算后匹配它来判断认证
 * Authorization-Info：认证成功，返回的响应头，用于返回一些与授权会话相关的附加信息
 * nextnonce：下一个服务端随机数，使客户端可以预先发送正确的摘要
 * rspauth：响应摘要，用于客户端对服务端进行认证
 * stale：当密码摘要使用的随机数过期时，服务器可以返回一个附带有新随机数的401响应，并指定stale=true，表示服务器在告知客户端用新的随机数来重试，而不再要求用户重新输入用户名和密码了
 *
 * 摘要算法，有两种，默认：MD5，也可以指定 MD5-sess。具体看浏览器实现，以前的浏览器版本仅支持MD5散列，现在浏览器，比如 Firefox 93 及更高版本支持 SHA-256 算法。
 * 默认MD5摘要算法规则：MD5(MD5(A1):<nonce>:<nc>:<cnonce>:<qop>:MD5(A2))
 * A1 规则根据算法不同而不同：
 *    默认MD5：<username>:<realm>:<password>
 *       MD5-sess: MD5(<username>:<realm>:<password>):<nonce>:<cnonce>
 * A2 规则根据指定的 qop 值不同而不同：
 *     默认 auth ： <request-method>:<uri>
 *         auth-int: <request-method>:<uri>:MD5(<request-entity-body>)
 */
import crypto from "node:crypto"
import { Router } from "express"
import { genRandomString } from "../utils/helper.js"

export const router = Router()

// 实际业务中将数据存储在数据库
const users = [{ uid: "1", role: "admin", account: "root", password: "123" }]

const NONCE_EXPIRE_TIMEOUT = 60 * 60 * 1000 // 服务端生成随机数的过期时间，1h
const cacheNonces = {}
/**
 * 使用 MD5 算法加密字符串，返回十六进制字符的哈希串
 */
function md5(str) {
  const hash = crypto.createHash("MD5")
  hash.update(str)
  return hash.digest("hex")
}

/**
 * 生成随机数，并缓存，在过期时间内清除
 */
function askNonce() {
  const nonce = genRandomString(16)
  cacheNonces[nonce] = {
    nonce,
    timestamp: Date.now(),
    count: 0,
  }
  return nonce
}

/**
 * 过期时间到，清除随机数
 */
function removeNonce(nonce) {
  console.log("remove nonce >>>")
  cacheNonces[nonce] = null
}

/**
 * 校验 nonce 是否过期，并记录次数
 * @param {*} nonce
 * @param {*} qop
 * @param {*} nc
 * @returns
 */
function validateNonce(nonce, qop, nc) {
  const now = Date.now()
  // 客户端请求发送的 nc 是十六进制，要转成 十进制数字
  const ncNum = Number.parseInt(nc, 16)

  const nonceInfo = cacheNonces[nonce]

  if (!nonceInfo) return false

  console.log(
    "🚀 ~ validateNonce timeout:",
    nonceInfo.timestamp + NONCE_EXPIRE_TIMEOUT,
    now
  )

  if (nonceInfo.timestamp + NONCE_EXPIRE_TIMEOUT < now) {
    removeNonce(nonce)
    return false
  }

  if (qop) {
    if (ncNum > nonceInfo.count) {
      nonceInfo.count = ncNum
      return true
    } else {
      return false
    }
  }

  return true
}

/**
 * 生成摘要
 */
function genDigest({
  method,
  uri,
  username,
  password,
  realm,
  algorithm = "MD5",
  qop = "auth",
  nonce,
  nc,
  cnonce,
}) {
  // <username>:<realm>:<password>
  let A1 = `${username}:${realm}:${password}`

  // MD5(<username>:<realm>:<password>):<nonce>:<cnonce>
  if (algorithm === "MD5-sess") {
    A1 = `${md5(A1)}:${nonce}:${cnonce}`
  }

  let A2

  if (qop === "auth-int") {
    // auth-int: <request-method>:<uri>:MD5(<request-entity-body>)
    throw new Error("auth-int 暂未实现")
  } else {
    // 默认 auth: <request-method>:<uri>
    A2 = `${method}:${uri}`
  }

  // 计算摘要
  let digest

  if (!qop) {
    // For RFC 2069 compatibility
    digest = md5(md5(A1) + ":" + nonce + ":" + md5(A2))
  } else {
    digest = md5(
      md5(A1) +
        ":" +
        nonce +
        ":" +
        nc +
        ":" +
        cnonce +
        ":" +
        qop +
        ":" +
        md5(A2)
    )
  }

  return digest
}

/**
 *Digest realm=<realm>, qop=<auth,auth-int>, nonce=<nonce>，其它实现默认值
 */
function generateWWWAuthenticateDigest(nonce) {
  return `Digest realm="test",qop="auth",nonce="${nonce}"`
}

/**
 * Digest username=<username>, realm=<realm>, qop=<auth,auth-int>, nonce=<nonce>, uri=<uri> nc=<nc>, cnonce=<cnonce>, response=<response>
 * Digest username="test", realm="Test Realm", nonce="95bf6846e5ec2d59f6cfeadd6b3837ac", uri="/digest", response="4f67a33e5fba5e1e286ef6dcd7e1b9fe", qop=auth, nc=00000002, cnonce="f4355f4c2110d5b3"
 */
function parseAuthorizationDigest(authorization, method) {
  const matched = authorization.match(/^(\w+)\s+/)

  if (matched === null) return false

  const type = matched[1]

  if (type.toLowerCase() !== "digest") return false

  const paramsStr = authorization.slice(type.length)

  let params = {
    type,
    method,
  }

  // 以逗号分隔，兼容有逗号加空格
  let tokens = paramsStr.split(/,(?=(?:[^"]|"[^"]*")*$)/)
  let i = 0
  let len = tokens.length

  while (i < len) {
    // 去除引号和空格
    let param = /(\w+)=["]?([^"]*)["]?$/.exec(tokens[i])
    if (param) {
      params[param[1]] = param[2]
    }

    ++i
  }

  if (!params.algorithm) {
    params.algorithm = "MD5"
  }

  if (params.username) {
    params.password = users.find((i) => i.account === params.username)?.password
  }

  return params
}

/**
 * 校验摘要
 * MD5(MD5(A1):<nonce>:<nc>:<cnonce>:<qop>:MD5(A2))
 * A1 规则根据算法不同而不同：
 *    默认MD5：<username>:<realm>:<password>
 *       MD5-sess: MD5(<username>:<realm>:<password>):<nonce>:<cnonce>
 * A2 规则根据指定的 qop 值不同而不同：
 *     默认 auth ： <request-method>:<uri>
 *         auth-int: <request-method>:<uri>:MD5(<request-entity-body>)
 */
function authenticate(clientParams) {
  const isValid = validateNonce(
    clientParams.nonce,
    clientParams.qop,
    clientParams.nc
  )

  if (!isValid) throw new Error("验证超时")

  if (!clientParams.username) throw new Error("用户名未输入，验证不通过")

  const digest = genDigest(clientParams)

  if (digest === clientParams.response) {
    return true
  } else {
    throw new Error("摘要验证失败")
  }
}

/**
 * 用户登录
 *
 * 摘要生成跟当前 method 和 uri 有关，所以无法在登录时生成一个摘要，然后在其它接口访问时校验摘要。除非写死固定生成摘要的 method 和 uri
 */
// router.post("/login", (req, res) => {
//   const params = req.body

//   const { account, password } = params

//   const user = users.find(
//     (i) => i.account === account && i.password === password
//   )

//   if (user) {
//     res.json({
//       code: 0,
//       msg: "ok",
//       data: {
//         access_token: genAuthorizationDigestToken(account, password),
//         type: "Digest",
//         user,
//       },
//     })
//   } else {
//     res.status(401).json({
//       code: "-1",
//       msg: "登录失败，请检查用户名或密码是否正确",
//       data: null,
//     })
//   }
// })

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
    const nonce = askNonce()
    res.set("WWW-Authenticate", generateWWWAuthenticateDigest(nonce))
    res.status(401).json({ code: "-1", msg: "401 未授权访问", data: null })
    return
  }

  const clientParams = parseAuthorizationDigest(authorization, req.method)

  try {
    const isPass = authenticate(clientParams)

    if (!isPass) throw new Error("摘要验证失败")
  } catch (error) {
    res.status(403).json({
      code: "-1",
      msg: error.message,
      data: null,
    })
  }

  const user = users.find((i) => i.account === clientParams.username)

  if (!user) {
    res.status(410).json({ code: "-1", msg: "410 用户不存在", data: null })
    return
  }

  res.status(200).json({ code: "0", msg: "ok", data: user })
})
