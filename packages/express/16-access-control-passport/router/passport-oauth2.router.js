/*
 * @Date         : 2024-03-16 12:57:02 星期6
 * @Author       : xut
 * @Description  :
 */
import passport from "passport"
import OAuth2Strategy from "passport-oauth2"
import { userModel } from "../db/index.js"
import { Router } from "express"

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "https://gitee.com/oauth/authorize",
      tokenURL: "https://gitee.com/oauth/token",
      clientID:
        "150be2cc0fe88fa75e2eca6d3aa292a87d867a6b7c7c4c61fde958fb66295e4d",
      clientSecret:
        "f85748c2309f383b415e8689c26da0651aef8203a13ec2a6429562b471498e72",
      callbackURL: "http://localhost:9001/passport-oauth2/redirect/gitee",
    },
    function verify(access_token, refresh_token, profile, done) {
      console.log("🚀 ~ profile:", profile)
      const user = userModel.get(1)

      if (!user) return done(null, false)

      return done(null, user)
    }
  )
)

export const router = Router()

router.get(
  "/redirect/gitee",
  passport.authenticate("oauth2", { failureRedirect: "/passport-oauth2/" })
)

router.get("/login", passport.authenticate("oauth2"))

router.get("/", (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated,
    user: req.user,
    session: req.session,
  })
})
