/*
 * @Date         : 2023-12-23 20:34:19 星期6
 * @Author       : xut
 * @Description  : multer 文件上传解析
 *                 1. 文件数据依调用方法不同，保存在 req.file 或 req.files 中
 *                 2. 除文件指定字段之外的key-value值，仍保存到 req.body 中。
 *                注意尽量避免将 multer 作为全局中间件使用，以避免恶意请求
 * 
 一、配置项 multer(options)
 {
  dest: 'uploads/', // 将上传的文件存储在哪里，如果省略，默认保存在内存中
  // 通过 multer.diskStorage({destination(req, file,cb){},filename(req,file,cb){}}) 或 multer.memoryStorage()
  // 为了避免命名冲突，Multer 默认会修改上传的文件名为随机字符串，并且是没有扩展名的。如果要自定义，需要在这里的 filename 函数中处理。
  storage: {},
  limits: {
    // limits 选项内部将传给内部用来实现数据解析的 busboy 依赖包
    fieldNameSize: '100b', // field 名字的最大长度
    fieldSize: '1MB', // field 值的最大长度
    fields:'', // 非文件字段的最大数量，默认无限
    fileSize: '', // 在 multipart 表单中，文件最大长度 (字节单位)，默认无限
    files: '', // 在 multipart 表单中，文件数量，默认无限
    parts: '', // 在 multipart 表单中，part 传输的最大数量(fields + files)
    headerPairs: 2000, // 在 multipart 表单中，键值对最大组数
  },
  fileFilter: (req, file, cb) => {}, // 文件过滤器，控制 cb 回调函数返回布尔值或错误，来控制哪些文件可以被接受
  preservePath: false, // 是否将 multipart 数据中文件名中的路径保留
}

二、文件对象属性 file
{
  fieldname: '', // 由客户端指定的含有文件 buffer 数据的 key
  originalname: '', // 用户计算机上的文件原始名称
  encoding: '', // 文件编码
  minetype: '', 文件 MIME 类型
  size: '', // 文件大小，单位字节
  destination: '', // 选择 DiskStorage 时文件保存的路径
  filename: '', // 已保存在 destination 中文件名称
  path: '', // 已上传文件的完整路径，即 destination + filename
  buffer: Buffer, // 文件数据
}

三、操作方法
multer.single(fieldname) 接受一个以 fieldname 命名的文件。这个文件的信息保存在 req.file。
multer.array(fieldname[, maxCount]) 配合前端文件表单项 multiple=true 多文件上传，接受一个以 fieldname 命名的文件数组。可以配置 maxCount 来限制上传的最大数量。这些文件的信息保存在 req.files。
multer.fields(fields) 接受指定 fields 的混合文件。这些文件的信息保存在 req.files。fields 应该是一个对象数组，应该具有 name 和可选的 maxCount 属性。
multer.none() 只接受文本域。如果任何文件上传到这个模式，将发生 "LIMIT_UNEXPECTED_FILE" 错误。这和 upload.fields([]) 的效果一样。
multer.any() 接受一切上传的文件。文件数组将保存在 req.files。避免使用以避免恶意请求
 */
import express from "express"
import multer from "multer"
import path from "node:path"

const UPLOAD_DIR = path.join(process.cwd(), "/02-request/uploads/")

// 测试 filename 缺省配置时，保存的文件名是什么样的
const randomFilenameUpload = multer({
  dest: UPLOAD_DIR,
}).single("image") // 此时客户端上传时文件数据指定到 image
// 正常用法，保存在硬盘，自定义保存的文件名称，带文件后缀

const storage = multer.diskStorage({
  // destination 可以是直接字符串，或在函数 cb 中返回保存的路径
  destination: UPLOAD_DIR,
  // destination(req, file, cb) {
  //   cb(null, UPLOAD_DIR)
  // },
  filename(req, file, cb) {
    const extname = path.extname(file.originalname)
    const filename = file.originalname.replace(extname, "")
    const savedFilename = `${filename}_${Date.now()}${extname}`
    cb(null, savedFilename)
  },
})
const normalMulter = multer({
  storage,
})

const ALLOW_FILE_MIME = ["jpg"]
const MAX_FILE_SIZE = 100 * 1024 // 100kb
const filterUpload = multer({
  storage,
  fileFilter(req, file, cb) {
    const { size, originalname } = file
    const extname = path.extname(originalname).slice(1) // .jpg 去掉 .

    if (!ALLOW_FILE_MIME.includes(extname)) {
      cb(
        new Error(
          `Expected file type is ${ALLOW_FILE_MIME.join(
            ","
          )}, got is ${extname}}`
        )
      )
    }

    if (size > MAX_FILE_SIZE) {
      cb(
        new Error(
          `Expected file max size is ${MAX_FILE_SIZE}, got size is ${size}`
        )
      )
    }

    cb(null, true)
  },
})

const app = express()

app.post("/file/default", randomFilenameUpload, (req, res) => {
  // 如果 multipart/form-data 除了指定文件保存的 image 字段外，还附加了其它 key-value，则仍解析保存到 req.body 中
  //  --header 'Content-Type: multipart/form-data; boundary=-----304142515181346200716960' \
  // --form 'author="Lisa Wilson"' \
  // --form 'image=@"C:\\Users\\03975\\Pictures\\Saved Pictures\\kebe24.jpg"'

  const body = req.body // {author: "Lisa Wilson"}
  const { buffer, ...rest } = req.file
  res.json({
    body,
    file: rest,
  })
})

app.post("/file/single", normalMulter.single("file"), (req, res) => {
  const { buffer, ...rest } = req.file
  res.json({
    body: req.body,
    file: rest,
  })
})

app.post("/file/multi", normalMulter.array("upload", 2), (req, res) => {
  const files = req.files
  res.json(files.map((i) => i.filename))
})

app.post(
  "/file/fields",
  normalMulter.fields([
    { name: "image", maxCount: 1 },
    { name: "photos", maxCount: 2 },
  ]),
  (req, res) => {
    // 注意此时 files 的结构为对象，不再是数组了
    const files = [].concat(req.files.image, req.files.photos)

    res.json(
      files.map((i) => ({
        field: i.fieldname,
        filename: i.filename,
        body: req.body,
      }))
    )
  }
)

app.post("/file/verify", filterUpload.single("file"), (req, res) => {
  res.json({
    body: req.body,
    file: req.file,
  })
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
