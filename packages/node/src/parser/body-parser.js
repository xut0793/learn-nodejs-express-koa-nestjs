/**
 * 请体体数据解析，常用的依赖库 body-parser
 *
 * 一、body-parser 作用
 * 1. 处理不同类型的请求体，对应的报文主体的格式不同，处理方式也不同。
 * 2. 处理不同的编码：比如 utf8、gbk 等。
 * 3. 处理不同的压缩类型：比如 gzip、deflate、br、identity 等。
 * 4. 其他边界、异常的处理。
 *
 * 二、处理不同类型的请求体
 * HTTP 常见的请求体类型：
 *  1. "Content-Type": "text/plain"
 *  2. "Content-Type": "application/x-www-form-urlencoded"
 *  3. "Content-Type": "multipart/form-data"
 *  4. "Content-Type": "application/json"
 *  5. "Content-Type": "application/octet-stream"
 *
 * 针对不同的请求体类型，有不同的处理方式。最终的结果会放置到 req.body 对象上，如果表单上传 multipart/form-data 时，文件数据会放在 req.file / req.files 上。
 *
 * 三、处理不同的编码
 * 1. 根据客户端请求头，拿到内容编码方式，一般是在Content-Type最后加上 ;charset=gbk，默认 uft8
 *
 * 四、处理不同的压缩类型
 * 1. 根据客户端请求头，拿到内容的压缩类型，一般是在 Content-Encoding 上，常见为 gzip deflate
 * 2. 使用内置的 zlib 模块进行解压
 *
 * 五、其他边界，比如限制请求体的大小，json 序列化是否启用严格模式等。
 *
 */
import { STATUS_CODES } from "node:http"
import qs from "node:querystring"
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib"
import { resolve } from "node:path"
import { createWriteStream } from "node:fs"
import { PassThrough } from "node:stream"

class BodyParser {
  options = {
    type: null,
    charset: "utf8",
    encoding: "identity",
    boundary: null,
    limit: 1 * 1024 * 1024, // 1Mb
    strict: true,
    length: null,
    destination: resolve(process.cwd(), "./02-request/uploads"),
  }

  _typeEnum = {
    text: "text/plain",
    urlencoded: "application/x-www-form-urlencoded",
    json: "application/json",
    raw: "application/octet-stream",
    file: "multipart/form-data",
  }

  _res = null
  _next = null
  _done = null

  constructor() {}

  /**
   * 解析 Content-Type: text/plain
   *
   * @param {object} options
   * @param {number} options.limit 限制大小
   * @returns
   */
  text(options) {
    return function textParser(req, res, next) {
      const errCode = this._resolve(options, req, res, next)

      if (errCode) {
        return this._resError(errCode)
      }

      if (this.options.type !== this._typeEnum.text) {
        return this._resError(415)
      }

      this._done = (buffer) => {
        const text = buffer.toString(this._charset)
        req.body = text
        return next()
      }

      return this._parse(req)
    }.bind(this)
  }

  /**
   * 解析 Content-Type: x-www-form-urlencoded
   *
   * @param {object} options
   * @param {number} options.limit 限制大小
   * @returns
   */
  urlencoded(options) {
    return function urlencodedParser(req, res, next) {
      const errCode = this._resolve(options, req, res, next)

      if (errCode) {
        return this._resError(errCode)
      }

      if (this.options.type !== this._typeEnum.urlencoded) {
        return this._resError(415)
      }

      this._done = (buffer) => {
        try {
          const decodedObj = qs.parse(buffer.toString(this._charset))
          req.body = decodedObj
          return next()
        } catch (error) {
          return this._resError(415)
        }
      }

      return this._parse(req)
    }.bind(this)
  }

