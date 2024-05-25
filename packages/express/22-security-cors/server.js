/*
 * @Date         : 2024-04-12 10:24:40 星期5
 * @Author       : xut
 * @Description  :
 */
import express from "express"
import cookieParser from "cookie-parser"

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.get("/nothing", (req, res) => {
  console.log("🚀 ~ app.get", req.url)
  res.send("nothing ok")
})

app.get("/simple", (req, res) => {
  console.log("🚀 ~ app.get", req.url)
  res.send("simple ok")
})

app.post("/simple", (req, res) => {
  console.log("🚀 ~ app.post", req.url)
  console.log("🚀 ~ app.post body", req.body)
  res.send(req.body)
})

app.get("/allow", (req, res) => {
  console.log("🚀 ~ app.get", req.url)
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Access-Control-Allow-Origin, X-My-Custom-Header"
  )
  res.setHeader("X-My-Custom-Header", "abc")
  res.send("allow ok")
})

app.options("/preflight", (req, res) => {
  console.log("🚀 ~ app.options", req.url)
  console.log("🚀 ~ app.headers", req.headers)

  /**
   * Access-Control-Allow-Origin 的值只能是 * <origin> null
   *
   * * 对于不包含凭据的请求，服务器会以“*”作为通配符，从而允许任意来源的请求代码都具有访问资源的权限。尝试使用通配符来响应包含凭据的请求会导致错误。
   * <origin> 指定一个来源,只能指定一个。如果服务器支持多个来源的客户端，其必须以与指定客户端匹配的来源来响应请求。
   * null 不应该被使用。
   *
   */
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization") // 可以字符串，也可以是字符串数组
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS, POST, PUT, PATCH, DELETE"
  )

  /**
   * 多个值表示为字符串，和字符串数组的区别在于：
   * 响应给浏览器端时，如果是字符串，则仅为一个响应头字段。如果是字符中数组，则响应传输过程中会转为单个显示。
   * - 多个字段值组成一个字符串时，浏览器显示作为单个 Access-Control-Allow-Headers:"Content-Type, Authorization"
   * - 如果是字符串数组形式，浏览器会拆为单个值显示。
   *
   * Access-Control-Allow-Headers：["Content-Type", "Authorization"]
   * 显示为为
   * Access-Control-Allow-Headers： Content-Type
   * Access-Control-Allow-Headers： Authorization
   */
  // res.setHeader("Access-Control-Allow-Headers", [
  //   "Content-Type",
  //   "Authorization",
  // ]) // 可以字符串
  // res.setHeader("Access-Control-Allow-Methods", [
  //   "POST",
  //   "PUT",
  //   "PATCH",
  //   "DELETE",
  // ]) // 也可以是字符串数组
  res.setHeader("Access-Control-Max-Age", 600) // 10分钟
  res.status(204).end()
})

app.post("/preflight", (req, res) => {
  console.log("🚀 ~ app.post", req.url)
  console.log("🚀 ~ app.post body", req.body)
  // 如果不加该请求头，即使 options 请求成功，该请求的也会报 CORS 错误
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.send(req.body)
})

app.options("/credentials", (req, res) => {
  console.log("🚀 ~ app.options", req.url)
  console.log("🚀 ~ app.headers", req.headers)

  res.setHeader("Access-Control-Allow-Origin", "http://localhost:9001")
  res.setHeader("Access-Control-Allow-Credentials", true)
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization") // 可以字符串，也可以是字符串数组
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS, POST, PUT, PATCH, DELETE"
  )
  // res.setHeader("Access-Control-Max-Age", -1) // 每次都需要预检请求
  res.status(204).end()
})

app.post("/credentials", cookieParser(), (req, res) => {
  console.log("🚀 ~ app.get", req.url)
  console.log("🚀 ~ app cookie", req.cookies)

  res.setHeader("Access-Control-Allow-Origin", "http://localhost:9001")
  res.setHeader("Access-Control-Allow-Credentials", true)
  res.send(req.cookies)
})

app.get("/jsonp", (req, res) => {
  const { id, cb } = req.query

  // 把 cb 的值拼装成函数调用的形式，并传入实参 jsonpCallback({id, abc: 123}) 返回给客户端
  res.status(200).send(`${cb}({id: ${id}, abc: 123 })`)
})

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
