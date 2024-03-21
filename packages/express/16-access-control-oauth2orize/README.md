# OAuth2 服务端实现

这里通过 oauth2orize 库来实现 oauth2 中最常用的授权码功能。

> 不依赖第三方库，原生实现 oauth2 授权协议的代码见 16-access-control-oauth2-server 的半成品代码，待完善。

OAuth2 服务中心要实现的功能：

- 客户端管理：提供客户端 CURD 功能
- 授权码管理：code 生成、查询、删除
- 令牌管理： token 生成、查询、删除
- 提供授权问询界面

供第三方客户端调用接口：

- /oauth2/authorize，GET 时携带查询参数 client_id / response_type / redirect_uri，POST 时确认是否进行授权访问，并且通过 cookie 认证登录态
- /oauth2/token，用 code 交换 token，POST 携带请求体参数 code / client_id / client_secret / grant_type / redirect_uri

这里示例假设允许将项目的 Get /api/Pets 资源通过 oauth2 协议对外开放。

## 初始化项目

```js
// index.js
import express from "express"

const port = process.env.PORT || 9001
const app = express()

app.get("/", (req, res) => {
  res.json({ code: 0, msg: "ok", data: null })
})

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`)
})
```

## 实现用户登录认证功能

通过 passport 和 passport_local 实现用户认证功能

- express-handlebars 实现登录页的渲染
- express-session 实现基于 cookie 的 session 认证方案。暂时将 session 会话令牌默认在内存中。
- passport 和 passport-local 实现用户名和密码的认证功能

```js
// index.js
import { resolve } from "node:path"
import express from "express"
import { create } from "express-handlebars"
import session from "express-session"
import passport from "passport"
import { userModel } from "./db/index.js"

// index.js
const port = process.env.PORT || 9001
import express from "express"
const app = express()

// 视图引擎配置
const hbs = create({ extname: "hbs", defaultLayout: false })
app.engine("hbs", hbs.engine)
app.set("view engine", "hbs")
app.set("views", resolve(process.cwd(), "./16-access-control-oauth2orize/view"))

// 解析请求体和cookie配置
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(
  session({
    name: "SESSIONID",
    secret: "__secret__",
    resave: true, //(是否允许)当客户端并行发送多个请求时，其中一个请求在另一个请求结束时对session进行修改覆盖并保存
    saveUninitialized: true, //初始化session时是否保存到存储
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: 1 * 60 * 60 * 1000, // 1h
    },
  })
)

// passport 配置
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function (user, done) {
  process.nextTick(function () {
    done(null, { uid: user.uid, username: user.username })
  })
})

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    const u = userModel.get(user.uid)
    return cb(null, u ?? false)
  })
})

app.get("/", (req, res) => {
  return res.render("index", {
    isAuthenticated: req.isAuthenticated(),
    user: JSON.stringify(req.user),
    passport: JSON.stringify(req.session.passport),
  })
})
app.get("/login", (req, res) => res.render("login"))
app.post("/login", localAuthenticate)

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`)
})
```

用户储存模拟，实际可连接数据库

```js
// db/index.js
export const userModel = {
  users: [{ uid: 1, username: "root", password: "123" }],
  getAll() {
    return this.users
  },
  find({ username, password }) {
    return this.users.find(
      (u) => u.username === username && u.password === password
    )
  },
  findByUsername(username) {
    return this.users.find((u) => u.username === username)
  },
  get(uid) {
    return this.users.find((u) => u.uid === uid)
  },
  has(username) {
    return this.users.some((u) => u.username === username)
  },
  add({ username, password }) {
    const newUser = { uid: this.users.length + 1, username, password }
    this.users.push(newUser)
    return newUser
  },
}
```

localStrategy 实现

