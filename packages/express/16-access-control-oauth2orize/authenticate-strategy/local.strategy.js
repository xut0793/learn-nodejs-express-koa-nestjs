/*
 * @Date         : 2024-03-18 11:42:50 星期1
 * @Author       : xut
 * @Description  :
 */
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
