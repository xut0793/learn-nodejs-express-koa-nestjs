import { Router } from "express"
import passport from "passport"
import LocalStrategy from "passport-local"
import { userModel } from "../db/index.js"

export const router = Router()

passport.use(
  new LocalStrategy(function verify(username, password, cb) {
    const user = userModel.find({ username, password })

    if (!user)
      return cb(null, false, { message: "Incorrect username or passport" })

    return cb(null, user)
  })
)

// 每当调用 passport.authenticate 或 passport.login 时，将上述 localStrategy 中 cb(null, user) 回调入参的 user 在附加到 req.session.passport 对象之前的处理。比如通常将密码去掉
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { uid: user.uid, username: user.username })
  })
})

// 从 req.session 中取出 user 对象用于认证，需要进行的预处理
// 反序列化时，如果用户不再在数据库中（可能该用户已被删除，或者执行了某些操作使其会话无效）。
// 在这种情况下，反序列化函数应为用户传递 null 或 false，而不是 undefined。
passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    const u = userModel.get(user.uid)
    return cb(null, u ?? false)
  })
})

/**
 * req.user 和 req.isAuthenticated 生效，需要注册 app.use(passport.session())
 */
router.get("/", (req, res) => {
  return res.render("index", {
    isAuthenticated: req.isAuthenticated(),
    user: JSON.stringify(req.user),
    passport: JSON.stringify(req.session.passport),
  })
})

router.get("/login", (req, res) => {
  return res.render("form", { api: "/passport-local/login" })
})

/**
 * 此函数返回运行策略的中间件。 如果其中一个策略成功，则将设置 req.user。 如果未传递任何选项或回调，并且所有策略都失败，则会将 401 写入响应。
 * 此中间件还向 req 对象添加了帮助程序函数：req.login()、req.logout() 和 req.isAuthenticated。
 */
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/passport-local/",
    failureRedirect: "/passport-local/login",
  })
)

router.get("/logout", (req, res, next) => {
  // 删除 req.user，将从会话中删除 req.session.passport
  req.logout((err) => {
    if (err) return next(err)
    res.redirect("/passport-local/")
  })
})

router.get("/register", (req, res) => {
  return res.render("form", { api: "/passport-local/register" })
})

router.post("/register", (req, res, next) => {
  const { username, password } = req.body
  if (userModel.has(username)) {
    return next(new Error("user name already exists"))
  }

  const newUser = userModel.add({ username, password })
  // 将使 passport 将用户序列化 serializeUser 到会话 req.session.passport 中，完成后将设置 req.user
  return req.login(newUser, (err) => {
    if (err) return next(err)
    res.redirect("/passport-local/")
  })
})

router.get(
  "/resource",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    } else {
      res.redirect("/passport-local/login")
    }
  },
  (req, res) => {
    return res.render("index", {
      isAuthenticated: req.isAuthenticated(),
      user: JSON.stringify(req.user),
      passport: JSON.stringify(req.session.passport),
    })
  }
)
