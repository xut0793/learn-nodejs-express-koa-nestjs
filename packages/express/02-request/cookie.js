/*
 * @Date         : 2023-12-23 20:34:27 星期6
 * @Author       : xut
 * @Description  : cookie 解析中间件 cookie-parser，会将提取的对象放在 req.cookies 上。内部实现依赖于 cookie 包
 *                1. 获取 req.cookies / req.signedCookies（如果已签名的值在客户端有被改动，则读取的值为false)
 *                2. 设置时，express 提供了内置实现： res.cookie(key, value, options)
 *                3. res.cookie 设置某个cookie后，想清除，则可以调用 res.clearCookie(name, options)
 *
 * 一、中间件安装和注册
 * pnpm add cookie-parser
 *
 * app.use(cookieParser(secret, options))
 *
 * 二、中间件配置选项
 * cookie-parser(options)
 * {
 *    secret: '',
 *    options: {
 *        decode: false,
 *       // 这个值的设置会影响cooke获取的位置。
 *      // 当默认为 false 时，则已签名的cookie从req.signedCookies 上获取原始值，未设置签名的从 req.cookies 上获取
 *      // 当设置 true 时，则所有cookies都在 req.cookies 上获取，但设置了签名的 cookie 不是原始值，是被签名的值。
 *      // 所以这个属性有点反人性。
 *    }
 *
 * 示例：
 * app.use(cookieParser('__secret__', options))
 * res.cookie("no-sign", "ninja")
 * res.cookie("signed", "ninja", { signed: true })
 *
 * 1. 当 decode: false 时
 * 客户端收到签名的 signed 值是 s:Aninja.3xZA%2BqZ6iXlD5UvE0O8Cjym3tcG21eM8sqPVEDra6Sk
 * 此时服务端获取时分别通过 res.cookies['no-sign'] 和 res.signedCookies['signed] 获取，值都为原始值 ’ninja'
 *
 * 2. 当 decode: true 时，
 * 客户端收到签名的 cookies 值仍是签名后的。但是服务端获取时就有所区别
 * 此时 res.signedCookes 没会 signed 的值了。都要从 res.cookies 中获取。
 * res.cookies = {
 *    'no-sign': 'ninja',
 *    'signed': 's:Aninja.3xZA%2BqZ6iXlD5UvE0O8Cjym3tcG21eM8sqPVEDra6Sk'
 * }
 *    }
 * }
 *
 * 另外，如果客户端浏览器篡改了已签名的 cookie，则服务端再次获取该 cookies 的值将为 false
 * res.signedCookies['signed'] = false
 *
 * 三、设置响应的 cookie
 * res.cookie响应时设置 cookie 时选项
 *   domain	字符串	cookie 的域名。 默认为应用的域名。
 *   encode	函数	用于 cookie 值编码的同步函数。 默认为 encodeURIComponent。
 *   expires	日期	格林威治标准时间 cookie 的到期日期。 如果未指定或设置为 0，则创建会话 cookie。
 *   httpOnly	布尔值	将 cookie 标记为只能由 Web 服务器访问。
 *   maxAge	数字	方便的选项，用于设置相对于当前时间的到期时间（以毫秒为单位）。
 *   path	字符串	cookie 的路径。 默认为 “/”。
 *   priority	字符串	“优先级” Set-Cookie 属性的值。
 *   secure	布尔值	将 cookie 标记为仅与 HTTPS 一起使用。
 *   signed	布尔值	指示是否应该对 cookie 进行签名。
 *   sameSite	布尔值或字符串	“SameSite” Set-Cookie 属性的值。
 * }
 */
import express from "express"
import cookieParser from "cookie-parser"

const app = express()
const defaultCookieParser = cookieParser()
const signCookieParser = cookieParser("__secret__", { decode: false })

app.get("/cookie/get", defaultCookieParser, (req, res) => {
  res.json(req.cookies)
})

app.get("/cookie/set", (req, res) => {
  res.cookie("custom_cookie", "123", { path: "/", maxAge: 5000 })
  res.send("set cookie")
})

app.get("/cookie/sign-get", signCookieParser, (req, res) => {
  if (req.signedCookies["signed"] === false) {
    res.status(401).send("已签名的 cookie singed 的值已被篡改，无效了")
    return
  }
  res.json({
    cookies: req.cookies,

    // 当 decode 为 true 时， 为空对象，所以有 cookie 都被附加到 req.cookies 对象上了。
    signedCookies: req.signedCookies,
  })
})

app.get("/cookie/sign-set", signCookieParser, (req, res) => {
  res.cookie("no-sign", "ninja")
  res.cookie("signed", "ninja", { signed: true })

  /**
   * 签名前：ninja
   * 签名后的值，即客户接收的值为：	s%3Aninja.3xZA%2BqZ6iXlD5UvE0O8Cjym3tcG21eM8sqPVEDra6Sk
   * 但不影响服务端读取的值，仍为 ninja
   */

  res.send("cookie signed")
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
