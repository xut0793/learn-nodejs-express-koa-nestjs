# 视图模板

MVC 架构中的 V 指的就是视图 View。在前后端不分离的时候，后端 web 服务还承担着响应浏览器页面的逻辑。在现在前后端分离的时候，后端 Web 服务一般就仅作为纯 API 服务了。

在这部分主要了解下模板引擎 handlebars 的使用和在 web 框架中的集成。

## 手动拼接

如果一个路由需要响应一个 Html 页面，原始的方式就是手动拼接 dom 。

```js
export async function renderList(req, res) {
  const list = await getData()

  // 拼接返回的html
  let table = list.reduce(
    (ret, item) => {
      return (ret += `<tr><td>${item.id}</td><td>${item.title}</td><td>${item.content}</td><td>${item.author}</td><td>${item.createTime}</td></tr>`)
    },
    `<table border style='border-collapse:collapse;'>
    <tr>
      <td>ID</td><td>标题</td><td>内容</td><td>作者</td><td>创建时间</td>
    </tr>`
  )

  table += "</table>"

  res.writeHead(200, "OK", { "Content-Type": "text/html;charset=utf8" })
  res.end(resHtml)
}
```

为了使我们能够保持视图渲染和业务逻辑分离，可以使用一个模板引擎。

## 模板引擎

可以选择的模板系统很多，比如 pug、handlebars、art-template 等等。这里以简单的 handlebars 为例。

### 安装依赖

```bash
pnpm add handlebars
```

### 基本使用

```javascript
import handlebars from "handlebars"

// 准备数据源
const data = {
  company: "Freddy's Fish Farm",
  phone: "619-555-1212",
}

// 准备模板
const source = `
  <h1>Aquaponics Report for {{company}}</h1>
  <p>Phone: {{phone}}</p>
`

// 解析渲染
const template = handlebars.compile(source, { strict: true })
const htmlStr = template(data)
```

### 重构

