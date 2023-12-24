/*
 * @Date         : 2023-12-23 19:39:34 星期6
 * @Author       : xut
 * @Description  : 02-request 请求参数的获取
 *
 * - 请求参数，`req.method / req.protocol / req.hostname / req.originalUrl / req.url / req.path`
 * - 查询参数，如 `/blog/list?id='sfd'&author='lisa'`，通过 `req.query.id`获取，在 express 内部通过 qs 依赖包已实现，直接使用
 * - 路径参数，如 `/blog/detail/:id`，通过 `req.params.id`，这个在 express 内部通过 path-to-regexp 依赖包已实现，直接使用
 * - 请求体，根据请求体的类型，需要配置对应的中间件，通过 `req.body` 获取对象值：
 *   - `"Content-Type": "application/x-www-form-urlencoded"`时，配置内置中间件 `express.urlencoded(options)`
 *   - `"Content-Type": "multipart/form-data"`时，可以使用外部中间件，比如 `multer`解析，并通过 `res.file / res.files` 获取
 *   - `"Content-Type": "application/json"`时，配置内置的中间件 `express.json(options)`
 *   - `"Content-Type": "application/octet-stream"`时，配置内置中间件 `express.raw(options)`
 * - 请求头 `req.headers`
 *   - cookie，需要使用 `cookie-parser` 依赖包解析，然后通过 `req.cookies` 获取对象，如果 cookie 已签名，则通过 `req.signedCookies` 获取。
 *   - `req.headers.authorization`，或者 `req.get('authorization')`
 *     实际上，express.json/urlencoded/raw 的解析中间件，内部都依赖于 `body-parser` 这个中间件。其中的 options 针对不同方法，可设置不同的参数。
 */

/**
// express.json(options) / body-parser.json(options)
{
  "inflate": true, // 默认 true，是否开启压缩体解析
  "limit": "100kb", // 默认 100kb，最大请求数据，传入数字默认单位是bytes，传入字符串要带上单位
  "reviver": (key, value)=> {...}, // reviver就相当于在JSON.parse()方法传入了第二个参数reviver做数据的预处理。
  "strict": true, // 默认 true，开启严格模式只能接收能被JSON.parse()方法解析的数据
  "type": "application/json", // 接收数据的类型，默认是"application/json"
  "verify": (req, res, buf, encoding) => {...} // 验证数据，如果无效就可以提前抛出错误信息
}

// express.urlencoded(options) / body-parser.urlencoded(options)
{
  // 默认 true, 指定解析URL-encode数据的方法，true的话使用qs库来解析，false的话使用 querystring 库去解决
  // 由于 express 内部使用了 qs 库实现了 req.query 的解析，所以这里默认 true，基本不改。
  "extended": true,
  "inflate": true, // 默认 true，是否开启压缩体解析
  "limit": "100kb", // 默认 100kb，最大请求数据，传入数字默认单位是bytes，传入字符串要带上单位
  "parameterLimit": 1000, // 默认 1000，控制url编码数据中最大参数数量，超过这个数量返回413
  "type": "application/x-www-form-urlencoded", // 接收数据的类型，默认是"application/x-www-form-urlencoded"
  "verify": (req, res, buf, encoding) => {...} // // 验证数据，如果无效就可以提前抛出错误信息
}

// express.raw(options) / body-parser.raw(options)
{
  inflate: true,
  limit: '100kb',
  type: 'application/octet-stream',
  verify: (req, res, buf, encoding) => {},

}
 * 
 */
import express from "express"

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Hello World By Express")
})

app.get("/url", (req, res) => {
  res.json({
    method: req.method,
    url: req.url,
    protocol: req.protocol,
    hostname: req.hostname,
    secure: req.secure,
    pathname: req.pathname,
  })
})

app.get("/query", (req, res) => {
  res.json(req.query)
})

app.get("/params/:id", (req, res) => {
  res.json(req.params)
})

app.post("/body/urlencoded", (req, res) => {
  res.json(req.body)
})

app.post("/body/json", (req, res) => {
  res.json(req.body)
})

app.get("/headers", (req, res) => {
  res.json(req.headers)
})

app.post("/headers/type", (req, res) => {
  const contentType = req.get("content-type")
  const authorization = req.get("authorization")
  res.json({ contentType, authorization })
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
