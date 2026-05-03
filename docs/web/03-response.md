# Response 响应

## HTTP 响应报文的基本组成

同请求报文一样，响应报文同样由响应行、响应头部、空行分隔和响应体数据组成。

```
 HTTP/1.1 200 OK
 Content-Length: 1024
 Content-Type: application/json

 {"code":200,"message":null,"data":"xxx"}
```

从响应报文中，需要设置的数据包括

- 响应状态码 statusCode
- 响应头 header
- 响应体 body
  - text/plain 或 text/html
  - application/json
  - stream

## node

Node 中对响应数据设置方法：

1. 状态码和消息 `res.statusCode / res.statusMessage`
2. 响应头 `res.setHeader / res.getHeaders / res.hasHeader / res.removeHeader / res.writeHead`
3. 响应体 `res.write / res.end`

### 响应状态码和响应消息

1. `res.statusCode` 单独使用，缺省 `res.statusMessage` 时，则默认使用状态码对应的标准消息。可以从`HTTP.STATUS_CODES`中映射得到。
2. `res.statusCode` 优先级低于 `res.writeHead(code, message, headers)`
3. `res.writeHead(code, message, headers)` 虽然是最终生效的值，但此方法设置的 code 是直接写入网络通道，不会覆盖 statusCode 的值。

```js
res.writeHead(200, STATUS_CODES["200"], { "content-type": "text/plain" })
res.statusCode = 400

// 最佳实践，不建立更改 statusMessage，由默认返
// res.statusMessage = "custom message"

// 此时 res.statusCode 仍然是 400，但客户端响应是 200
res.end(STATUS_CODES[res.statusCode])
```

### 响应头

1. 响应头的增删改查 `res.setHeader res.getHeader res.getHeaders res.hasHeader res.removeHeader`，不管是设置还是获取，都不区分大不写
2. `res.writeHead(code, message, headers)` 设置的 header 会和 setHeader 设置的值进行合并，并以 writeHead 为准，此时调用 getHeaders 是合并后的值。但是如果之前没有调用过 setHeader 则调用 getHeaders 是空值，不会返回 writeHead 设置的值。这点很迷惑，注意区别。
3. res.writeHead 仅能调用一次，并且设置之后不能再调用 setHeader 设置任何响应头，否则会报错 `[ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`，这点与node文档中描述不符

```js
res.setHeader("Content-Type", "text/html")
res.setHeader("X-Power-By", "node")
res.setHeader("X-Foo", "bar")

if (res.hasHeader("x-foo")) {
  res.removeHeader("x-foo")
}

res.writeHead(200, { "Content-Type": "application/json" })
// res.setHeader("Content-Type", "text/html") // writeHead 之后再设置会报错

res.end(JSON.stringify(res.getHeaders()))
// 如果 writeHead 之前未调用过 setHeader 则 getHeaders 为空对象 {}，如果之前有调用，则为setHeader 和 writeHead 合并后的值
```

### 响应体

根据响应数据的类型不同，需要设置不同的响应头字段 `Content-Type`

- text/plain

```js
res.writeHead(200, { "Content-Type": "text/plain" })
res.write("Hello ")
res.write("World ")
// res.end()
res.end("/body/text") // 最终响应内容会把 write 和 end 的数据进行合并
```

- text/html

```js
res.writeHead(200, { "Content-Type": "text/html" })
res.end("<h1>/body/html</h1>")
```

- application/json

```js
res.writeHead(200, { "Content-Type": "application/json" })
res.end(JSON.stringify({ author: "lisa", createTime: Date.now() }))
```

- stream

```js
const file = fs.createReadStream(filePath, { encoding: "utf8" })
// 指定浏览器下载文件
res.writeHead(200, {
  "Content-Disposition": `attachment; filename=${filename}`,
})
file.pipe(res)

// 客户端接收流数据自行处理
res.writeHead(200, { "Content-Type": "application/octet-stream" })
file.pipe(res)
```

## express

express 对响应数据设置的方法

1. 状态码和状态文本 `res.sendStatus(code) / res.status(code).send(codeMessage)`
2. 响应头 `res.set(field, value) / res.set({field: value}) / res.type / res.attachment / res.cookie(name, value, options)`
3. 响应体 `res.send / res.json / res.format / res.download / res.sendFile`
4. 重定向 `res.redirect`

### 响应状态码和响应消息

```js
// 方式一
res.status(200).send("response ok")
// 方式二
// 将响应 HTTP 状态代码设置为 statusCode，并将注册的状态消息作为文本响应正文发送。
// 如果指定了未知状态代码，则响应正文将只是代码编号。
res.sendStatus(200)
```

