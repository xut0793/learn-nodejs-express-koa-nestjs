# SSO 服务端实现

CAS 实现一个独立的认证中心服务，专门负责处理登录请求的独立的 Web 服务。只有认证中心能接受用户的用户名密码等安全信息，创建全局会话。其他系统不提供登录入口，只接受认证中心的间接授权，间接授权通过令牌实现，以此创建各自的局部会话。

全局会话与局部会话有如下约束关系：

- 局部会话存在，全局会话一定存在
- 全局会话存在，局部会话不一定存在
- 全局会话销毁，局部会话必须销毁

CAS 1.0 协议定义了一组术语，一组票据，一组接口。

- 术语：
  - Client：用户。
  - Server：中心服务器，也是 SSO 中负责单点登录的服务器。
  - Service：需要使用单点登录的各个服务，服务需要在中心服务中进行管理。
- 接口：
  - /login：登录接口，用于登录到中心服务器。
  - /logout：登出接口，用于从中心服务器登出。
  - /serviceValidate：用于让各个 service 验证用户是否登录中心服务器。
- 票据
  - TGT: Ticket Granting Ticket。 TGT 是 CAS 为用户签发的登录票据，拥有了 TGT，用户就可以证明自己在 CAS 成功登录过。TGT 封装了 Cookie 值以及此 Cookie 值对应的用户信息。当 HTTP 请求到来时，CAS 以此 Cookie 值（TGC）为 key 查询缓存中有无 TGT ，如果有的话，则相信用户已登录过。
  - TGC：Ticket Granting Cookie。CAS Server 生成TGT放入自己的 Session 中，而 TGC 就是这个 Session 的唯一标识（SessionId），以 Cookie 形式放到浏览器端，是 CAS Server 用来明确用户身份的凭证。
  - ST：Service Ticket。ST 是 CAS 为用户签发的访问某一 service 的票据。用户访问 service 时，service 发现用户没有 ST，则要求用户去 CAS 获取 ST。用户向 CAS 发出获取 ST 的请求，CAS 发现用户有 TGT，则签发一个 ST，返回给用户。用户拿着 ST 去访问 service，service 拿 ST 去 CAS 验证，验证通过后，允许用户访问资源。

## 基本服务

```js
const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser())

// 实际业务中，查询数据库
const users = [{ username: "root", password: "123" }]

app.listen(8080, () => {
  console.log(`🚀 SSO cas.com running at http://localhost:8080`)
})
```

## 登录页面和辅助函数

```html
<h1>单点登录，认证中心服务 CAS</h1>

<form name="login-cas" method="POST">
  <h2>一处登录，全部登录</h2>
  <label for="username">
    <span>账号</span>
    <input
      id="username"
      name="username"
      type="text"
      autocomplete="off"
      required
    />
  </label>
  <label for="password">
    <span>密码</span>
    <input
      id="password"
      name="password"
      type="password"
      autocomplete="new-password"
      required
    />
  </label>

  <div style="margin-top: 20px">
    <button type="submit">登 录</button>
  </div>
</form>
```

服务器中工具函数

```js
export function genRandomString(len) {
  const size = Math.floor((len * 4) / 8)
  return randomBytes(size).toString("hex")
}

function renderLoginPage(res) {
  const loginHtmlPath = resolve(
    process.cwd(),
    "./16-access-control-sso/public/cas.index.html"
  )
  res.type("html")
  createReadStream(loginHtmlPath).pipe(res)
}

function renderErrorPage(res, error) {
  res.type("html")
  res.status(400).send(error.message)
}
```

## 服务和票据的存储

这里用两个对象，模拟数据库的存储及操作。

1. 子系统服务管理

```js
/**
 * 服务注册信息
 * 在实际业务中，可以通过提供前台页面，提供服务注册接口进行添加到数据库中
 * services = [{name: 'www.a.com', redirectUrl: 'http://www.a.com:8081/'}]
 */
class ServiceManagement {
  services = []
  constructor(services) {
    if (Array.isArray(services) && services.length) {
      services.forEach((srv) => this.register(srv))
    } else if (typeof services === "object" && services?.name) {
      this.register(services)
    }
  }
  register(service) {
    this.services.push(service)
  }
  getServiceByName(name) {
    return this.services.find((srv) => srv.name === name)
  }
}

/**
 * 本地调试时，通过修改系统主机配置表进行映射 hosts
 * windows 用户hosts文件是在“c:\windows\system32\drivers\etc"
 * 127:0.0.1 www.a.com www.b.com cas.com
 */
