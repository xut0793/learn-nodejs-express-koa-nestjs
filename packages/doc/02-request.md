# 解析请求参数

## HTTP 请求的基本组成

一个HTTP请求报文由请求行（request line） 、请求头部（header）、空行和请求数据4个部分组成。

```
POST /user HTTP/1.1                       // 请求行
Host: www.user.com
Content-Type: application/x-www-form-urlencoded
Connection: Keep-Alive
User-agent: Mozilla/5.0.
Authorization: bearer ZjA5NzAwNDQzY...     // 以上是请求头
（此处必须有一空行分隔）                       // 空行分割header和请求内容
id=123&author=lisi                        // 请求体(可选，如get/head/delete等请求没有)
```

从请求报文中可获取的常见数据包括：

```
- method
- url
- headers
- body
```

## 请求 url 的组成

URL 字符串是结构化的字符串，包含多个含义不同的组成部分。 解析字符串后返回的 URL 对象，每个属性对应字符串的各个组成部分。

提供了两套 API 来处理 URL：一个是旧版本遗留的 API，一个是实现了 WHATWG 标准的新 API。采用最新的 API，增加了`origin`字段，并且对查询参数部分实现了 URLSearchParams 类。

```
┌─旧版本的url模块─────────────────────────────────────────────────────────────────────────────────┐
│                                              href                                              │
├──────────┬──┬─────────────────────┬────────────────────────┬───────────────────────────┬───────┤
│ protocol │  │        auth         │          host          │           path            │ hash  │
│          │  │                     ├─────────────────┬──────┼──────────┬────────────────┤       │
│          │  │                     │    hostname     │ port │ pathname │     search     │       │
│          │  │                     │                 │      │          ├─┬──────────────┤       │
│          │  │                     │                 │      │          │ │    query     │       │

"  https:   //    user   :   pass   @ sub.example.com : 8080   /p/a/t/h  ?  query=string   #hash "

│          │  │          │          │    hostname     │ port │          │                │       │
│          │  │          │          ├─────────────────┴──────┤          │                │       │
│ protocol │  │ username │ password │          host          │          │                │       │
├──────────┴──┼──────────┴──────────┼────────────────────────┤          │                │       │
│   origin    │                     │         origin         │ pathname │     search     │ hash  │
├─────────────┴─────────────────────┴────────────────────────┴──────────┴────────────────┴───────┤
│                                              href                                              │
└─新版本的 URL类实例，实现WHATWG标准───────────────────────────────────────────────────────────────┘
```

### URL

new URL()解析的必须是绝对 URL。

- 如果 input 是相对路径，则需要第二个参数 base。 如果 input 是绝对路径，则忽略 base。
- 如果 input 是相对路径，又没有提供 base，则视为无效 URL，则将会抛出 TypeError。

```js
const newURL = new URL(
  "https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash"
)
console.log(newURL)
console.log(newURL.searchParams.get("query"))
```

输出：

```js
// 输出
{
    href: 'https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash',
    origin: 'https://sub.host.com:8080',
    protocol: 'https:',
    username: 'user',
    password: 'pass',
    host: 'sub.host.com:8080',
    hostname: 'sub.host.com',
    port: '8080',
    pathname: '/p/a/t/h',
    search: '?query=string',
    searchParams: URLSearchParams { 'query' => 'string' },
    hash: '#hash'
}
```

### URLSearchParams

URLSearchParams API 提供对 URL 查询部分的读写访问。

```js
const newURL = new URL(
  "https://user:pass@sub.host.com:8080/p/a/t/h?user=tom&age=18"
)
let params = newURL.searchParams
console.log(params.toString()) // user=tom&age=18

console.log(params.get("user")) // tom
console.log(params.getAll("user")) // ['tom']

params.append("user", "jerry")
console.log(params.getAll("user")) // [ 'tom', 'jerry' ]
console.log(params.toString()) // user=tom&age=18&user=jerry

console.log(params.has("age")) // true
params.delete("age")
console.log(params.has("age")) // false
console.log(params.toString()) // user=tom&user=jerry

params.set("hobby", "coding")
params.set("hobby", "running") // 覆盖前一个coding
params.set("sex", "boy")
console.log(params.toString()) // user=tom&user=jerry&hobby=running&sex=boy

console.log(params.keys()) // URLSearchParams Iterator { 'user', 'user', 'hobby', 'sex' }
console.log(params.values()) // URLSearchParams Iterator { 'tom', 'jerry', 'running', 'boy' }
console.log(params.entries())
/**
URLSearchParams Iterator {
  [ 'user', 'tom' ],
  [ 'user', 'jerry' ],
  [ 'hobby', 'running' ],
  [ 'sex', 'boy' ]
}
 */
console.log(params.sort()) // 按key的字母顺序排序，保留同名的k-v之间顺序

params.forEach((v, k) => {
  console.log(`value is ${v}, key is ${k}`)
})
```

