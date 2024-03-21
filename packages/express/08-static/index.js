/*
 * @Date         : 2024-01-08 20:18:29 星期1
 * @Author       : xut
 * @Description  :
 * express.static options
 *  - dotfiles ignore, 确定如何处理点文件（以点 “.” 开头的文件或目录）
 *      - “allow” - 对点文件没有特殊处理。
 *      - “deny” - 拒绝点文件请求，以 403 响应，然后调用 next()。
 *      - “ignore” 就好像 dotfile 不存在一样，用 404 响应，然后调用 next()
 *  - etag true, 启用或禁用 etag 生成。注意：express.static 总是发送弱 ETag，即以 w开关
 *  - extensions false, 设置文件扩展名后备：如果找不到文件，请搜索具有指定扩展名的文件并提供第一个找到的文件。例子：['html', 'htm']。
 *  - fallthrough true, 为 true 时，客户端错误（例如错误请求或对不存在文件的请求）将导致此中间件简单地调用 next() 以调用堆栈中的下一个中间件。当为 false 时，这些错误（甚至是 404）将调用 next(err)。。
 *  - immutable	 false, 在 Cache-Control 响应标头中启用或禁用 immutable 指令。
 *              如果启用，还应指定 maxAge 选项以启用缓存。immutable 指令将阻止受支持的客户端在 maxAge 选项的生命周期内发出条件请求以检查文件是否已更改。
 *  - index	index.html, 发送指定的目录索引文件。设置为 false 以禁用目录索引。
 *  - lastModified true, 将 Last-Modified 标头设置为操作系统上文件的最后修改日期。
 *  - maxAge 0,	设置 Cache-Control 标头的 max-age 属性（以毫秒为单位）或 ms 格式 中的字符串。
 *  - redirect true,当路径名是目录时，重定向到尾随 “/”。
 *  - setHeaders fn, 用于自定义某些文件一起响应的 HTTP 标头。fn(res, path, stat)。
 *    - res 响应对象
 *    - path，正在发送的文件路径。
 *    - 正在发送的文件的 stat 对象。
 */
import { resolve } from "node:path"
import express from "express"

const app = express()

app.use(
  "/static",
  // express.static 中间件推荐的精心设计的选项对象值：
  express.static(resolve(process.cwd(), "./08-static/public"), {
    dotfiles: "ignore",
    etag: false,
    extensions: ["htm", "html"],
    index: false,
    maxAge: "1d",
    redirect: false,
    setHeaders: function (res, path, stat) {
      res.set("x-timestamp", Date.now())
    },
  })
)

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