```js
import passport from "passport"
import LocalStrategy from "passport-local"
import { userModel } from "../db/index.js"

passport.use(
  new LocalStrategy(function verify(username, password, done) {
    const user = userModel.find({ username, password })

    if (!user) {
      return done(null, false, { message: "Incorrect username or password" })
    }

    return done(null, user)
  })
)

export const localAuthenticate = passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
})

export const isLocalAuthenticatedMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  } else {
    res.redirect("/login")
  }
}
```

首页展示登录令牌 `view/index.hbs`

```hbs
<h1>首页</h1>
<div>用户是否登录 req.isAuthenticated = {{isAuthenticated}}</div>
<div>用户 req.user = {{user}}</div>
<div>用户 req.session.passport = {{passport}}</div>
```

登录表单页面 `view/login.hbs`

```hbs
<h1>OAuth2 Demo</h1>
<div style="margin-bottom: 20px;">Router: POST {{api}}</div>
<form action="/login" method="post">
  <section>
    <label for="username">Username</label>
    <input
      id="username"
      name="username"
      type="text"
      autocomplete="username"
      required
      autofocus
    />
  </section>
  <section>
    <label for="current-password">Password</label>
    <input
      id="current-password"
      name="password"
      type="password"
      autocomplete="current-password"
      required
    />
  </section>
  <button type="submit" style="margin-top: 20px;">提交</button>

  <div id="resp"></div>
</form>
```

## 实现宠物 Pet 的 CURD 功能

pet.controller.js

```js
import { petModel } from "../db/index.js"

export function postPet(req, res) {
  const { name, type, quantity } = req.body
  const pet = petModel.add({ name, type, quantity, uid: req.user.uid })
  return res.json({ code: 0, msg: "ok", data: pet })
}

export function getAllPet(req, res) {
  const pets = petModel.getAll(req.user.uid)
  return res.json({ code: 0, msg: "ok", data: pets })
}

export function getPetById(req, res) {
  const pet = petModel.get(req.params.id)
  return res.json({ code: 0, msg: "ok", data: pet })
}

export function updatePet(req, res) {
  const pet = petModel.update(req.params.id, { quantity: res.body.quantity })
  return res.json({ code: 0, msg: "ok" })
}

export function deletePet(req, res) {
  petModel.delete(req.params.id)
  return res.json({ code: 0, msg: "ok" })
}
```

配置路由，并且路由添加是否登录的认证中间件 isLocalAuthenticatedMiddleware，见上面 localStrategy 实现

```js
// router/index.js
import { Router } from "express"
import {
  deletePet,
  getAllPet,
  getPetById,
  postPet,
  updatePet,
} from "../controller/pet.controller.js"

export const router = Router()

router
  .route("/pets")
  .get(isLocalAuthenticatedMiddleware, getAllPet)
  .post(isLocalAuthenticatedMiddleware, postPet)
router
  .route("/pet/:id")
  .get(isLocalAuthenticatedMiddleware, getPetById)
  .patch(isLocalAuthenticatedMiddleware, updatePet)
  .delete(isLocalAuthenticatedMiddleware, deletePet)
```

将路由集成到 app 应用中

```js
// index.js
import { router } from "./router/index.js"

// 省略代码
app.use("/api", router)
```

## 实现客户端 CURD 功能

模拟客户储存对象

```js
// db/index.js
export const clientModel = {
  clients: [
    {
      id: "123",
      name: "test_client",
      secret: "123",
      redirectUri: "http://localhost:9001/api/oauth2/redirect",
      uid: 1,
    },
  ],
  add(client) {
    const newClient = {
      id: genRandomString(8),
      secret: genRandomString(16),
      name: client.name,
      uid: client.uid,
    }
    this.clients.push(newClient)
    return newClient
  },
  getAll() {
    return this.clients
  },
  get(id) {
    return this.clients.find((i) => i.id === id)
  },
  check({ id, secret, redirectUri }) {
    return this.clients.find((i) => i.id === id && i.secret === secret)
  },
}
```

客户端 CURD 逻辑

