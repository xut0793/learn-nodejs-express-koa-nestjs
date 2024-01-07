/*
 * @Date         : 2024-01-07 23:45:11 星期0
 * @Author       : xut
 * @Description  :
 */
import handlebars from "handlebars"

const layoutSource = `
  <body>
    <header>{{> header }}</header>
    <main>{{{ @body }}}</main>
    <footer>{{> footer }}</footer>
    {{{_sections.scripts}}}
  </body>
`

const HeaderSource = `<section>Header: Render By Handlebars</section>`
const footerSource = `<section>Header: Render By Handlebars</section>`
const bodySource = `
  <div>{{ name }}</div>
  {{#section "scripts"}}
    <script>
      console.log("🚀 ~ file: blogList.hbs:22 ~ script >>>")
    </script>
  {{/section}}
`
const helpers = {
  section: function section(name, options) {
    if (!this._sections) this._sections = {}
    this._sections[name] = options.fn(this)
    return null
  },
}

const layoutTemplate = handlebars.compile(layoutSource)
const bodyTemplate = handlebars.compile(bodySource)
const headerTemplate = handlebars.precompile(HeaderSource)
const footerTemplate = handlebars.precompile(footerSource)

const data = { name: "12345" }
const options = {
  data: {},
  helpers,
  partials: {
    header: HeaderSource,
    footer: footerSource,
  },
}

const bodyHtml = bodyTemplate(data, options)

options.data.body = bodyHtml
const html = layoutTemplate(data, options)

console.log(html)
