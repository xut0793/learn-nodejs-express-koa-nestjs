/*
 * @Date         : 2024-01-08 20:58:41 星期1
 * @Author       : xut
 * @Description  : 静态文件服务 static server
 *
 * 一、基本逻辑
 * - 传入静态文件目录，返回一个中间件函数
 * - 当请求抵达时，只有 GET 请求才处理
 * - 根据请求的 url，只有以设置的静态文件目录为 base 开头的文件才处理
 * - 检查文件是否存在
 *   - 如果文件不存在，返回 404 状态码，发送 not found 页面到客户端
 *   - 如果文件存在，打开文件待读取内容，设置 response header，发送文件到客户端
 * - 等待下一个请求
 *
 * 二、响应文件头支持 MIME
 *  css => text/css
 *  html => text/html
 *  jpg => image/jpeg
 *  等等
 *
 * 三、支持目录列表响应
 * - 请求抵达时，首先判断 url 是否是目录
 * - 如果是目录
 *     - 再看目录下是否存在默认页（如 index.html)，如果有，则返回 301 重定向到默认页
 *     - 不存在默认页，则发送目录下文件列表
 * - 如果不是目录，则认为请求的是文件，发送文件
 *   - 如果文件存在，则发送文件
 *   - 如果文件不存在，则返回 404
 *
 * 四、支持缓存
 *  - 强缓存 Expires Cache-Control
 *  - 协商缓存 Last-Modified / If-Modified-Since   Etag /I f-None-Match
 *
 * 五、内容编码和压缩 "Accept-Encoding": "gzip, deflate, br"
 * 六、范围请求，或叫媒体断点请求 Content-Range / Ranges
 * 七、安全路径, 去掉 ../ path.normalize
 */
import fs from "node:fs/promises"
import path from "node:path"
import { constants } from "node:fs"
import { createGzip, createDeflate, createBrotliCompress } from "node:zlib"

// 文件后缀与MIME的映射
const EXTNAME_MIME_MAP = {
  css: "text/css",
  gif: "image/gif",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  swf: "application/x-shockwave-flash",
  tiff: "image/tiff",
  txt: "text/plain",
  wav: "audio/x-wav",
  wma: "audio/x-ms-wma",
  wmv: "video/x-ms-wmv",
  xml: "text/xml",
}

class StaticServer {
  defaultOptions = {
    rootPath: process.cwd(),
    publicPath: "public",
    prefix: "public",
    maxAge: 5, // 5s
  }

  compressFileRE = /css|js|html/gi
  gzipRE = /\bgzip\b/
  deflateRE = /\bdeflate\b/

  constructor(root, options) {
    this.options = Object.assign(this.defaultOptions, {
      rootPath: root,
      ...options,
    })
  }

