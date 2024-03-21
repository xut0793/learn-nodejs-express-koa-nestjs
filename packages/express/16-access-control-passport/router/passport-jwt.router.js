/*
 * @Date         : 2024-03-16 11:27:24 星期6
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import passport from "passport"
import jwt from "jsonwebtoken"
import LocalStrategy from "passport-local"
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"
import { userModel } from "../db/index.js"

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      session: false,
    },
    function verify(username, password, done) {
      const user = userModel.find({ username, password })

      if (!user)
        return done(null, false, { message: "Incorrect username or passport" })

      return done(null, user)
    }
  )
)

/**
 * options 配置对象：
 * secretOrKey 是包含加密( 对称) 或者 public 编码密钥( 非对称)的字符串或者缓冲区，用于验证令牌的签名。 除非提供 secretOrKeyProvider，否则需要。
 * secretOrKeyProvider 是格式中的回调 function secretOrKeyProvider(request, rawJwtToken, done) 应该为给定密钥和请求组合调用一个密码或者 done 编码的public 密钥( 非对称)。 done 以 function done(err, secret) 格式接受参数。 除非提供 secretOrKey，否则需要。
 * jwtFromRequest 接受请求作为唯一参数并将作为字符串或者字符串返回的jwtFromRequest ( 必选) 函数 null。 有关详细信息，请参阅从请求列表中提取 JWT。
 * issuer: 如果定义了令牌颁发者( iss )，将根据这个值验证。
 * audience: 如果定义了，则令牌受众( 音频) 将根据这里值进行验证。
 * algorithms: 带允许算法名称的字符串列表。 例如 ["HS256","HS384"]。
 * ignoreExpiration: 如果 true 不验证令牌的到期时间。
 * passReqToCallback: 如果 true，请求将被传递到验证回调。 verify( req，jwt_payload，done_callback )。
 * jsonWebTokenOptions: passport-jwt使用 jsonwebtoken 验证令牌。
 */
const jwtOptions = {
  secretOrKey: "__SECRET__",
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}
passport.use(
  new JwtStrategy(jwtOptions, function verify(jwtPayload, done) {
    const user = userModel.get(jwtPayload.sub)

    if (!user) return done(null, false)
    return done(null, user)
  })
)

export const router = Router()

router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  (req, res) => {
    const user = req.user
    const payload = {
      sub: user.uid,
      username: user.username,
    }
    const token = jwt.sign(payload, jwtOptions.secretOrKey, {
      expiresIn: "1h",
    })

    return res.json({ code: 0, msg: "ok", data: { token } })
  }
)

router.get(
  "/user",
  passport.authenticate("jwt", { session: false }),
  function (req, res) {
    return res.json(req.user)
  }
)