const serviceManagement = new ServiceManagement([
  {
    name: "www.a.com",
    redirectUrl: "http://www.a.com:8081/",
  },
  {
    name: "www.b.com",
    redirectUrl: "http://www.b:8082/",
  },
])
```

2. 票据管理

```js
/**
 * 票据管理
 * tgt = {
 *    tid,
 *    uid,
 *    created
 *    expires,
 * }
 *
 * st = {
 *    tid,
 *    created,
 *    expires,
 *    serviceId
 * }
 *
 * logins = [{st.tid, logoutUrl}]
 *
 * tid = {
 *    tgt,
 *    sts,
 *    logins
 * }
 */
class TicketManagement {
  TICKET_LIFE = 1800000 // 30 minutes in milliseconds
  tickets = new Map()

  genTGT(uid, expires) {
    const tgt = this.getTGTByUid(uid)

    // 如果已存在，且未过期，直接返回，若已期，则删除
    if (tgt) {
      if (tgt.expires > new Date()) return tgt
      this.tickets.delete(tgt.tid)
    }

    const tid = genRandomString(16)
    const ticket = {
      tid,
      uid,
      created: new Date(),
      expires: expires || new Date(Date.now() + this.TICKET_LIFE),
    }

    const doc = {
      tgt: ticket,
      sts: [],
      logins: [],
    }

    this.tickets.set(tid, doc)

    return ticket
  }

  genST(tgtId, serviceId, expires) {
    if (!this.tickets.has(tgtId))
      throw Error(
        "cannot generate service ticket: missing ticket granting ticket"
      )

    const doc = this.tickets.get(tgtId)

    // 如果当前服务有一个未过期的 ST，则直接使用。若已经过期，则删除后，重新生成一个
    for (const st of doc.sts.entries()) {
      if (st[1].serviceId !== serviceId) continue
      if (st[1].expires > new Date()) return st[1]

      doc.sts.splice(st[0], 1)
      break
    }

    const tid = genRandomString(16)
    const ticket = {
      tid,
      serviceId,
      created: new Date(),
      expires: expires || new Date(Date.now() + this.TICKET_LIFE),
    }

    doc.sts.push(ticket)
    this.tickets.set(tgtId, doc)
    return ticket
  }
  getTGTByUid(uid) {
    return Array.from(this.tickets.values()).find((i) => i.tgt.uid === uid)?.tgt
  }
  getTGT(tgtId) {
    if (!this.tickets.has(tgtId))
      throw Error("invalid ticket granting ticket id")
    const tgt = this.tickets.get(tgtId).tgt

    return {
      ...tgt,
      expired: new Date(tgt.expires) < new Date(),
    }
  }
  getST(stId) {
    for (const item of this.tickets.entries()) {
      const st = item[1].sts.find((_st) => _st.tid === stId)
      if (st) {
        return {
          ...st,
          expired: new Date(st.expires) < new Date(),
        }
      }
    }
    throw Error("invalid service ticket id")
  }
  getTGTbyST(stId) {
    for (const item of this.tickets.entries()) {
      const stIndex = item[1].sts.findIndex((st) => st.tid === stId)
      if (stIndex < 0) continue
      const tgt = this.tickets.get(item[0]).tgt

      return { ...tgt, expired: new Date(tgt.expires) < new Date() }
    }
    throw Error("invalid service ticket id")
  }
  invalidateST(stId) {
    for (const item of this.tickets.entries()) {
      const stIndex = item[1].sts.findIndex((st) => st.tid === stId)
      if (stIndex < 0) continue
      const doc = this.tickets.get(item[0])
      return doc.sts[stIndex]
    }
    throw Error("invalid service ticket id")
  }
  invalidateTGT(tgtId) {
    if (!this.tickets.has(tgtId))
      throw Error("invalid ticket granting ticket id")

    const doc = this.tickets.get(tgtId)

    this.tickets.delete(tgtId)

    return doc.tgt
  }
  getLoginServicesByTGT(tgtId) {
    if (!this.tickets.has(tgtId))
      throw Error("invalid ticket granting ticket id")
    return this.tickets.get(tgtId).logins
  }
  trackServiceLogin(stId, tgtId, serviceLogoutUrl) {
    if (!this.tickets.has(tgtId)) throw Error("invalid ticket granting ticket")
    const doc = this.tickets.get(tgtId)
    doc.logins.push({
      stId,
      logoutUrl: serviceLogoutUrl,
    })
    return
  }
}

const ticketManagement = new TicketManagement()
```

## 登录

```js
const TGT_COOKIE_NAME = "CASTGC"

