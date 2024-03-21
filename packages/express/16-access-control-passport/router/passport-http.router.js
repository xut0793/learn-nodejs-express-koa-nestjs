/*
 * @Date         : 2024-03-16 09:52:05 星期6
 * @Author       : xut
 * @Description  : passport-http 是基于 HTTP Basic 和 Digest 身份验证策略
 */
import { Router } from "express"
import passport from "passport"
import { BasicStrategy, DigestStrategy } from "passport-http"
import { userModel } from "../db/index.js"

export const router = Router()

passport.use(
  new BasicStrategy(function verify(username, password, done) {
    const user = userModel.find({ username, password })

    if (!user) return done(null, false)

    return done(null, user)
  })
)

router.get(
  "/basic",
  passport.authenticate("basic", { session: false }),
  function (req, res) {
    return res.json(req.user)
  }
)

passport.use(
  /**
   * Options:
   *   - `realm`      authentication realm, defaults to "Users"
   *   - `domain`     list of URIs that define the protection space
   *   - `algorithm`  algorithm used to produce the digest (MD5 | MD5-sess)
   *   - `qop`        list of quality of protection values support by the server (auth | auth-int) (recommended: auth)
   *   - `opaque`
   */
  new DigestStrategy(
    { realm: "test", qop: "auth", algorithm: "MD5" },
    function (params, done) {
      console.log("🚀 ~ new DigestStrategy ~ params:", params)
      /**
       * `validate` params:
       *   - `nonce`   unique string value specified by the server
       *   - `cnonce`  opaque string value provided by the client
       *   - `nc`      count of the number of requests (including the current request) that the client has sent with the nonce value
       *   - `opaque`  string of data, specified by the server, which should be returned by the client in subsequent requests
       */
      done(null, true)
    },
    function verify(username, done) {
      const user = userModel.findByUsername(username)

      if (!user) return done(null, false)

      return done(null, user)
    }
  )
)

router.get(
  "/digest",
  passport.authenticate("digest", { session: false }),
  function (req, res) {
    return res.json(req.user)
  }
)
