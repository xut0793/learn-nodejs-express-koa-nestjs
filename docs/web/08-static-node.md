# Static server

静态服务器

## 基本逻辑

- 传入静态文件目录，返回一个中间件函数
- 当请求抵达时，只有 GET 请求才处理
- 根据请求的 url，只有以设置的静态文件目录为 base 开头的文件才处理
- 检查文件是否存在
  - 如果文件不存在，返回 404 状态码，发送 not found 页面到客户端
  - 如果文件存在，打开文件待读取内容，设置 response header，发送文件到客户端
- 等待下一个请求

```javascript
// staticServer.middleware.js
import fs from "node:fs/promises"
import path from "node:path"

class StaticServer {
  defaultOptions = {
    rootPath: process.cwd(),
    publicPath: "public",
    prefix: "public",
  }

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
    if (!req.url.startsWith(`/${this.options.prefix}`)) return next()
    const url = req.url.replace(
      `/${this.options.prefix}`,
      `/${this.options.publicPath}`
    )
    try {
      const filePath = path.resolve(this.options.rootPath, url.slice(1)) // /public/xxx，把 / 去掉变成相对路径
      /**
       * 根据node官网建议，这里使用 open 查验文件是否存在，如果不存在，在erorr.code === ENOENT
       * 如果使用 fs.exists fs.stat fs.access 这些都会存在竞态条件。而open时文件被占用，如果其它进程再访问该文件时会报错。
       */
      const fd = await fs.open(filePath)
      const readStream = fd.createReadStream()
      readStream.pipe(res)
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(error)
        this.respondNotFound(req, res)
        return
      }
      next(error)
    }
  }

  respondNotFound(req, res) {
    res.writeHead(404, {
      "Content-Type": "text/html",
    })
    res.end(
      `<h1>Not Found</h1><p>The requested URL ${req.url} was not found on static server.</p>`
    )
  }
}

export default function create(root, options) {
  const staticServer = new StaticServer(root, options)
  return staticServer.middleware.bind(staticServer)
}
```

在 router 中注册中间件，放在首位

```javascript
// src/router/index.js
import staticServer from "../middleware/staticServer.middleware.js"
router.use(
  staticServer(resolve(process.cwd(), "./08-static"), {
    publicPath: "public",
    prefix: "static",
  })
)
```

## 支持 MIME

现在返回给客户端的文件，我们并没有指定`Content-Type`头，虽然你可能发现访问文本或图片浏览器都可以正确显示出文字或图片，但这并不符合[规范](https://www.w3.org/Protocols/rfc2616/rfc2616-sec7.html#sec7.2.1 "规范")。

任何包含实体（entity body）的响应都应在头部指明文件类型，否则浏览器无从得知类型时，就会自行猜测（从文件内容以及 url 中寻找可能的扩展名）。

响应如指定了错误的类型也会导致内容的错乱显示，如明明返回的是一张`jpeg`图片，却错误指定了 header：`'Content-Type': 'text/html'`，会收到一堆乱码。

```javascript
import { open } from "node:fs/promises"
import path from "node:path"

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
  }

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
    if (!req.url.startsWith(`/${this.options.prefix}`)) return next()
    const url = req.url.replace(
      `/${this.options.prefix}`,
      `/${this.options.publicPath}`
    )
    try {
      const filePath = path.resolve(this.options.rootPath, url.slice(1)) // /public/xxx，把 / 去掉变成相对路径

      /**
       * 根据node官网建议，这里使用 open 查验文件是否存在，如果不存在，在erorr.code === ENOENT
       * 如果使用 fs.exists fs.stat fs.access 这些都会存在竞态条件。而open时文件被占用，如果其它进程再访问该文件时会报错。
       */
      const fd = await fs.open(filePath)
      const readStream = fd.createReadStream()

      // 解析MIME
      const mime = this.resolveExtname(filePath)
      res.writeHead(200, { "Content-Type": mime })

      readStream.pipe(res)
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
    return mime
  }

  // 省略代码
}
```

## 支持目录

- 请求抵达时，首先判断 url 是否是目录
- 如果是目录
  - 再看目录下是否存在默认页（如 index.html)，如果有，则返回 301 重定向到默认页
  - 不存在默认页，则发送目录下文件列表
- 如果不是目录，则认为请求的是文件，发送文件
  - 如果文件存在，则发送文件
  - 如果文件不存在，则返回 404

```javascript
class StaticServer {
  defaultOptions = {
    rootPath: process.cwd(),
    publicPath: "public",
    prefix: "public",
  }

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
    const url = req.url.replace(
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
        return await this.respondFile(filePath, req, res)
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
    return mime
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
      const readStream = fd.createReadStream()

      // 解析MIME
      const mime = this.resolveExtname(filePath)
      res.writeHead(200, { "Content-Type": mime })

      readStream.pipe(res)
    } catch (error) {
      return Promise.reject(error)
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
```

