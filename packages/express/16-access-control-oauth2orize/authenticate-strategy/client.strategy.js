/*
 * @Date         : 2024-03-18 14:55:55 星期1
 * @Author       : xut
 * @Description  :
 */
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
