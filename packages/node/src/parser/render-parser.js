/*
 * @Date         : 2024-01-07 22:01:06 星期0
 * @Author       : xut
 * @Description  :
 */
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