```js
import handlebars from "handlebars"

export async function renderList(req, res) {
  const list = await getData()

  const source = `
  <table border style='border-collapse:collapse;'>
    <tr><td>ID</td><td>标题</td><td>内容</td><td>作者</td><td>创建时间</td></tr>
    {{#each list}}
      <tr><td>{{this.id}}</td><td>{{this.title}}</td><td>{{this.content}}</td><td>{{this.author}}</td><td>{{this.createTime}}</td></tr>
    {{/each}}
  </table>
  <i>这是handlebars渲染生成的文档</i>
  `

  const template = handlebars.compile(source, { strict: true })
  const resHtml = template({ list })

  res.writeHead(200, "OK", { "Content-Type": "text/html;charset=utf8" })
  res.end(resHtml)
}
```

### 分离到 views 目录

抽离页面模板到单独目录 views 中

1. 在 src 下面新建 views 目录
2. 创建 renderList.hbs 文件

```html
<table border style="border-collapse:collapse">
  <tr>
    <td>ID</td>
    <td>标题</td>
    <td>内容</td>
    <td>作者</td>
    <td>创建时间</td>
  </tr>
  {{#each list}}
  <tr>
    <td>{{this.id}}</td>
    <td>{{this.title}}</td>
    <td>{{this.content}}</td>
    <td>{{this.author}}</td>
    <td>{{this.createTime}}</td>
  </tr>
  {{/each}}
</table>
```

3. 在 render.controller.js 中读取.hbs 文件进行渲染

```js
import handlebars from "handlebars"
import fs from "node:fs"

export async function renderList(req, res) {
  const list = await getData()

  const source = fs.readFileSync(
    resolve(process.cwd(), "./src/views/renderList.hbs"),
    { encoding: "utf8" }
  )

  const template = handlebars.compile(source, { strict: true })
  const resHtml = template({ list })

  res.writeHead(200, "OK", { "Content-Type": "text/html;charset=utf8" })
  res.end(resHtml)
}
```

### 视图文件的组织

通常页面会有共用的布局块元素，比如页头 header，内容 main，页尾 footer 等。为了避免每个视图文件都重复页头、页尾的内容，并且可以利用 handlebars 提供的 registerPartial 、registerHelper 自定义代码片段和代码助手来更好组织页面布局。

调整 view 目录结构

```javascript
project
├── index.js
├── src
│   └── views
│       ├── helper
│       │   └── index.js
│       ├── layout
│       │   └── main.hbs
│       ├── partial
│       │   ├── header.hbs
│       │   └── footer.hbs
│       └── page
│           └── renderList.hbs
└── package.json
```

main.hbs

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="Shortcut Icon" href="/favicon.ico" type="image/x-icon" />
    <title>Learn Node Web Development</title>
  </head>
  <body>
    <header>{{> header }}</header>
    <main>{{{ body }}}</main>
    <footer>{{> footer }}</footer>
    {{{_sections.scripts}}}
  </body>
</html>
```

header.hbs

```html
<div>Render By handlebars</div>
```

footer.hbs

```html
<div>Author Xu0793</div>
```

renderList.hbs

```html
<table border style="border-collapse:collapse">
  <tr>
    <td>ID</td>
    <td>标题</td>
    <td>内容</td>
    <td>作者</td>
    <td>创建时间</td>
  </tr>
  {{#each list}}
  <tr>
    <td>{{this.id}}</td>
    <td>{{this.title}}</td>
    <td>{{this.content}}</td>
    <td>{{this.author}}</td>
    <td>{{this.createTime}}</td>
  </tr>
  {{/each}}
</table>

{{#section 'scripts'}}
<script>
  console.log("🚀 ~ file: blogList.hbs:22 ~ script >>>")
</script>
{{/section}}
```

helpers/index.js

```js
/**
 * 帮助注入 script
 *
 * @param {string} name
 * @param {object} options
 * @returns
 */
export function section(name, options) {
  if (!this._sections) this._sections = {}
  this._sections[name] = options.fn(this)
  return null
}
```

### res.render 方法抽象

```javascript
import handlebars from "handlebars"
import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

export class Renderer {
  defaultOptions = {
    root: process.cwd(),
    defaultLayout: "main",
    extname: "hbs",
    viewsDir: "./views",
    layoutsDir: "./layouts",
    partialsDir: "./partials",
    helpers: {},
  }

  constructor(options) {
    this.handlebars = handlebars
    this.options = Object.assign(this.defaultOptions, options)
  }

  getLayout(layoutId) {
    const layoutPath = resolve(
      this.options.root,
      this.options.layoutsDir,
      `${layoutId}.${this.options.extname}`
    )
    const source = readFileSync(layoutPath, { encoding: "utf8" })
    return this.handlebars.compile(source)
  }

  getPartials(data, options) {
    const partialsDir = resolve(this.options.root, this.options.partialsDir)
    const files = readdirSync(partialsDir)
    const partials = files.reduce((ret, f) => {
      const partialPath = resolve(partialsDir, f)
      const source = readFileSync(partialPath, { encoding: "utf8" })
      const template = this.handlebars.compile(source)
      const html = template(data, options)
      const name = f.replace(`.${this.options.extname}`, "")
      ret[name] = html

      return ret
    }, {})

    return partials
  }

  getView(view) {
    const viewPath = resolve(
      this.options.root,
      this.options.viewsDir,
      `${view}.${this.options.extname}`
    )
    const source = readFileSync(viewPath, { encoding: "utf8" })
    return this.handlebars.compile(source)
  }

  render(view, data) {
    const renderOptions = {
      data: {},
      helpers: this.options.helpers,
    }

    const layoutTemplate = this.getLayout(this.options.defaultLayout)
    const partials = this.getPartials(data, renderOptions)
    const viewTemplate = this.getView(view)

    const body = viewTemplate(data, { ...renderOptions, partials })

    if (layoutTemplate) {
      renderOptions.data.body = body
      return layoutTemplate(data, { ...renderOptions, partials })
    } else {
      return body
    }
  }

  middleware() {
    const that = this
    return function (req, res, next) {
      res.render = function (view, data) {
        try {
          res.writeHead(200, { "Content-Type": "text/html" })
          const html = that.render(view, data)
          res.end(html)
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify(error))
        }
      }
      next()
    }
  }
}

export function create(options) {
  return new Renderer(options).middleware()
}
```

使用中间件

```javascript
import { createServer } from "node:http"
import { resolve } from "node:path"
import { createRouter } from "../src/lib/router.js"
import { create } from "../src/parser/render-parser.js"
import { section } from "./view/helper/index.js"
import { mockList } from "./db/index.js"

// 配置视图模板
const hbs = create({
  root: resolve(process.cwd(), "./07-render/view"),
  extname: "hbs",
  defaultLayout: "main",
  layoutsDir: "./layout",
  partialsDir: "./partial",
  viewsDir: "./page",
  helpers: {
    section,
  },
})

const router = createRouter()

router.get("/render/list", hbs, (req, res) => {
  res.render("renderList", { list: mockList })
})

const app = createServer(router)
app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
```

## express 集成

安装 express-handlebars，是一个运行在 Express 上, 对 handlebars 模板引擎封装的中间件。

express 源码中有提供 res.render 方法，会根据配置的 view engine 调用对应的模板引擎进行解析。

```bash
pnpm add express-handlebars handlebars
```

配置

```js
import { resolve } from "node:path"
import { create } from "express-handlebars"
import { section } from "./view/helper/index.js"

const viewPath = path.resolve(process.cwd(), "./src/views")
const hbs = create({
  extname: "hbs", // 默认值 .handlebars
  defaultLayout: "main",
  layoutsDir: resolve(viewPath, "layout"), // 默认基于 views 的路径 + layouts
  partialsDir: resolve(viewPath, "partial"), // 默认基于views 的路径 + partials
  helpers: {
    section,
  },
})
app.set("views", resolve(viewPath, "page")) // 配置视图读取的目录
app.set("view engine", "hbs") // 配置视图模板解析的引擎
app.engine("hbs", hbs.engine) // 默认情况下，express 会调用上面注册的 view engine 的值 hbs.__express 作为解析引擎，所以这里覆盖为自定义的 create 的值。
```

然后在 views 添加对应的模板文件，比如 `renderList.hbs`。
然后在路由控制中调用时，直接传入文件名称和数据即可 `res.render("renderList", { list })`

## koa 集成

koa 配置视图模板引擎，可以使用 koa-handlebars-next 中间件，再配合模板引擎一起使用，这里使用模板引擎 handlebars。
注册了koa-handlebars-next 中间件后，会往 context 实例对象添加 render 方法。

```bash
pnpm add koa-handlebars-next handlebars
```

```js
import hbs from "koa-handlebars-next"
import { section } from "./view/helper/index.js"

// 区别于 express 中配置，这里使用相对路径，相对 root，
// 并且布局模板中使用 @body 变量。
app.use(
  hbs({
    root: resolve(process.cwd(), "./src/view"), // 默认值 process.cwd()
    extension: "hbs", // 这是默认值
    defaultLayout: "main",
    viewsDir: "./page", // 默认值  views
    layoutsDir: "./layout", // 默认值是 layouts
    partialsDir: "./partial", // 默认值是 partials
    helpers: { section },
  })
)
```

在路由中使用

```js
router.get("/render/list", async (ctx) => {
  // 必须使用 async / await
  await ctx.render("renderList", { list: mockList })
})
```

## nestjs 集成

在基于 express 框架的 nestjs 配置视图模板。

```js
// main.js
import { create } from "express-handlebars"

async function bootstrap() {
  const app = (await NestFactory.create) < NestExpressApplication > AppModule

  const viewPath = resolve(process.cwd(), "./src/view")
  const hbs = create({
    extname: "hbs", // 默认值 .handlebars
    defaultLayout: "main",
    layoutsDir: resolve(viewPath, "layout"), // 默认基于 views 的路径 + layouts
    partialsDir: resolve(viewPath, "partial"), // 默认基于views 的路径 + partials
    helpers: {
      section,
    },
  })
  app.setBaseViewsDir([resolve(viewPath, "page")])
  app.setViewEngine("hbs") // 配置视图引擎
  app.engine("hbs", hbs.engine) // // 默认情况下，express 会调用上面注册的 setViewEngine 的值 hbs.__express 作为解析引擎，所以这里覆盖为自定义的 create 的值。

  // 省略其它代码...
}
```

在控制器中使用 `@Render(path)`

```ts
@Controller("render")
export class RenderCaseController {
  @Get("list")
  @Render("renderList")
  async blogListPage() {
    return {
      list: mockList, // 返回的数据作为 render 的数据
    }
  }
}
```
