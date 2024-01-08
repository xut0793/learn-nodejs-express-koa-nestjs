# 静态资源服务

网页内容时总有一些固定的资源请求，比如图片、css、js 脚本等。这些可以通过配置中间件服务来响应。

## node

node 中需要原生实现，依照 express 中静态文件服务的实现原理，从头简单实现一遍，会了解很多细节知识。

[08-static-node](./08-static-node.md)
[源码 Static-server.js](../node/src/parser/static-server.js)

## express

Express 中使用 express.static 内置中间件函数实现。

```js
express.static(root, [options])

/**
 * root 指定提供静态资源的根目录，通过将 process.cwd() 与提供的 root 目录组合来确定要服务的文件
 * options
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
```

下面是一个将 express.static 中间件函数与精心设计的选项对象一起使用的示例：

```js
options = {
  dotfiles: "ignore",
  etag: false,
  extensions: ["htm", "html"],
  index: false,
  maxAge: "1d",
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set("x-timestamp", Date.now())
  },
}

app.use(express.static("public", options))

// 此时可以加载 public 目录中的文件，比如
// http://localhost:3000/js/app.js
// http://localhost:3000/images/bg.png
// http://localhost:3000/hello.html
```

express.static 可以多个调用，以设置多个目录作为静态文件服务地址。按照使用 express.static 中间件函数设置静态目录的顺序查找文件。

```js
app.use(express.static("public"))
app.use(express.static("files"))
```

如果要提供一个虚拟路径来设置路径前缀，可以在这样操作：

```js
app.use("/static", express.static("public"))
// 从 /static 路径前缀加载 public 目录中的文件。
// http://localhost:3000/static/js/app.js
// http://localhost:3000/static/images/bg.png
// http://localhost:3000/static/hello.html
```

另外，建立服务目录设置成绝对路径会更安全，避免目录移动导致问题。

```js
app.use("/static", express.static(path.resolve(process.cwd(), "public")))
```

## koa

koa 需要使用 koa-static-cache 中间件。

> koa-static-cache 相比于 koa-static 来说，可以设置文件在浏览器的缓存。

```bash
pnpm add koa-static-cache
```

```js
// 定义 static 目录存放静态文件。
// prefix: '/static' 设置后，比如 html中请求静态图片，则 src="/static/logo.png"
app.use(
  koaStaticCache(path.resolve(process.cwd(), "public"), {
    prefix: "/static", // 如果当前请求的url是以/static开始，则作为静态资源请求
    maxAge: "1d", // 强缓存时间，单位秒，默认0
    gzip: true, // 启用 gzip 压缩，默认 true
  })
)
```

## nestjs

nestjs 提供静态服务有两种实现

- `app.useStaticAssets(root, serveStaticOptions)`
- `@nestjs/serve-static`

官网的意思，如果服务提供了 MVC 架构，建立搭配 `app.useStaticAssets`，如果只是纯Api服务于前端 spa 应用，建立静态服务，推荐 `@nestjs/serve-static`。两种实现上并无区别。

### 方式一：useStaticAssets

在 main.ts 中使用。

```js
const app = await NestFactory.create<NestExpressApplication>(
  AppModule,
);
app.useStaticAssets(resolve(process.cwd(), 'public'), {
  prefix: '/static/', // 必须是绝对路径，且未尾添加 /
});
```

serveStaticOptions 选项对象见下面。

### 方式二：@nestjs/serve-static

nestjs 中使用 `@nestjs/serve-static` 包中的 `ServeStaticModule` 模块来实现功能。

```bash
pnpm add @nestjs/serve-static
```

注册模块

```js
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: resolve(process.cwd(), "public"),
      serveStaticOptions: {
        prefix: "/static/",
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

forRoot(options) 的选项值

```
- rootPath	Default client, 	静态文件根目录
- serveRoot	Default: ""	提供静态应用程序的根路径。
- renderPath Default: `*` 所有路径, 可以设置字符串或正则表达式，	渲染静态应用程序的路径(与serveRoot值连接)。注意:RegExp不被 fastify 支持。
- exclude	string[]	提供静态应用时要排除的路径，该属性不支持 fastify
- serveStaticOptions 静态文件选项，基本属性同 `express.static(root, options)` 中的 option。但是多了一个设置虚拟路径前缀的字段 prefix
  - prefix: string,
  - dotfiles?: string;
  - etag?: boolean;
  - extensions?: string[];
  - fallthrough?: boolean;
  - index?: boolean | string | string[];
  - lastModified?: boolean;
  - maxAge?: number | string;
  - redirect?: boolean;
  - setHeaders?: (res: any, path: string, stat: any) => any;
```
