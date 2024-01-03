/*
 * @Date         : 2024-01-03 10:18:13 星期3
 * @Author       : xut
 * @Description  : HTTP 响应
 *
 * 一、响应报文
 * HTTP/1.1 200 OK                             // 协议版本 状态码 状态描述
 * Content-Length: 1024
 * Content-Type: application/json
 *
 * {"code":200,"message":null,"data":"xxx"}
 *
 * 二、响应数据设置
 * 1.状态码和状态文本 res.sendStatus(code) ==== res.status(code).send(codeMessage)
 * 2.响应头 res.set(field, value) / res.set({field: value}) / res.type / res.attachment / res.cookie(name, value, options)
 * 3.响应体 res.send / res.json / res.format / res.download / res.sendFile
 * 4.重定向 res.redirect
 */
import { resolve } from "node:path"
import express from "express"
import cookieParser from "cookie-parser"

const signCookieParser = cookieParser("__secret__", { decode: false })
const app = express()

app.get("/status-code", (req, res) => {
  // 方式一
  // res.status(200).send("response ok")
  // 方式二
  // 将响应 HTTP 状态代码设置为 statusCode，并将注册的状态消息作为文本响应正文发送。
  // 如果指定了未知状态代码，则响应正文将只是代码编号。
  res.sendStatus(200)
})

app.get("/header", (req, res) => {
  // 常规就是 res.set(field, value) / res.set({field: value})
  res.set("X-Foo", "bar")

  // 有几类常用的响应头,提供了快捷方式
  // res.type => content-type;
  // res.attachment => content-disposition: attachment; filename;
  // cookie => res.cookie
  res.type("html")
  res.send("set header end")
})
app.get("/cookie/set", (req, res) => {
  res.cookie("custom_11", "1111", { path: "/", maxAge: 5000 })
  res.cookie("custom_22", "222", {
    path: "/",
    expires: new Date(Date.now() + 5 * 60 * 1000),
    httpOnly: true,
  })
  res.send("set cookie")
})
app.get("/cookie/sign-set", signCookieParser, (req, res) => {
  // 签名 cookie 需要配合 cookie-parser 提供 secret

  res.cookie("no-sign", "ninja")
  res.cookie("signed", "ninja", { signed: true })

  /**
   * 签名前：ninja
   * 签名后的值，即客户接收的值为：	s%3Aninja.3xZA%2BqZ6iXlD5UvE0O8Cjym3tcG21eM8sqPVEDra6Sk
   * 但不影响服务端读取的值，仍为 ninja
   */

  res.send("cookie signed")
})
app.get("/redirect", (req, res) => {
  res.redirect("http://www.bing.com")
})
app.get("/body/text", (req, res) => {
  res.type("text/plain")
  res.send("/body/text")
})
app.get("/body/html", (req, res) => {
  res.type("html")
  res.send("<h1>/body/html</h1>")
})
app.get("/body/json", (req, res) => {
  // 方式一
  // res.type("json")
  // res.send({ author: "lisa", createTime: Date.now() })
  // 方式二
  res.json({ author: "lisa", createTime: Date.now() })
})
app.get("/body/download", (req, res, next) => {
  const filename = "test.txt"
  const filePath = resolve(process.cwd(), "../../public", filename)
  // res.download(filePath)
  // res.download(filePath, filename)
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error(err)
      next(err)
    } else {
      console.log("download:", filename)
    }
  })
})
app.get("/body/file", (req, res, next) => {
  const filename = "test.txt"
  const filePath = resolve(process.cwd(), "../../public", filename)
  res.sendFile(filePath)
  const options = {
    dotfiles: "deny",
    headers: {
      "x-timestamp": Date.now(),
      "x-sent": true,
    },
  }

  res.sendFile(filePath, options, (err) => {
    if (err) {
      console.error(err)
      next(err)
    } else {
      console.log("sendFile:", filename)
    }
  })
})
app.get("/body/format", (req, res) => {
  const accept = req.header("accept")
  console.log("🚀 ~ file: index.js:124 ~ app.get ~ accept:", accept)

  // 根据请求对象的 Accept 请求头（如果存在）执行内容协商. 如果未指定标头，则调用第一个回调。当没有找到匹配时，服务器响应 406 “不被接受”，或者调用 default 回调。
  // 也可以选择在响应中设置 content-type 响应头进行匹配.
  res.format({
    "text/plain"() {
      res.send("hey")
    },

    "text/html"() {
      res.send("<p>hey</p>")
    },

    "application/json"() {
      res.send({ message: "hey" })
    },

    default() {
      // log the request and respond with 406
      res.status(406).send("Not Acceptable")
    },
  })
})
app.use("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