## 支持缓存

现在每一次静态文件的请求都是由服务器返回，但当请求量一上涨，硬盘 IO 会吃不消。为了减少数据传输，减少请求数，需要继续添加缓存支持。

HTTP 缓存分为强缓存和协商缓存两类：

### 强缓存

依据 http 版本的发展，强制缓存策略先后使用过的 http 头字段：`Pragma` `Expires` `Cache-Control`

- pragma 是旧规则，基本废弃了。
- Expires 是 http1.0 的规则，设置为一个到期时间。
- Cache-Control 是 http1.1 的规范，值可以设置：
  - max-age：代表该资源的有效期，单位秒。
  - no-cache: 需要进行协商缓存，发送请求到服务器确认是否使用缓存。
  - no-store：禁止使用缓存，每一次都要重新请求数据。
  - public：可以被所有的用户缓存，包括终端用户和 CDN 等中间代理服务器。
  - private：只能被终端用户的浏览器缓存，不允许 CDN 等中继缓存服务器对其缓存。

### 协商缓存

客户端会携带对应的请求头信息，服务端对信息进行校验，判断资源是否新鲜，如果新鲜可用，则会响应 304，告诉浏览器读取缓存。如果不新鲜了，则返回请求的资源，并重新刷新过期时间。

协商缓存策略使用两组 http 头信息： `Last-Modified/If-Modified-Since` `Etag/If-None-Match`

- Last-Modified/if-Modify-Since
  - 浏览器第一次发出请求一个资源的时候，服务器会返回一个 last-Modify 到 hearer 中. Last-Modify 含义是最后的修改时间。
  - 当浏览器再次请求的时候，request 的请求头会加上 if-Modify-Since，该值为缓存之前返回的 Last-Modify。
  - 服务器收到 if-Modify-Since 后，根据资源的最后修改时间(last-Modify)和该值(if-Modify-Since)进行比较，如果相等的话，则命中缓存，返回 304，否则, 如果 Last-Modify > if-Modify-Since, 则会给出 200 响应，并且更新 Last-Modify 为新的值。
- ETag/if-None-Match
  - ETag 则是对当前请求的资源做一个唯一的标识。该标识可以是一个字符串，文件的 size,hash 等。只要能够合理标识资源的唯一性并能验证是否修改过就可以了。有强和弱标识区分
    - 带有 w 开头(weak)的是弱校验，一般用文件大小、修改时间之类生成。
    - 没有 w 开头的是强校验，会比较文件的每一个字节是否相同。
  - 第一次请求资源时，浏览器会返回 ETag 请求头
  - 浏览器再次访问同一资源时，会带将之前 ETag 的内容通过 if-None-Match 请求头携带上来
  - 服务器接收后，以同样的算法计算出一个 ETag，与请求头 if-None-Match 的值比较文件是否新鲜。相同的话返回 304，如果不一致，说明修改过，因此返回 200。并且把新的 Etag 赋值给 if-None-Match 来更新该值。

总结：`Pragma`字段基本淘汰了。 `Expires`的定义会被`Cache-Control：max-age=[second]`覆盖。 定义协商缓存时，`Etag/If-None-Match` 优先级高于`Last-Modified/If-Modified-Since`。

- `Expires`和`Last-Modified/If-Modified-Since`是旧规则下的强缓存和协商缓存。
- `Cache-Control：max-age=[second]`和`Etag/If-None-Match`是新规则下的强缓存和协商缓存。

```javascript
//在原来直接返回文件这里换成response函数来设置和校验文件新鲜断
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
  // return this.respondFile(filePath, req, res)
  return this.response(filePath, statInfo, req, res)
}
```

然后增加以下函数

```javascript
  defaultOptions = {
    rootPath: process.cwd(),
    publicPath: "public",
    prefix: "public",
    maxAge: 5, // 5s 设置一个强缓存时长，秒
  }

response(pathname, statInfo, req, res) {
  this.setFreshHeader(statInfo, res)

  let freshResult = this.isFresh(req, res)
  if (freshResult) {
    return this.respondNotModified(res)
  } else {
    return this.respondFile(pathname, req, res)
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
```

## 内容编码

服务器在发送很大的文档之前，对其进行压缩，这样可以节省传输用时。主要是对资源 Gzip 编码。

1.  浏览器在访问网站时，默认会携带`Accept-Encoding`头，以表明浏览支持的编码算法，基本是 gzip 和 deflate。如：`Accept-Encoding:gzip, deflate`。
2.  服务器在收到请求后，如果发现存在`Accept-Encoding`请求头，并且支持该文件类型的压缩，则针对响应的实体主体（并不压缩头部）启用压缩，并将使用压缩算法设置到`Content-Encoding`响应头。
3.  浏览器收到响应，如果发现有`Content-Encoding`首部，会自动按其值指定的格式解压报文显示。