```js
import { clientModel } from "../db/index.js"

export function postClient(req, res) {
  const { name } = req.body
  const client = clientModel.add({ name, uid: req.user.uid })

  return res.json({ code: 0, msg: "ok", data: client })
}

export function getClients(req, res) {
  const clients = clientModel.getAll()
  return res.json({ code: 0, msg: "ok", data: clients })
}
```

客户管理的路由

```js
// router/index.js
import { getClients, postClient } from "../controller/client.controller.js"
// 省略代码，pets 路由
router
  .route("/clients")
  .get(isLocalAuthenticatedMiddleware, getClients)
  .post(isLocalAuthenticatedMiddleware, postClient)
```

## 模拟 code 和 token 模型

访问授权要生成 code 和 token，且与 client 关联。所以模拟建立 code 和 token 存储模型，实现可存储到数据库。

```js
// db/index.js
export const codeModel = {
  codeList: [
    // {code, uid, clientId, redirectUri}
  ],
  add(codeInfo) {
    this.codeList.push(codeInfo)
  },
  get(code) {
    return this.codeList.find((i) => i.code === code)
  },
  delete(code) {
    const idx = this.codeList.findIndex((i) => i.code === code)
    if (idx > -1) {
      this.codeList.splice(idx, 1)
    }
  },
}

export const tokenModel = {
  tokenList: [
    // {token, uid, clientId}
  ],
  add(tokenInfo) {
    this.tokenList.push(tokenInfo)
  },
  get(token) {
    return this.tokenList.find((i) => i.token === token)
  },
}
```

提供一个生成随机字符串的工具函数

```js
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
```

## 集成 oauth2orize 核心功能

```js
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

// 请求授权，使用授权码模式，生成 code
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

// 使用 code 交换 token
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

// Get /oauth2/authorize
// 初始化一个新的授权过程，通过客户端 client_id，验证客户端是否已注册，如果是可信客户端，渲染授权问询页面
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

// POST /oauth2/authorize
// 用户批准或拒绝后的处理，调用server.grant处理提交的数据
export const decision = [server.decision()]

// POST /oauth2/token
// 通过用户授权后得到code 来交换 token，token() 会调用 server.exchange
export const getToken = [server.token(), server.errorHandler()]
```

实现授权问询页面

```hbs
<!-- approve.hbs -->
<p>Hi, {{user.username}}</p>
<p><b>{{client.name}}</b> is requesting <b>full access</b> to your account.</p>
<p>Do you approve?</p>

<form action="/oauth2/authorize" method="post">
  <input name="transaction_id" type="hidden" value="{{transactionID}}" />
  <div>
    <input type="submit" value="Allow" name="agree" id="allow" />
    <input type="submit" value="Deny" name="cancel" id="deny" />
  </div>
</form>
```

集成路由，对外提供授信客户端访问的接口。

- 其中 /oauth2/authorize 接口，需要验证用户是否已登录系统
- 其中 /oauth2/token 接口，一般外客户端服务器环境调用，不在浏览器环境下调用，所以需要校验客户端凭证是否正确。

```js
//对外提供授信客户端访问的接口 oauth2/router.js
import { Router } from "express"
import {
  authorization,
  decision,
  getToken,
} from "../controller/oauth2.controller.js"
import {
  clientAuthenticate,
  isLocalAuthenticatedMiddleware,
} from "../authenticate-strategy/index.js"

export const router = Router()

// 第三方应用授权访问接口，前提是已登录当前应用
router
  .route("/authorize")
  .get(isLocalAuthenticatedMiddleware, authorization) // 启动授权过程
  .post(isLocalAuthenticatedMiddleware, decision) // 用户决定授权后的调整

// 第三应用提供的回调地址的服务器逻辑中调用，必须传入客户端 client_id 和 client_secret，这里用 clientAuthenticate 来对必填的 client_id 和 client_secret 参数进行校验。
// 另一种方法，是将校验客户端凭证的逻辑与 code 的校验逻辑，一起放在 getToken 中。
router.route("/token").post(clientAuthenticate, getToken) // 用 code 换取 token
```

