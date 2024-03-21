/*
 * @Date         : 2024-03-18 11:00:43 星期1
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import express from "express"
import { create } from "express-handlebars"
import session from "express-session"
import passport from "passport"
import { userModel } from "./db/index.js"
import { router } from "./router/index.js"
import { router as oauth2Router } from "./router/oauth2.router.js"
import { localAuthenticate } from "./authenticate-strategy/index.js"

const app = express()
const port = process.env.PORT || 9001

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
app.use("/api", router)
app.use("/oauth2", oauth2Router)

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`)
})