### 响应头

常规方式就是 `res.set(field, value) / res.set({field: value})`。

但是有几类常用的响应头,提供了快捷方式

- content-type 使用 res.type
- content-disposition 使用 res.attachment
- cookie 使用 res.cookie

```js
res.set("X-Foo", "bar")
res.set({ "Content-Length": 123434, "Content-Encoding": "gzip" })
res.type("html")
res.cookie("custom_11", "1111", { path: "/", maxAge: 5000 })
res.attachment("test.txt")
```

### 响应体

- 常规方式是 `res.send(data)`
- json 数据体 `res.json(object)`，且会设置响应头 `Content-Type: application/json`
- 文件下载 `res.download(filePath, filename, callback)`，且会设置响应头 `Content-Disposition: attachment; filename=${filename}`
- 文件流 `res.sendFile(filePath, options, callback)` 会根据 filepath 中未尾文件后缀名自动设置 Content-Type 类型，如果未知，则设为 `Content-Type: application/octet-stream`
- 特殊的是 res.format 方式，会根据请求对象的 Accept 请求头（如果存在）执行内容协商. 如果未指定标头，则调用第一个回调。当没有找到匹配时，服务器响应 406 “不被接受”，或者调用 default 回调。也可以选择在响应中设置 content-type 响应头进行匹配.

```js
// 重定向
res.redirect("http://www.bing.com")
// 条件响应数据类型
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
```

## koa

koa 响应数据设置方法，区别于 express 都是函数调用，koa 的很多设置方式都是等号直接赋值，内部是通过对象的访问器属性 getter/setter 实现。

1. 状态码和状态文本 `ctx.status / ctx.message`
2. 响应头 `ctx.set(field, value) / ctx.set({field: value}) / ctx.remove(field) /  ctx.has(field) / ctx.type / ctx.attachment(filename, options) / ctx.cookies`
3. 响应体 `ctx.body / ctx.throw(status, msg)`
4. 重定向 `ctx.redirect()`

### 响应状态码和响应消息

```js
ctx.status = 200
```

### 响应头

常规方式使用 ctx.set，同样对几类步骤使用的头字段有快捷方式 ctx.type / ctx.cookies

```js
ctx.set("X-Power-By", "koa")
ctx.set("X-Foo", "bar")

if (ctx.has("x-foo")) {
  ctx.remove("x-foo")
}
ctx.cookies.set("name", "li lei", { path: "/", maxAge: 5000 })
ctx.set("Content-Type", "text/html")
ctx.type = "json" // 可以写全也可以简写，html / json
```

### 响应体

区别于 express，koa 设置响应体后，有两个默认行为：

- 如果没有设置 response.status，Koa 会根据 response.body 自动将状态设置为 200 或 204。
  - 如果 response.body 没有设置或者已经设置为 null 或 undefined，Koa 会自动将 response.status 设置为 204
  - 如果 response.body 有内容,则会设置 200
- 根据 body 的内容,来设置 content-type 响应头
  - 如果是字符串, Content-Type 默认为 text/html 或 text/plain，两者的默认字符集均为 utf-8。 还设置了内容长度字段。
  - 如果是对象, Content-Type 默认为 application/json。 这包括普通对象 { foo: 'bar' } 和数组 ['foo', 'bar']。
  - 如果是 buffer, Content-Type 默认为 application/octet-stream，并且还设置了 Content-Length。
  - 如果是 stream, Content-Type 默认为 application/octet-stream。

```js
ctx.redirect("http://www.bing.com")

ctx.type = "text/plain"
ctx.body = "/body/text"

ctx.type = "html"
ctx.body = "<h1>/body/html</h1>"

ctx.body = { author: "lisa", createTime: Date.now() } // 自动响应 200，且 Content-Type: application/json

// 文件下载
ctx.attachment(filename, { type: "attachment" })
ctx.body = createReadStream(filePath)

// 响应文件流
ctx.body = createReadStream(filePath)
```

## nestjs

nestjs 响应数据设置方法

1. 状态码和状态文本 `@HttpCode(HttpStatus.Ok)`
2. 响应头 `@Header(field, value)`
3. 响应体 会根据 return 的内容类型,设置 Content-Type 响应头，特别的是文件流需要返回 StreamableFile 实例。
4. 重定向 `@Redirect(url, statusCode=302)`

### 响应状态码和响应消息

