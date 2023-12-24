/*
 * @Date         : 2023-12-23 20:35:39 星期6
 * @Author       : xut
 * @Description  : koa 集成文件上传，有两种选择： 集成的 koa-body 和独立使用 @koa-multer，使用参照 express
 *
 * 1. koa-body 开启文件上传 multipart: true
 * 接收到文件数据 ctx.request.files，是一个对象，其中 key 是客户端指定的存放文件数据的key。
 * 如果一个key是一个文件，是 value 是 file 对象，如果一个key对应多个文件，value 是file数组。
 * 注意这一点，不同于 multer 默认是数组形式。
 *
 * 另外，除文件字段外，其它附加字段放在同 body 一样，ctx.request.body
 *
 * formidable 配置 options
 * 
 {
  encoding: 'uft-8',
  uploadDir: '', // 上传文件保存的目录，默认存储在系统默认的临时文件夹 os.tmpDir()
  keepExtensions: false, // 文件保存到指定目录时，是否包括原始文件扩展名
  allowEmptyFiles: false, // 是否允许空文件上传
  minFileSize: 1, // 上传文件最小大小，单位字节
  maxFileSize: 200 * 1024*1024 // 上传文件最大 200MB
  maxTotalFileSize: '', // 批量上传时限制文件总大小
  maxFiles: 'Infinity', // 批量上传时限制文件数量
  maxFields: 1000, // 限制除文件上传字段外，附加字段数量
  maxFieldsSize: 2*1024*1024, // 2mb，限制所有字段一起的字节数大小，即分配内存的容量
  hashAlgorithm: false, // 如果你想为传入文件计算校验和，设置为'sha1'或'md5'
  fileWriteStreamHandler: null, // 自定义文件写入行为，比如写到云存储空间等，一旦定义此函数，不会再写到本地
  filename: undefined, // 自主控制保存的文件名 (name, ext, part, form) => string，其中 part = {originalFilename, mimetype}
  filter: undefined, // 过滤文件函数，返回布尔值 ({name, originalFilename, mimetype}) => boolean
}
 * 
 *  其中返回的 file 属性
 {
  originalFilename,
  newFilename,
  size,
  filePath,
  mimetype,
  mtime,
  hash,
  hashAlgorithm
}
 */
import path from "node:path"
import Koa from "koa"
import { koaBody } from "koa-body"
import Router from "@koa/router"

const app = new Koa()
const router = new Router()

const UPLOAD_DIR = path.join(process.cwd(), "/02-request/uploads/")

// 此时保存的文件名是随机字符串
const defaultUpload = koaBody({
  multipart: true,
  formidable: {
    uploadDir: UPLOAD_DIR,
  },
})

const singleUpload = koaBody({
  multipart: true,
  formidable: {
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    maxFiles: 1,
  },
})

const multiUpload = koaBody({
  multipart: true,
  formidable: {
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    filename: (name, ext, part, formy) => {
      // name: kobe24, ext: .jpg, part: 就是 multipart/form-data 数据部分，是一个 Stream 。 formy 是包的实例信息，有事件和方法等，必要时可用。
      return `${name}_${Date.now()}${ext}`
    },
  },
})

const ALLOW_FILE_MIME = ["image/jpeg"]
const MAX_FILE_SIZE = 100 * 1024 // 100kb
const verifyUpload = koaBody({
  multipart: true,
  formidable: {
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    filename: (name, ext) => {
      return `${name}_${Date.now()}${ext}`
    },
    filter: (part) => {
      // part 是一个 Stream，可以读出 originalFilename mimetype
      const name = part.name // 上传时文件绑定的 key 值，如 image
      const mimetype = part.mimetype
      const size = part.size
      console.log("🚀 ~ file: file.js:70 ~ size:", size)

      if (name !== "image") {
        throw new Error(`预期上传文件的字段是 image，实际是 ${name}`)
      }

      if (!ALLOW_FILE_MIME.includes(mimetype)) {
        throw new Error(
          `Expected file type is ${ALLOW_FILE_MIME.join(
            ","
          )}, got is ${mimetype}}`
        )
      }

      if (size > 100 * 1024) {
        ;`Expected file max size is ${MAX_FILE_SIZE}, got size is ${size}`
      }

      return true
    },
  },
})

router.post("/file/default", defaultUpload, async (ctx) => {
  const file = ctx.request.files.file
  ctx.body = {
    // body 放着除文件字段外的其它字段
    body: ctx.request.body,
    file: {
      originalFilename: file.originalFilename,
      newFilename: file.newFilename,
      size: file.size,
      mimetype: file.mimetype,
    },
  }
})

/**
 * 这里限制了maxFiles: 1, 如果同时上传多个文件，文件正常被保留到本地，但返回的文件信息是空对象，且没有报错
 * 所以注意一点，文件校验报错需要自行处理。
 */
router.post("/file/single", singleUpload, (ctx) => {
  const file = ctx.request.files.image // 客户端定义 image 字段接收文件数据
  ctx.body = {
    body: ctx.request.body,
    file: {
      originalFilename: file.originalFilename,
      newFilename: file.newFilename,
      size: file.size,
      mimetype: file.mimetype,
    },
  }
})

router.post("/file/multi", multiUpload, (ctx) => {
  // 这里定义了多个文件字段，默认 image 是单个文件， photos 是多个文件，类似 multer.fields 方法。
  const files = [].concat(ctx.request.files.image, ctx.request.files.photos)
  const fileInfoList = files.map((file) => ({
    originalFilename: file.originalFilename,
    newFilename: file.newFilename,
    size: file.size,
    mimetype: file.mimetype,
  }))

  ctx.body = {
    body: ctx.request.body,
    file: fileInfoList,
  }
})

router.post("/file/verify", verifyUpload, (ctx) => {
  const file = ctx.request.files.image // 客户端定义 image 字段接收文件数据
  ctx.body = {
    body: ctx.request.body,
    file: {
      originalFilename: file.originalFilename,
      newFilename: file.newFilename,
      size: file.size,
      mimetype: file.mimetype,
    },
  }
})

app
  .use(
    koaBody({
      multipart: false,
    })
  )
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
