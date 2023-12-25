/*
 * @Date         : 2023-12-24 20:22:22 星期0
 * @Author       : xut
 * @Description  : 接收原始流文件
 */
import path from "node:path"
import Koa from "koa"
import Router from "@koa/router"
import { createWriteStream } from "node:fs"
import { finished } from "node:stream/promises"

const app = new Koa()
const router = new Router()

// 这里也可以参照 multer 等包的做法，在无法预知客户端会上传什么文件的情况下，直接使用不带后缀名的随机字符串命名
// TODO: 如何能确切知道文件名和后缀名呢？需要前端通过请求头传入
const randomString = generateRandomString(15)
const UPLOAD_DIR = path.join(process.cwd(), "/02-request/uploads", randomString)

router.post("/file/raw", async (ctx) => {
  const writeStream = createWriteStream(UPLOAD_DIR)
  ctx.req.pipe(writeStream)
  await finished(writeStream)
  ctx.body = "received success"
})

app.use(router.routes()).use(router.allowedMethods())
app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})

/**
 * 随机产生字符串的几种原生方法
 * 参考链接 [在JavaScript中如何生成随机字符串](https://juejin.cn/post/6844903665522704398)
 *
 * 方法一：利用 32 进制
 * Math.random() // 生成随机数字 0.123456
 * .toString(36) // 转化成 36进制 “0.4fzyo82mvyr”
 * .slice(-8) // 取最后八位 "yo82mvyr"
 *
 * 延伸知识
 * 10进制包含的字符为为 0-9
 * 16进制包含的字符为 0-9，a-f
 * 36进制包含的字符为 0-9，a-z。
 *
 * 缺点
 * 1. 只能生成有 0-9、a-z字符组成的字符串
 * 2. 由于 Math.random() 生成的18位小数，可能无法填充36位，最后几个字符串，只能在指定的几个字符中选择。导致随机性降低。
 * 3. 某些情况下会返回空值。例如，当随机数为 0, 0.5, 0.25, 0.125...时，返回为空值，但是概率极少，几千万次计算中随机值为空值
 *
 * 方法二：固定字符集
 *
 * const character = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' // 0-9a-zA-Z
 * function randomString(length) {
 *     var result = '';
 *     for (var i = length; i > 0; --i) result += character[Math.floor(Math.random() * character.length)];
 *     return result;
 * }
 *
 * 方法三：crypto
 *
 * function generateRandomString(len) {
 *  // 判断是否为有限数值
 *  if (!Number.isFinite(len)) throw new TypeError('Expected a finite number')
 *  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len)
 * }
 *
 * crypto.randomBytes(size[, callback]) 生成加密强伪随机数据. size参数是指示要生成的字节数的数值，1个字节8位，16进制2个字节8位，所以随机字节数为长度的一半
 */
function generateRandomString(len) {
  if (!Number.isFinite(len))
    throw new TypeError(`Expected a finite number, got is ${len}`)
  return randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .slice(0, len)
}
