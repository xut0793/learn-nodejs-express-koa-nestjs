# Passport

[Passport](www.passportjs.org) 是一个 Node 平台的身份认证中间件。它的设计服务于一个简单的目标：身份认证请求。
[Passport-api-docs](https://github.com/jwalton/passport-api-docs)
[w3c school passport 学习](https://www.w3cschool.cn/passport_js_note/ncgd1ozt.html)

在现代 web 应用中，身份认证可以采用多种形式，比如传统的用户名和密码，就有基于 cookie / session / bearer jwt 等，也有通过第三方应用开放的 oauth 实现。

Passport 认为每一个应用都有独一无二的身份认证需求。passport 实现身份认证的核心功能，抽离具体认证方案。上述不同的身份认证方案，在 passport 中被称为策略(strategies)，遵循 passport 集成的 api 接口，被抽象成独立的模块。

特征

- 有超过 500+ 身份认证策略，挑选所需的策略
- 也可以实施自定义策略
- 使用 OpenID 或 OAuth 进行单点登录
- 轻松处理认证成功和失败
- 支持持久会话
- 动态范围和权限
- 不在应用程序中挂载路由，侵入性较小
- 轻量级

使用 Passport 进行身份验证，有三个部分需要设置：

认证策略
应用中间件
会话（可选）

## Strategies 策略

策略是passport中最重要的概念。passport模块本身不能做认证，所有的认证方法都以策略模式封装为插件。

策略模式是一种设计模式，它将算法和对象分离开来，通过加载不同的算法来实现不同的行为，适用于相关类的成员相同但行为不同的场景，比如在passport中，认证所需的字段都是用户名、邮箱、密码等，但认证方法是不同的。

依靠策略模式，社区有超过 500+ 身份认证策略，来适应各自的场景，也可以自定义策略。

配置策略示例：

```js
import passport from "passport"
import LocalStrategy from "passport-local"
import { userModel } from "../db/index.js"

passport.use(
  new LocalStrategy(function (username, password, done) {
    UserModel.findOne({ username }, function (err, user) {
      if (err) {
        return done(err)
      }
      if (!user) {
        return done(null, false, { message: "用户名不存在." })
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: "密码不匹配." })
      }
      return done(null, user)
    })
  })
)
```

passport本身不处理验证，验证方法在策略配置的回调函数里由用户自行设置，它又称为验证回调。验证回调需要返回验证结果，这是由done()来完成的。
在passport.use()里面，done()有三种用法：

- 当发生系统级异常时，返回done(err)，这里是数据库查询出错，一般用next(err)，但这里用done(err)，两者的效果相同，都是返回error信息；
- 当验证不通过时，返回done(null, false, message)，这里的message是可选的，可通过express-flash调用；
- 当验证通过时，返回done(null, user)。

## Session 会话

当某些策略维持会话基于 cookie + session 机制时，需要注册 `app.use(passport.session())`。并且验证用户提交的凭证是否正确，是与 session 中储存的对象进行对比，所以涉及到从session中存和取数据，需要做session 对象序列化与反序列化。

```js
// 每当调用 passport.authenticate 或 passport.login 时，将上述 localStrategy 中 done(null, user) 回调入参的 user 序列化到 session 中作为 sessionId，同时它将作为凭证存储在用户cookie中
passport.serializeUser(function (user, done) {
  process.nextTick(function () {
    done(null, user.uid)
  })
})

// 从session反序列化，参数为浏览器请求时附加的 cookie ，即 sessionID，若存在则从数据库中查询user并存储与req.user
passport.deserializeUser(function (uid, done) {
  process.nextTick(function () {
    UserModel.findById(uid, function (err, user) {
      done(err, user)
    })
  })
})
```

## authenticate middleware 认证中间件

password 最重要的认证函数 `passport.authenticate(strategyName[, options][,callback])`。

strategyName 是之前注册到 `passport.use(name, ...)` 的策略的名称。 这可以是一个数组，在这种情况下，第一个成功、重定向或错误的策略将停止链。 身份验证失败将按顺序进行每个策略，如果所有策略都失败，则失败。

此函数返回运行策略的中间件。 如果其中一个策略成功，则将设置 req.user。 如果未传递任何选项或回调，并且所有策略都失败，则会将 401 写入响应。 请注意，某些策略也可能导致重定向（例如 OAuth）。 此中间件还会向 req 对象添加了帮助程序函数：`req.login()`、`req.logout()` 和 `req.isAuthenticated()`。

选项对象 options:

- session - 布尔值，启用会话支持（默认为 true），为true时，需要同时注册 `passport.session()`
- successRedirect - 成功时要重定向到的路径。
- failureRedirect - 在发生故障时重定向到的路径，覆盖默认的 401 响应。
- failureFlash - boolean or string，设置为Boolean时，express-flash 将调用`use()`里设置的message。设置为String时将直接调用这里的信息。
- successFlash - boolean or string，同上，配合 express-flash 使用。
- successMessage - True 将成功消息存储在 req.session.messages 中，或用作成功覆盖消息的字符串。
- failureMessage - True，用于将失败消息存储在 req.session.messages 中，或用作失败覆盖消息的字符串。
- failWithError - 失败时，使用 AuthenticationError 调用 next（），而不仅仅是编写 401。

请注意，这个 options 对象也将传递给策略函数，因此您可以在此处传递由策略定义的额外选项。 例如，您可以将 callbackURL 传递给 oauth 策略。

回调函数 callback

callback 是一个 `fn(err， user， info)` 函数。 注间这里没有 req、res 或 next 参数，应该从函数调用的实参中获取传入。 如果身份验证失败，则用户将为 false。 如果身份验证成功，则调用您的回调，但此时并没有主动设置 req.user。 需要主动通过 `req.login()` 自行设置。

```js
app.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err)
    }
    if (!user) {
      return res.redirect("/login")
    }

    // NEED TO CALL req.login()!!!
    req.login(user, next)
  })(req, res, next)
})
```

另外，当注册了 `passport.authenticate` 中间件后，passport 会在 request 对象上扩展两个方法和属性。

- `req.logIn(user, options, callback)`：作用是为登录用户初始化session。options可设置session为false，即不初始化session，默认为true。
- `req.logout()`：作用是登出用户，删除该用户session。不带参数。
- `req.isAuthenticated`：作用是测试该用户是否存在于session中（即是否已登录）。若存在返回true。事实上这个比登录验证要用的更多，毕竟session通常会保留一段时间，在此期间判断用户是否已登录用这个方法就行了。
- `req.isUnauthenticated`：不带参数。和上面的作用相反。

## api

其它接口参考：[Passport-api-docs](https://github.com/jwalton/passport-api-docs)

- `passport.Passport`
- `passport.initialize`
- `passport.session(options) = passport.authenticate('session')`
- `passport.authenticate(strategyName[, options][,callback])`
- `passport.use([strategyName, ] strategy)`
- `passport.serializeUser(fn(user, done) | fn(req, user, done))`
- `passport.deserializeUser(fn(user, done) | fn(req, user, done))`