将 oauth2 接口挂载到应用上。

```js
// index.js
import { router as oauth2Router } from "./router/oauth2.router.js"

// 省略其它服务代码

app.use("/api", router)
app.use("/oauth2", oauth2Router)
```

## 实现客户端认证

使用 passport 和 passport_local 实现客户端认证。注意与用户登录时账号密码的认证细微区别。

```js
// client.strategy.js
import passport from "passport"
import LocalStrategy from "passport-local"
import { clientModel } from "../db/index.js"

passport.use(
  "client",
  new LocalStrategy(
    {
      usernameField: "client_id",
      passwordField: "client_secret",
      session: false,
    },
    function verify(client_id, client_secret, done) {
      const client = clientModel.check({ id: client_id, secret: client_secret })

      if (!client) {
        return done(null, false, { message: "Incorrect client id or secret" })
      }

      return done(null, client)
    }
  )
)

export const clientAuthenticate = passport.authenticate("client", {
  session: false,
  failureMessage: "客户端认证不通过",
  successMessage: "客户端认证通过",
})
```

## 开放 pets 查询接口

pets 的 get 即向内部开放，也向第三方开放。对内访问时使用本地账号密码访问，对外客户端访问时使用 access_token 访问。

所以首先实现 token 访问的认证。

```js
// /authenticate-strategy/token.strategy.js
import passport from "passport"
import BearerStrategy from "passport-http-bearer"
import { tokenModel, userModel } from "../db/index.js"

passport.use(
  new BearerStrategy(
    /**{ scope: ["pet"], realm: "pet" }, */ function verify(accessToken, done) {
      const tokenInfo = tokenModel.get(accessToken)

      if (!tokenInfo) {
        return done(null, false, { message: "Invalid access token" })
      } else {
        const uid = tokenInfo.uid
        const user = userModel.get(uid)

        if (!user) {
          return done(null, false, { message: "Invalid uid" })
        } else {
          return done(null, user, { scope: "*" })
        }
      }
    }
  )
)

export const bearerAuthenticate = passport.authenticate("bearer", {
  session: false,
})
```

然后实现 GET /pets 接口即通过本地账号密码请求，又能接爱令牌凭证请求功能的中间件

```js
import { bearerAuthenticate } from "./token.strategy.js"

export const localOrBearerAuthenticateMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  return bearerAuthenticate(req, res, next)
}
```

更改 GET /pets 路由注册

```js
import {
  localOrBearerAuthenticateMiddleware,
  isLocalAuthenticatedMiddleware,
} from "../authenticate-strategy/index.js"

router.route("/pets").get(localOrBearerAuthenticateMiddleware, getAllPet)
```

## 第三方客户端回调接口实现

当已授信客户端请求授权访问，同意后，将 code 作为查询参数，挂载到 302 重定向接口，所以客户端在此接口内需要实现，用 code 换取 token 的逻辑。

```js
import fetch from "node-fetch"
// 模拟第三应用使用，申请授权访问同意后的回调请求
router.get("/oauth2/redirect", async (req, res) => {
  const code = req.query.code
  const fetchRes = await fetch("http://localhost:9001/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: "123",
      client_secret: "123",
      redirect_uri: "http://localhost:9001/api/oauth2/redirect",
      grant_type: "authorization_code",
      code,
    }),
  })

  const data = await fetchRes.json()
  res.type("html").send(`
    <h1>请求授权成功</h1>
    <p>你可以用此 access_token.token 请求授权范围内的宠物 Get /api/pets </p>
    <p>${JSON.stringify(data)}</p>
  `)
})
```

## 结束

可以在浏览器访问 `http://localhost:9001/oauth2/authorize?client_id=123&response_type=code&redirect_uri=http://localhost:9001/api/oauth2/redirect`

如果未登录，将跳到登录页面进行登录。登录之后，再次访问该接口，将出现授权问询页面，点击同意或拒绝，可以查看返回结果。