对于图片这类已经经过高度压缩的文件，无需再额外压缩。所以通过定义一个匹配压缩文件的正则。

对于压缩算法，由内置的 zlib 模块提供，并且使用流的方式。

```javascript
import { createGzip, createDeflate, createBrotliCompress } from "node:zlib"

compressFileRE = /css|js|html/gi
gzipRE = /\bgzip\b/
deflateRE = /\bdeflate\b/

async respondFile(filePath, req, res) {
  try {
    /**
     * 根据node官网建议，这里使用 open 查验文件是否存在，如果不存在，在erorr.code === ENOENT
     * 如果使用 fs.exists fs.stat fs.access 这些都会存在竞态条件。而open时文件被占用，如果其它进程再访问该文件时会报错。
     */
    const fd = await fs.open(filePath)
    const readStream = fd.createReadStream()

    // 解析MIME
    const { mime, extname } = this.resolveExtname(filePath)
    res.setHeader("Content-Type", mime)

    // 压缩，判断请求头中是否有可接受的压缩算法 "Accept-Encoding": "gzip, deflate, br"
    const acceptEncoding = req.headers["accept-encoding"] || ""
    const compressMatched = this.compressFileRE.test(extname)

    if (compressMatched && this.gzipRE.test(acceptEncoding)) {
      res.writeHead(200, "Ok", {
        "Content-Encoding": "gzip",
      })
      readStream.pipe(createGzip()).pipe(res)
    } else if (compressMatched && this.deflateRE.test(acceptEncoding)) {
      res.writeHead(200, "Ok", {
        "Content-Encoding": "deflate",
      })
      readStream.pipe(createDeflate()).pipe(res)
    } else {
      res.writeHead(200, "Ok", {
        "Content-Encoding": "br",
      })
      readStream.pipe(createBrotliCompress()).pipe(res)
    }
  } catch (error) {
    return Promise.reject(error)
  }
}
```

## 范围请求：媒体断点

当你观看视频，或者听歌时，网络断掉了，用户需要继续听的时候，文件服务器不支持断点的话，则浏览器需要重新下载这个文件。

而 Range 支持的话，浏览器记录了之前已经读取的文件范围，网络恢复之后，则向服务器发送读取剩余 Range 的请求，服务端只需要发送客户端请求的那部分内容，而不用整个文件发送回客户端，以此节省网络带宽。

交互流程是：

1.  浏览器第一次请求资源文件时，服务端响应文件，并添加`Accept-Ranges`响应（值表示表示范围的单位，通常是“bytes”），相当于告诉浏览器，当前服务器接受范围请求。
2.  浏览器断点重新发送请求时，会自动附上`Ranges`头，告诉服务端当前请求资源的是一个范围
3.  服务端收到范围请求，读取`Ranges`分情况响应：
    - 范围有效，服务端返回`206 Partial Content`，发送指定范围内内容，并在`Content-Range`头中指定该范围`Content-Range: bytes (start)-(end)/(total)`
    - 范围无效，服务端返回`416 Requested Range Not Satisfiable`，并在`Content-Range`中指明可接受范围`Content-Range: bytes */(total)`
    - 请求中的`Ranges`头格式为（这里不考虑多范围请求了）：`Ranges: bytes=[start]-[end]`，其中 start 和 end 并不是必须同时具有：
      1.  如果 end 省略，服务器应返回从 start 位置开始之后的所有字节
      2.  如果 start 省略，end 值指的就是服务器该返回最后多少个字节
      3.  如果均未省略，则服务器返回 start 和 end 之间的字节

所以第一步，需要定义一个`Ranges`请求头解析的工具函数

```javascript
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
```

返回的资源范围也同样需要压缩，所以将压缩和范围处理抽离成独立函数，整理 responseFile 函数如下：

```javascript
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
```

## 安全：文件路径解析

如果有人用浏览器访问`http://localhost:8000/…/app.js`，浏览器会自动干掉那两个作为父路径的点的。浏览器会把这个路径组装成` http://localhost:8000/app.js` 的，这个文件在 assets 目录下不存在，返回 404 Not Found。

但是聪明一点人会通过 postman 这样的客户端或者用 `curl -i http://localhost:8000/../app.js` 来访问。安全问题就会出现。

暴力点的解决方案就是禁止父路径，替换掉所有的`/..`。

```javascript
let url = req.url.replace(/\/\.\./g, "") // 将 /../app.js => /app.js 有两个斜杠
```