## 请求参数获取

HTTP 请求中，有几类参数需要获取，以便在业务逻辑中使用。

- 查询参数（query 参数），如 `/blog/list?id='123'&author='lisi'` 中的 id 和 author 参数。
- 路径参数（path 参数），如 `/blog/detail/:id` 中的 id
- 请求体（body 参数），根据请求体的数据类型，常见的有以下子类型：
  - `"Content-Type": "application/x-www-form-urlencoded"`
  - `"Content-Type": "multipart/form-data"`
  - `"Content-Type": "application/json"`
- 请求头（headers），常见的请求头：
  - cookie
  - authorization

## node

## express

- 请求参数，`req.method / req.protocol / req.hostname / req.originalUrl / req.url / req.path`
- 查询参数，如 `/blog/list?id='sfd'&author='lisa'`，通过 `req.query.id`获取，在 express 内部通过 qs 依赖包已实现，直接使用
- 路径参数，如 `/blog/detail/:id`，通过 `req.params.id`，这个在 express 内部通过 path-to-regexp 依赖包已实现，直接使用
- 请求体，根据请求体的类型，需要配置对应的中间件，通过 `req.body` 获取对象值：
  - `"Content-Type": "application/x-www-form-urlencoded"`时，配置内置中间件 `express.urlencoded(options)`
  - `"Content-Type": "multipart/form-data"`时，可以使用外部中间件，比如 `multer`解析，如果采用 multer.single 解析，则通过 `res.file` 获取，如果采用 multer.array 或 multer.fields 解析，则通过 res.files 获取。
  - `"Content-Type": "application/json"`时，配置内置的中间件 `express.json(options)`
  - 获取请求体原始 buffer 字段流，配置内置中间件 `express.raw(options)`
- 请求头 `req.headers`
  - cookie，需要使用 `cookie-parser` 依赖包解析，然后通过 `req.cookies` 获取对象，如果 cookie 已签名，则通过 `req.signedCookies` 获取。如果设置，则调用内置的 1res.cookies(key,name,options) 方法。
  - `req.headers.authorization`，或者 `req.get('authorization')`
    实际上，express.json/urlencoded/raw 的解析中间件，内部都依赖于 `body-parser` 这个中间件。其中的 options 针对不同方法，可设置不同的参数。

### 代码示例

[express 请求参数]('../express/02-request/index.js')
[express 文件上传]('../express/02-request/file.js')
[express cookie]('../express/02-request/cookie.js')

## koa

koa 是一个比 express 更简洁的框架，并且将 request 和 response 对象合并为一个上下文对象 context 。所以大部分功能都需要通过安装第三依赖包来获取。

- 请求参数 `ctx.method / ctx.protocol / ctx.originalUrl / ctx.url / ctx.path`
- 查询参数 query，这个可以直接通过 `ctx.query / ctx.req.query` 获取，因为 koa 内部通过 qs 依赖包完成了解析。
- 路径参数 params，动态路由需要安装 `@koa/router` 配置路由，然后通过 `ctx.params` 获取。
- 请求体 body，需要安装 `koa-body` 依赖包进行解析，然后通过 `ctx.req.body` 获取，这个中间件会自动处理不同的 Content-Type 情况(`x-www-form-urlencoded / multipart/form-data / application/json`)，比较特殊的是，如果有上传文件的话 `multipart/form-data`，通过 `ctx.req.files` 获取，koa-body 内部依赖于 formidable 来解析 form-data 数据。
- 请求头 `ctx.headers`
  - cookie，通过 `ctx.cookies` 直接读写对象，内部通过 `cookies` 依赖包解析实现。
  - `ctx.headers.authorization`，或者 `ctx.get('authorization')`

在 koa 中进行文件上传，可以使用 koa-body 包开启功能，也可以添加 @koa/multer 包利用中间件注入，使用方式和 express 中集成 multer 一样。

