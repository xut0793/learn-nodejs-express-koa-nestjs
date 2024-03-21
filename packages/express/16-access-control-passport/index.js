/*
 * @Date         : 2024-03-14 17:32:52 星期4
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import express from "express"
import { create } from "express-handlebars"
import session from "express-session"
import passport from "passport"
import { router as passportLocalRouter } from "./router/passport-local.router.js"
import { router as passportHttpRouter } from "./router/passport-http.router.js"
import { router as passportJwtRouter } from "./router/passport-jwt.router.js"
import { router as passportOAuth2Router } from "./router/passport-oauth2.router.js"

const app = express()

app.use(
  "/static",
  // express.static 中间件推荐的精心设计的选项对象值：
  express.static(
    resolve(process.cwd(), "./16-access-control-passport/public"),
    {
      dotfiles: "ignore",
      etag: false,
      extensions: ["htm", "html"],
      index: false,
      maxAge: "1d",
      redirect: false,
      setHeaders: function (res, path, stat) {
        res.set("x-timestamp", Date.now())
      },
    }
  )
)

const hbs = create({ extname: "hbs", defaultLayout: false })
app.engine("hbs", hbs.engine)
app.set("view engine", "hbs")
app.set("views", resolve(process.cwd(), "./16-access-control-passport/view"))

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(
  session({
    name: "SESSIONID",
    secret: "__secret__",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: 1 * 60 * 60 * 1000, // 1h
    },
  })
)
app.use(passport.session())

app.use("/passport-local", passportLocalRouter)
app.use("/passport-http", passportHttpRouter)
app.use("/passport-jwt", passportJwtRouter)
app.use("/passport-oauth2", passportOAuth2Router)
app.use((err, req, res) => {
  return res.status(400).send(JSON.stringify(err))
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
