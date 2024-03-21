/*
 * @Date         : 2024-03-18 15:44:48 星期1
 * @Author       : xut
 * @Description  :
 */
import oauth2orize from "oauth2orize"
import {
  clientModel,
  tokenModel,
  codeModel,
  genRandomString,
} from "../db/index.js"

const server = oauth2orize.createServer()

// 序列化和反序列化指示如何获取和解析存在在会话中 req.session.oauth 中的客户端凭证
server.serializeClient(function (client, done) {
  return done(null, client.id)
})

server.deserializeClient(function (id, done) {
  const client = clientModel.get(id)

  if (!client) {
    return done(null, false, { message: "Invalid Client" })
  } else {
    done(null, client)
  }
})

// 注册 授予授权码模式
server.grant(
  oauth2orize.grant.code(function (client, redirectUri, user, ares, done) {
    // ares = {allow: true, deny: false}
    console.log(
      "🚀 ~ server.grant ~ client, redirectUri, user, ares:",
      client,
      redirectUri,
      user,
      ares
    )

    const codeInfo = {
      code: genRandomString(16),
      redirectUri,
      uid: client.uid,
      clientId: client.id,
    }
    codeModel.add(codeInfo)
    done(null, codeInfo.code)
  })
)

// 使用code交换token
server.exchange(
  oauth2orize.exchange.code(function (client, code, redirectUri, done) {
    console.log(
      "🚀 ~ server.exchange ~ client, code, redirectUri:",
      client,
      code,
      redirectUri
    )

    const codeInfo = codeModel.get(code)

    if (!codeInfo) {
      return done(null, false, { message: "Invalid code" })
    }

    // code 使用后删除
    codeModel.delete(code)

    // 生成 token
    const tokenInfo = {
      token: genRandomString(16),
      clientId: client.id,
      uid: client.uid,
    }

    tokenModel.add(tokenInfo)

    return done(null, tokenInfo)
  })
)

// 初始化一个新的授权过程，通过客户端ID查找客户端，找到后返回客户端和重定向URI, 而后渲染授权页面
export const authorization = [
  server.authorization(function (clientId, redirectUri, done) {
    console.log(
      "🚀 ~ server.authorization ~ client, redirectUri:",
      clientId,
      redirectUri
    )

    const client = clientModel.get(clientId)

    if (!client) {
      return done(null, false, { message: "Invalid client" })
    } else {
      return done(null, client, redirectUri)
    }
  }),
  function renderAuthorizationPage(req, res) {
    console.log("🚀 ~ renderAuthorizationPage ~ req.oauth2:", req.oauth2)
    return res.render("approve", {
      transactionID: req.oauth2.transactionID,
      user: req.user,
      client: req.oauth2.client,
    })
  },
]

// 用户批准或拒绝后的处理，调用server.grant处理提交的数据
export const decision = [server.decision()]

// 通过用户授权后得到code 来交换 token，token() 会调用 server.exchange
export const getToken = [server.token(), server.errorHandler()]