### 代码示例

[koa 请求参数]('../koa/02-request/index.js')
[koa 文件上传]('../koa/02-request/file.js')
[koa cookie]('../koa/02-request/cookie.js')

## nestjs

## 中间件配置

### express.json(options)

```js
// express.json(options) / body-parser.json(options)
{
  "inflate": true, // 默认 true，是否开启压缩体解析
  "limit": "100kb", // 默认 100kb，最大请求数据，传入数字默认单位是bytes，传入字符串要带上单位
  "reviver": (key, value)=> {...}, // reviver就相当于在JSON.parse()方法传入了第二个参数reviver做数据的预处理。
  "strict": true, // 默认 true，开启严格模式只能接收能被JSON.parse()方法解析的数据
  "type": "application/json", // 接收数据的类型，默认是"application/json"
  "verify": (req, res, buf, encoding) => {...} // 验证数据，如果无效就可以提前抛出错误信息
}
```

## express.urlencoded(options)

```js
// express.urlencoded(options) / body-parser.urlencoded(options)
{
  "extended": false, // 指将（URL编码字符串形式的）表单数据解析为简单对象还是深度嵌套对象
  "inflate": true, // 默认 true，是否开启压缩体解析
  "limit": "100kb", // 默认 100kb，最大请求数据，传入数字默认单位是bytes，传入字符串要带上单位
  "parameterLimit": 1000, // 默认 1000，控制url编码数据中最大参数数量，超过这个数量返回413
  "type": "application/x-www-form-urlencoded", // 接收数据的类型，默认是"application/x-www-form-urlencoded"
  "verify": (req, res, buf, encoding) => {...} // // 验证数据，如果无效就可以提前抛出错误信息
}


```

关于extended参数，是指将（URL编码字符串形式的）表单数据解析为**简单对象**还是**深度嵌套对象**。设置 true / false 区别：

假设表单里有嵌套对象和数组值的传输

```sh
x=1&x=2&user[uname]=evanp&user[passwd]=iloveu
```

当 extended 设为 false 时（默认值），源码实现上使用 querystring 库，解析得到的 req.body 数据结构如下：

```js
{
  "user[uname]": "evanp",
  "user[passwd]": "iloveu",
  "x": [
    "1",
    "2"
  ]
}
```

当 extended 设为 true 时，源码实现上使用 qs 库，解析得到嵌套的 json 对象。推荐设置为 true

> express 在内部解析 query 时使用的也是 qs 库。

```js
{
  "user": {
    "uname": "evanp",
    "passwd": "iloveu"
  },
  "x": [
    "1",
    "2"
  ]
}
```

## express.raw(options)

```js
// express.raw(options) / body-parser.raw(options)
{
  inflate: true,
  limit: '100kb',
  type: 'application/octet-stream',
  verify: (req, res, buf, encoding) => {},

}
```

## multer(options)

```js
// multer(options) 文件上传 https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md
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

// multer 上传处理的 file 对象
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
```

## koa-body(options)

```js
// 默认配置
{
  patchNode: false, // 是否将解析出的 body 数据对象附加到 ctx.req 上。
  patchKoa: true, // 是否将解析出的 body 数据对象附加到 ctx.request 上。
  jsonLimit: '1mb', // json 对象字节数大小的限制
  formLimit: '56kb', // form body 字节数的限制
  textLimit: '56kb', // text body 字节数的限制
  encoding: "uft-8",
  multipart: false, // 是否解析 multipart/form-data 文件上传的数据
  urlencoded: true, // 解析 x-www-form-urlencoded 表单数据
  text: true, // 解析 text body,如 xml 等
  json: true, // 解析 json body
  jsonStrict: true, // 切换json严格模式;如果设置为true 只解析数组或对象
  includeUnparsed: false, // 如果设置 true，将原始的 encoded / json 请求体通过 Symbol 附加到 ctx.request.body
  formidable: {}, // 对象 multipart/form-data 数据解析依赖 formidable 包的选项对象
  onError: function, // 解析失败的回调函数
  parsedMethods: ['POST', 'PUT', 'PATCH'], // 需要对正文进行解析的HTTP方法，常规上，不会对 GET/HEAD/DELETE方法上挂载 body.
}
```

## formidable(options)

```js
// formidable options
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

// formidable 返回的 file 对象
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
```