  async middleware(req, res, next) {
    // 只处理GET请求
    if (req.method !== "GET") return next()

    // 限定静态文件目录
    if (
      !(
        req.url.startsWith(`/${this.options.prefix}`) ||
        req.url.startsWith(`/${this.options.publicPath}`)
      )
    )
      return next()

    let url = req.url.replace(/\/\.\./g, "") // 将 /../app.js => /app.js 有两个斜杠
    url = url.replace(
      // 将 /static => /public
      `/${this.options.prefix}`,
      `/${this.options.publicPath}`
    )
    try {
      const filePath = path.resolve(this.options.rootPath, url.slice(1)) // /public/xxx，把 / 去掉变成相对路径

      let statInfo = await fs.stat(filePath)
      let isDirectory = statInfo.isDirectory()

      if (isDirectory) {
        // 尝试访问是否有 index.html 的读权限
        try {
          const indexHtml = path.resolve(filePath, "index.html")
          await fs.access(indexHtml, constants.R_OK)
          return this.respondRedirect(
            url.replace(/\/*$/g, "") + "/index.html",
            req,
            res
          )
        } catch (error) {
          return await this.respondDirectory(filePath, req, res)
        }
      } else {
        // 读取文件
        return await this.response(filePath, statInfo, req, res)
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(error)
        this.respondNotFound(req, res)
        return
      }
      next(error)
    }
  }

  resolveExtname(filePath) {
    let extname = path.extname(filePath)
    extname = extname ? extname.slice(1) : "unknown"
    let mime = EXTNAME_MIME_MAP[extname] ?? "text/plain"
    return { mime, extname }
  }

  // 请求头格式：Ranges: bytes=[start]-[end]
  resolveRange(rangeText, totalSize) {
    const matchResults = rangeText.match(/bytes=([0-9]*)-([0-9]*)/)
    let start = parseInt(matchResults[1], 10)
    let end = parseInt(matchResults[2], 10)

    if (isNaN(start)) {
      // 如果 start 省略，end 值指的就是服务器该返回最后多少个字节
      start = totalSize - end
      end = totalSize - 1
    } else if (isNaN(end)) {
      // 如果 end 省略，服务器应返回从 start 位置开始之后的所有字节
      end = totalSize - 1
    }

    // Invalid
    if (isNaN(start) || isNaN(end) || start > end || end > size) {
      return
    }

    return {
      start,
      end,
    }
  }

  async response(pathname, statInfo, req, res) {
    this.setFreshHeader(statInfo, res)

    let freshResult = this.isFresh(req, res)
    if (freshResult) {
      return this.respondNotModified(res)
    } else {
      return await this.respondFile(pathname, req, res)
    }
  }

  setFreshHeader(statInfo, res) {
    // http1.0规则：Expires和Last-Modified
    const lastModified = statInfo.mtime.toUTCString()
    const expires = new Date(
      Date.now() + this.options.maxAge * 1000
    ).toUTCString()

    res.setHeader("Expires", expires)
    res.setHeader("Last-Modified", lastModified)

    // http1.1规则：Cache-Control：max-age=[second]和Etag
    res.setHeader("Cache-Control", `public, max-age=${this.options.maxAge}`)
    res.setHeader("ETag", this.generateETag(statInfo))
  }

  generateETag(stat) {
    const mtime = stat.mtime.getTime().toString(16)
    const size = stat.size.toString(16)
    return `W/"${size}-${mtime}"`
  }

  isFresh(req, res) {
    const noneMatch = req.headers["if-none-match"]
    const lastModified = req.headers["if-modified-since"]

    // 因为setFreshHeader在isFresh执行前，已通过res.setHeader设置最新的缓存头，所以这里比对只需要从响应对象中取出即可
    if (!(noneMatch || lastModified)) return false
    if (noneMatch && noneMatch !== res.getHeader("etag")) return false // if-none-match 优先
    if (lastModified && lastModified !== res.getHeader("last-modified"))
      return false
    return true
  }

  respondNotModified(res) {
    res.writeHead(304)
    res.end()
  }

  respondNotFound(req, res) {
    res.writeHead(404, {
      "Content-Type": "text/html",
    })
    res.end(
      `<h1>Not Found</h1><p>The requested URL ${req.url} was not found on static server.</p>`
    )
  }

  async respondFile(filePath, req, res) {
    try {
      /**
       * 根据node官网建议，这里使用 open 查验文件是否存在，如果不存在，在erorr.code === ENOENT
       * 如果使用 fs.exists fs.stat fs.access 这些都会存在竞态条件。而open时文件被占用，如果其它进程再访问该文件时会报错。
       */
      const fd = await fs.open(filePath)
      let readStream = null

      // 解析MIME
      const { mime, extname } = this.resolveExtname(filePath)
      res.setHeader("Content-Type", mime)

      // 支持范围请求
      res.setHeader("Accept-Ranges", "bytes")
      const rangeText = req.headers["range"]

      if (rangeText) {
        readStream = this.rangeHandler(rangeText, statInfo, fd, res)

        if (!readStream) return
      } else {
        readStream = fd.createReadStream()
      }

      // 判断当前请求资源要不要压缩编码返回 html js css
      const compressMatched = this.compressFileRE.test(extname)

      if (compressMatched) {
        readStream = this.compressHandler(readStream, req, res)
      }

      readStream.pipe(res)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  rangeHandler(rangeText, statInfo, fd, res) {
    const range = this.resolveRange(rangeText, statInfo.size)

    if (range) {
      res.setHeader(
        "Content-Range",
        "bytes " + range.start + "-" + range.end + "/" + statInfo.size
      )
      res.setHeader("Content-Length", range.end - range.start + 1)

      // Node 的读文件流，原生支持 range 读取。
      return fd.createReadStream({ start: range.start, end: range.end })
    } else {
      res.removeHeader("Content-Length")
      res.writeHead(416, "Request Range Not Satisfiable")
      res.end()
      return
    }
  }

  compressHandler(readStream, req, res) {
    // 压缩，判断请求头中是否有可接受的压缩算法 "Accept-Encoding": "gzip, deflate, br"
    const acceptEncoding = req.headers["accept-encoding"] || ""

    if (this.gzipRE.test(acceptEncoding)) {
      res.writeHead(200, "Ok", {
        "Content-Encoding": "gzip",
      })
      return readStream.pipe(createGzip())
    } else if (this.deflateRE.test(acceptEncoding)) {
      res.writeHead(200, "Ok", {
        "Content-Encoding": "deflate",
      })
      return readStream.pipe(createDeflate())
    } else {
      res.writeHead(200, "Ok", {
        "Content-Encoding": "br",
      })
      return readStream.pipe(createBrotliCompress())
    }
  }

  async respondDirectory(pathname, req, res) {
    try {
      const dir = await fs.opendir(pathname)

      let content = `<h1>Index of ${req.url}</h1>`
      let hasTrailingSlash = req.url.endsWith("/")

      for await (const dirent of dir) {
        let href = hasTrailingSlash
          ? req.url + dirent.name
          : req.url + "/" + dirent.name
        content += `<p><a href='${href}'>${"./" + dirent.name}</a></p>`
      }

      res.writeHead(200, {
        "Content-Type": "text/html",
      })
      res.end(content)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  respondRedirect(location, req, res) {
    res.writeHead(301, {
      Location: location,
      "Content-Type": "text/html",
    })
    res.end(`Redirecting to <a href='${location}'>${location}</a>`)
  }
}

export default function create(root, options) {
  const staticServer = new StaticServer(root, options)
  return staticServer.middleware.bind(staticServer)
}