/**
 * 登录页面
 * 1.如果当前没有全局会话凭证，显示登录表单
 * 2.如果全局会话已存在，再判断是否有携带服务名称，如果有，则生成局部应用的票据，并重定向子应用。
 */
app.get("/login", (req, res) => {
  try {
    const tgtId = req.cookies[TGT_COOKIE_NAME]

    if (tgtId) {
      const tgt = ticketManagement.getTGT(tgtId)

      if (tgt && !tgt.expired) {
        const service = serviceManagement.getServiceByName(req.query.service)

        if (service) {
          const st = ticketManagement.genST(tgtId, service.name)
          return res.redirect(`${service.redirectUrl}?ticket=${st.tid}`)
        } else {
          throw new Error(`未知应用 ${service?.name}`)
        }
      }

      // 如果全局会话已失效，则注销所有局部会话
      const loginServices = ticketManagement.getLoginServicesByTGT(tgtId)
      // sso = single sign on ; slo = single logout
      for (const slo of loginServices) {
        fetch(`${slo.logoutUrl}?ticket=${slo.stId}`, {
          method: "POST",
        })
          .then((res) => res.json())
          .then((resData) => {
            console.log("🚀 ~ service: %s response ok:", slo.logoutUrl)
          })
          .catch((err) => {
            console.error("service: %s error", slo.logoutUrl)
          })
      }

      req.user = null
      ticketManagement.invalidateTGT(tgtId)
      res.cookie(TGT_COOKIE_NAME, null, {
        expires: new Date(),
      })
    }

    renderLoginPage(res)
  } catch (error) {
    // renderErrorPage(res, error)
    renderLoginPage(res)
  }
})

/**
 * 用户登录
 *
 * 1.检查用户账号和密码是否匹配，成功匹配，生成全局会话 TGT
 * 2.然后，如果携带服务名称，就生成服务票据 ST，并与 TGT 关联，然后重定向到子服务页面
 *
 * [MDN CORS 简单请求](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS#%E7%AE%80%E5%8D%95%E8%AF%B7%E6%B1%82)
 *
 * 关键点：
 * 浏览器页面能显示重定向子服务的页面的关键在于，表单登录页面提交表单必须保持 HTTP “简单请求”，不然重定向会触发 CORS 跨域访问限制，导致发起预检请求 option 报错，所以表单提交页面可选方式：
 * - 使用 web form 表单默认提交行为，即按钮（type=submit)触发表单自动提交，不用自己定义 script 中的脚本。
 * - 如果需要使用 js 代码提交表单，则 Post 方式中，设置 Content-Type=application/x-www-form-urlencoded，并且不能阻止表单的默认页面跳转行为 evt.preventDefault()
 */
app.post("/login", (req, res) => {
  try {
    const params = req.body
    const { username, password } = params
    const serviceName = req.query.service

    let service

    if (serviceName) {
      service = serviceManagement.getServiceByName(serviceName)
      if (!service) throw new Error("unknown service")
    }

    const user = users.find(
      (i) => i.username === username && i.password === password
    )

    if (user) {
      req.user = user

      const tgt = ticketManagement.genTGT(username)

      res.cookie(TGT_COOKIE_NAME, tgt.tid, {
        domain: req.hostname,
        expires: tgt.expires,
        httpOnly: false,
      })

      if (service) {
        const st = ticketManagement.genST(tgt.tid, service.name)
        return res.redirect(`${service.redirectUrl}?ticket=${st.tid}`)
      }
    } else {
      throw new Error("登录失败，请检查用户名或密码是否正确")
    }
  } catch (error) {
    renderErrorPage(res, error)
  }
})
```

## 服务请求认证

```js
/**
 * 局部会话的票据检查
 * 提供给应用服务器中调用
 */
app.get("/serviceValidate", (req, res) => {
  try {
    const serverName = req.query.service
    const stId = req.query.ticket

    const service = serviceManagement.getServiceByName(serverName)

    if (!service) throw new Error(`${serverName} was not recognized`)

    const st = ticketManagement.getST(stId)

    if (!st || st.expired)
      throw new Error(`Service Ticket ${stId} was not recognized`)

    // st 只用一次
    ticketManagement.invalidateST(stId)

    const tgt = ticketManagement.getTGTbyST(stId)

    // 记录已登录的服务
    ticketManagement.trackServiceLogin(
      stId,
      tgt.tid,
      `${service.redirectUrl}logout`
    )

    const user = users.find((i) => i.username === tgt.uid)
    res.status(200).json({ st, tgt, user })
  } catch (error) {
    renderErrorPage(res, error)
  }
})
```