```ts
@Get('status-code')
@HttpCode(HttpStatus.OK) // HTTPStatus 是对应 2xx-5xx 状态码的检举
resStatusCode() {
  return 'status code';
}
```

### 响应头

通常使用 `@Header` 装饰器。

```ts
@Get('header')
@Header('Content-Type', 'text/html')
@Header('X-Power-By', 'nestjs')
resHeader() {
  return '<h1>nestjs header</h1>';
}
```

但对于 cookie 设置需要使用特定平台实现的 res 对象，并且需要配合 `cookie-parser` 中间件。

```ts
@Get('cookie/set')
setCookies(@Res({ passthrough: true }) res: Response) {
  res.cookie('cookie11', 'a cookie', {
    path: '/cookie',
    maxAge: 1000 * 60 * 60 * 24 * 1,
  }); // 过期时间 1d

  return 'cookie set success';
}
```

其中 passthrough 参数，Nest 内部程序会检测业务逻辑中是否使用 @Res() 或 @Next()，表明你选择了特定于库的选项，响应将由 res 对象接管。此时特定于 nest 平台的过滤器、后置拦截器将不再起作用。

如果既需要使用 Res 对象（比如设置 cookie 或 header 时），又要继续 nest 的响应流程，则需要传入 passthrough: true 选项。

### 响应体

nestjs 会根据 body 的内容,来设置 content-type 响应头

1. 如果是字符串, Content-Type 默认为 `text/html` 或 `text/plain`，两者的默认字符集均为 utf-8。
2. 如果是对象, Content-Type 默认为 `application/json`。 这包括普通对象 `{ foo: 'bar' }` 和数组 `['foo', 'bar']`。
3. 如果是 buffer / stream, 需要返回 `new StreamableFile(buffer | stream)`，此时 Content-Type 默认为 `application/octet-stream`

```ts
@Get()
resData() {
  return '/body/text';
  return { author: 'lisa', createTime: Date.now() };
}
```

### 重定向

nestjs 重定向使用 `@Redirect(url, code)`，有两个参数，url 和 statusCode，两者都是可选的。 如果省略，statusCode 的默认值为 302。

如果需要根据业务逻辑动态返回 url 时，需要返回一个符合 HttpRedirectResponse 接口的对象，将覆盖传递给 装饰器的任何参数。

```ts
interface HttpRedirectResponse {
  url: string;
  statusCode: HttpStatus;
}


@Get('redirect')
@Redirect('https://www.bing.com', 302)
resRedirect(@Query('version') version: string) {
  if (version === '5') {
    return { url: 'https://nest.nodejs.cn/v5/' }; //这里返回的 url 将覆盖 @Redirect(url, code) 中的。
  }
}
```

### 文件流

响应文件流，可以直接使用 res 对象的方式，但这样会失去对 nestjs 后续过滤器和后置拦截器的逻辑，

如果通过返回一个 StreamableFile 实例，此时 nest 框架将负责后续的响应逻辑，并保持过滤器和拦截器等逻辑。

```ts
/**
   * 响应文件流
   * 但直接使用 res 对象的方式，会失去对 nestjs 后续过滤器和后置拦截器的逻辑
   *
   * @param res
   */
  @Get('file')
  getFile(@Res() res: Response) {
    const filename = 'test.txt';
    const filePath = resolve(process.cwd(), '../../public', filename);
    const file = createReadStream(filePath);
    file.pipe(res);
  }

  /**
   * 响应文件流 文件下载
   * 通过返回一个 StreamableFile 实例，此时 nest 框架将负责后续的响应逻辑，并保持过滤器和拦截器等逻辑。
   *
   * @returns
   */
  @Get('body/download')
  @Header('Content-Disposition', 'attachment; filename="test.txt"')
  resDownload(): StreamableFile {
    const filename = 'test.txt';
    const filePath = resolve(process.cwd(), '../../public', filename);
    return new StreamableFile(createReadStream(filePath));
  }

  /**
   * 响应文件流的另一种方式，设置 passthrough: true，并且返回 StreamableFile 实例
   * 此时可根据业务逻辑灵活设置，比如响应头
   *
   * @param res
   * @returns
   */
  @Get('body/file')
  resFile(@Res({ passthrough: true }) res: Response): StreamableFile {
    const filename = 'test.txt';
    const filePath = resolve(process.cwd(), '../../public', filename);
    res.set('Content-Type', 'application/octet-stream'); // 这是返回 StreamableFile 的默认值
    return new StreamableFile(createReadStream(filePath));
  }
```