  /**
   * 解析 Content-Type: application/json
   *
   * @param {object} options
   * @param {number} options.limit 限制大小
   * @param {boolean} options.strict 是否执行严格解析
   * @returns
   */
  json(options) {
    return function jsonParser(req, res, next) {
      const errCode = this._resolve(options, req, res, next)

      if (errCode) {
        return this._resError(errCode)
      }

      if (this.options.type !== this._typeEnum.json) {
        return this._resError(415)
      }

      this._done = (buffer) => {
        try {
          const str = buffer.toString(this.options.charset)

          if (this.options.strict) {
            const strictJsonRegexp = /^[\x20\x09\x0a\x0d]*(\[|\{)/
            if (!str) {
              req.body = {}
            } else if (!strictJsonRegexp.test(str)) {
              this._resError(
                400,
                "invalid JSON, only supports object and array"
              )
            } else {
              const json = JSON.parse(str)
              req.body = json
            }
          } else {
            req.body = str ? JSON.parse(str) : str
          }
          return next()
        } catch (error) {
          return this._resError(415)
        }
      }

      return this._parse(req)
    }.bind(this)
  }

  /**
   * 解析 Content-type: application/octet-stream
   *
   * @param {object} options
   * @param {number} options.limit 限制大小
   * @returns
   */
  raw(options) {
    return function rawParser(req, res, next) {
      const errCode = this._resolve(options, req, res, next)

      if (errCode) {
        return this._resError(errCode)
      }

      this._done = (buffer) => {
        req.body = buffer
        return next()
      }

      return this._parse(req)
    }.bind(this)
  }

  /**
   * Content-Type: multipart/form-data
   *
   * @param {object} options
   * @param {string} options.field
   * @param {number} options.maxCount
   * @param {array} options.fields // [{field, maxCount}, ...]
   * @returns
   */
  file(options) {
    return function formDataParser(req, res, next) {
      const errCode = this._resolve(options, req, res, next)

      if (errCode) {
        return this._resError(errCode)
      }

      if (this.options.type !== this._typeEnum.file) {
        return this._resError(415)
      }

      this._done = (buffer) => {
        const fileResult = this._fileParser(
          buffer,
          this.options.boundary,
          options
        )

        if (!fileResult) return

        const [params, file, isMulti] = fileResult
        req.body = params

        if (isMulti) {
          req.files = file
        } else {
          req.file = file
        }

        return next()
      }

      return this._parse(req)
    }.bind(this)
  }

  /**
   * 解析数据类型、编码、压缩方式
   *
   * @param {object} options
   * @param {number} options.limit 限制大小
   * @param {boolean} options.strict 是否执行严格解析
   * @param {request} req
   * @param {response} res
   * @param {next} next
   * @returns
   */
  _resolve(options, req, res, next) {
    this._res = res
    this._next = next

    // Content-Type: application/json
    // Content-Type: application/json; charset=utf8
    // Content-Type: multipart/form-data; boundary=ZnGpDtePMx0KrHh_G0X99Yef9r8JZs
    const contentType = req.headers["content-type"] ?? 'text/plain' // text/plain 或者 text/plain; charset=utf8
    const [type, rest] = contentType.split(";")
    this.options.type = type
    this.options.charset = rest
      ? rest.match(/charset=\s*([^"])/i)?.[1] ?? "utf8"
      : "utf8"
    this.options.boundary = rest && rest.match(/boundary=([^"]+)$/)?.[1]

    // content-encoding: gzip, deflate, br
    this.options.encoding = req.headers["content-encoding"]

    // content-length
    let length = req.headers["content-length"]
    length = parseInt(length, 10)
    length = Number.isNaN(length) ? null : length
    this.options.length = length

    // merge options
    if (options?.limit && typeof options.limit === "number") {
      this.options.limit = options.limit
    }

    if (this.options.length > this.options.limit) {
      return 415 // request entity too large
    }

    if (options?.strict && typeof options.strict === "boolean") {
      this.options.strict = options.strict
    }

    if (options?.destination && typeof options.destination === "string") {
      this.options.destination = options.destination
    }
  }

  /**
   * 错误响应
   *
   * @param {number} code 响应错误码
   * @param {string} message 消息，可选
   * @return
   */
  _resError(code, message) {
    message = message ?? STATUS_CODES[code]
    // this._res.writeHead(code, STATUS_CODES[code])
    // this._res.end(message)

    // 另一种处理方式
    const err = new Error(message)
    this._next(err)
  }

  /**
   * 请求体解析
   *
   * @param {request} req
   */
  _parse(req) {
    let buffers = []
    let received = 0
    let stream
    const encoding = this.options.encoding
    // 处理不同的压缩类型，HTTP 常见的就这两种 gzip delate br
    if (/\bbr\b/.test(encoding)) {
      stream = createBrotliDecompress()
      req.pipe(stream)
    } else if (/\bgzip\b/.test(encoding)) {
      stream = createGunzip()
      req.pipe(stream)
    } else if (/\bdeflate\b/.test(encoding)) {
      stream = createInflate()
      req.pipe(stream)
    } else {
      // TODO: 有隐患吗？
      stream = req
    }

    /**
     *  请求对象 data 事件监听回调
     *
     * @param {buffer} buff
     */
    const onData = (buff) => {
      buffers.push(buff)
      received += buff.length

      if (this.options.limit !== null && received > this.options.limit) {
        const err = new Error(STATUS_CODES[413])
        err.code = 413
        callback(err)
      }
    }

    /**
     * 请求对象 end 事件监听回调
     */
    const onEnd = () => {
      if (this.options.length !== null && received > this.options.length) {
        const err = new Error("request size did not match content length")
        err.code = 400
        callback(err)
      } else {
        const buff = Buffer.concat(buffers)
        callback(null, buff)
      }
    }

    /**
     * 请求监听事件处理回调
     *
     * @param {error} err
     * @param {buffer} body
     */
    const callback = (err, body) => {
      if (err) {
        this._resError(err?.code ?? 500, err.message)
      } else {
        this._done(body)
      }
      cleanup()
    }

    /**
     * 事件监听清理回调
     */
    const cleanup = () => {
      this._done = null
      this._res = null
      this._next = null

      stream.removeListener("data", onData)
      stream.removeListener("end", onData)
      stream.removeListener("error", onData)
      stream.removeListener("error", callback)
      stream.removeListener("close", onData)
      // TODO: 这里重置 null，回收后，会导致 removeListener 读取报错 null，是不是因为 req 被重置了？？怎样在上边能重新创建一个可读流
      // stream = null
    }

    stream.on("data", onData)
    stream.once("end", onEnd)
    stream.once("error", callback)
    stream.once("error", cleanup)
    stream.once("close", cleanup)
  }

  /**
   * Content-Type: multipart/form-data
   * 
   * multipart/form-data 是专门用于传输大型二进制数据或者包含非ASCII字符的数据格式
   * [multipart/form-data定义源头](https://juejin.cn/post/6844903810079391757)
   * [解析 form-data 数据，实现 formidable 函数的功能](https://www.cnblogs.com/arduka/p/13128809.html)
   * 
   * 一、前端上传方式
   * 只能使用 Post 方式上传，前端有两种方式构建 form-data 数据
   * 1. html form 表单结合 file input，并且设置 method=post enctype=multipart/form-data
   * 2. new FormData 配合 ajax
   * 
   * 二、form-data 格式，基本语法结构可以在 RFC2046 中找到。
   * 1. 多个字段实体内容使用 boundary 封装线分割成多个部分 part，由两个--开关：--boundary，通常由浏览器自动生成，也可以在 Content-Type 中指定。
   * 2. 最后一个 part 之后的边界在末尾多了两个 -，表示后面不会再有其它的 part 了，形式为 --boundary--
   * 3. 每一个 part 上方是换行符分隔。
   * 4. 每一个部分都包含一个 Content-Disposition 头，其值为form-data,以及一个name属性，其值为表单的字段名，part 内容部分即为字段值。如果是文件数据部分，还会有一个 filename=“xxx" 指明文件名称。
   * 5. 如果有其它请求头，则换行显示，比如 Content-Type非必须属性，其值会根据文件类型进行变化，默认值是text/plain，还有一个非必须属性 Content-Length 显示文件数据长度
   * 6. 如果 Part 的内容跟默认的 encoding 方式不同，那么会有一个 "content-transfer-encoding" 头信息来指定。
   * 
   * 例子：
    POST /profile HTTP/1.1
    HOST: example.com
    Content-Type: multipart/form-data; boundary=ZnGpDtePMx0KrHh_G0X99Yef9r8JZs

    --ZnGpDtePMx0KrHh_G0X99Yef9r8JZs
    Content-Disposition: form-data; name="username"
    Content-Type: text/plain

    Nicholas
    --ZnGpDtePMx0KrHh_G0X99Yef9r8JZs
    Content-Disposition: form-data; name="address"
    Content-Type: application/json

    {
        "country": "China",
        "city": "Beijing"
    }
    --ZnGpDtePMx0KrHh_G0X99Yef9r8JZsRJSXC
    Content-Disposition: form-data;name="desc"
    Content-Type: text/plain; charset=UTF-8
    Content-Transfer-Encoding: 8bit
    
    ...
    --ZnGpDtePMx0KrHh_G0X99Yef9r8JZs
    Content-Disposition: form-data; name="avatar"; filename="my_avatar.jpeg"
    Content-Type: image/jpeg

    <binary-image data>
    --ZnGpDtePMx0KrHh_G0X99Yef9r8JZs--
   */
  _fileParser(buffer, boundary, options) {
    // 解析 options {field, maxCount, fields}，field 优于 fields [{name, maxCount}]
    const fields = {} // {field: maxCount}
    let multiple = options?.multiple ?? false

    if (Array.isArray(options?.fields) && options.fields.length) {
      options.fields.forEach((item) => {
        const maxCount = parseInt(item.maxCount ?? options.maxCount, 10)
        fields[item.name] = Number.isNaN(maxCount) ? "infinite" : maxCount
      })
      multiple = true
    } else if (options?.field) {
      const maxCount = parseInt(options.maxCount, 10)
      fields[options.field] = Number.isNaN(maxCount) ? "infinite" : maxCount
    } else {
      const maxCount = parseInt(options.maxCount, 10)
      fields["file"] = Number.isNaN(maxCount) ? "infinite" : maxCount
    }

    const fieldKeys = Object.keys(fields)

    //将Buffer类型的数据转化成binary编码格式的字符串
    let formStr = buffer.toString("binary")
    let formArr = formStr.split(`--${boundary}`)

    // 去掉首尾的无用项
    formArr.shift()
    formArr.pop()

    // 存储除文件字段外外，其它表单字段
    let params = {}
    // 存储文件信息
    let file = {}

    for (let part of formArr) {
      /**
       * part 此时的结构如下，头字段与内容用换行分隔
       * Content-Disposition: form-data; name="avatar"; filename="my_avatar.jpeg"
       * Content-Type: image/jpeg\r\n
       * \r\n
       * <binary-image data>
       */
      // 去掉首尾的换行符
      part = part.trim()
      // 存储 part 中的实际内容
      let value = ""

      // 不同操作系统换行符不同,用变量 start 声明特殊分割点位的下标
      // Windows 和 Dos系统： 使用回车（CR）和换行（LF）两个字符来结束一行，回车+换行(CR+LF)，即“\r\n”；所以我们平时编写文件的回车符应该确切来说叫做回车换行符。
      // Mac 和 Linux系统：只使用换行（LF）一个字符来结束一行，即“\n”；现代的版本控制系统（如：git）中也使用LF表示换行。

      let start
      if ((start = part.indexOf("\r\n\r\n")) != -1) {
        value = part.slice(start + 4)
      } else if ((start = part.indexOf("\r\r")) != -1) {
        value = part.slice(start + 2)
      } else if ((start = part.indexOf("\n\n")) != -1) {
        value = part.slice(start + 2)
      }

      const header = part.slice(0, start)
      let key = header.match(/name="([^"]+)"/)[1]
      let filename_b = header.match(/filename="([^"]+)"/)?.[1]
      let charset = header.match(/charset=([^"]+)/)?.[1] ?? "utf8"

      // 暂不实现
      let encoding = header.match(/content-transfer-encoding:\s*([^:]+)/i)?.[1]
      // Content-Type: application/json
      // Content-Type: text/plain; charset=UTF-8
      let typeMatched = header.match(
        /(content-type:\s*([^:]+)$)|(content-type:\s*([^;]+);)/i
      )
      let contentType = typeMatched?.[2] || typeMatched?.[4]

      if (filename_b) {
        if (!fieldKeys.includes(key)) {
          this._resError(400, `文件的表单项名称未声明 ${key}`)
          return
        }
        // 文件 part
        // 将二进制字符串转化 utf8 格式字符串

        const filename = Buffer.from(filename_b, "binary").toString("utf8")
        const savedFilename = `${Date.now()}_${filename}`
        const savedPath = resolve(this.options.destination, savedFilename)
        const writeStream = createWriteStream(savedPath)
        const rawBinaryBuffer = Buffer.from(value, "binary") // 还原成原始二进制数据
        const bufferStream = new PassThrough()
        const readStream = bufferStream.end(rawBinaryBuffer)
        readStream.pipe(writeStream)

        const info = {
          fieldname: key,
          filename: savedFilename,
          originalname: filename,
          destination: this.options.destination,
          path: savedPath,
          encoding,
          minetype: contentType,
          // buffer: rawBinaryBuffer,
          size: rawBinaryBuffer.length,
        }

        if (key in file) {
          if (
            fields[key] !== "infinite" &&
            file[key].length + 1 > fields[key]
          ) {
            this._resError(
              400,
              `在字段 ${key} 上接收的文件数量超过声明的值 ${fields[key]}`
            )
            return
          }

          file[key] = [].concat(file[key], info)
        } else {
          file[key] = [info]
        }
      } else {
        // 将二进制字符串转化成 utf8 格式的字符串
        value = Buffer.from(value, "binary").toString(charset)
        if (contentType === "application/json") {
          try {
            value = JSON.parse(value)
          } catch {}
        }
        // 表单字段 part
        if (key in params) {
          // 类似复数框，同一字段多个值，则以数组形式保存 key = [value, value]
          params[key] = [].concat(params[key], value)
        } else {
          params[key] = value
        }
      }
    }

    /**
     * 单个 field 时，返回单个 file 对象
     * 单个 field 且多个文件时，返回文件数组 [file, ...]
     * 定义了 fields 时，返回键值对 {field: [file, ...], ...}
     */
    let returnFile = multiple
      ? options?.fields?.length
        ? file
        : file[fieldKeys[0]]
      : file[fieldKeys[0]][0]

    return [params, returnFile, multiple]
  }
}

export const bodyParser = new BodyParser()
