/*
 * @Date         : 2024-03-18 15:21:09 星期1
 * @Author       : xut
 * @Description  :
 */
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
