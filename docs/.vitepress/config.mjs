/*
 * @Date         : 2026-05-03 16:29:42 星期0
 * @Author       : xut
 * @Description  :
 */
import { defineConfig } from "vitepress"
import markdownItTaskLists from "markdown-it-task-lists"

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "learn-node",
  description: "learn node express koa nestjs",
  lang: "zh-CN",
  head: [["link", { rel: "icon", href: "/nodejs.svg" }]],
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/nodejs-horizontal.svg",
    siteTitle: "",
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/xut0793/learn-node-express-koa-nestjs.git",
      },
    ],
    footer: {
      message: "PowerBy xut0793",
      copyright: "Copyright ©  2025年7月30日18:32:16-present",
    },
    nav: [
      { text: "Home", link: "/" },
      { text: "Nodejs", link: "/builtin/index.md" },
      { text: "Web Framework", link: "/web/index.md" },
    ],

    sidebar: {
      "/builtin/": [
        {
          text: "导论",
          items: [
            {
              text: "如何学习编程",
              link: "/builtin/how_to_learn_programming_language.md",
            },
          ],
        },
      ],
      "/web/": [
        {
          text: "Web",
          items: [
            {
              text: "Web",
              link: "/web/index.md",
            },
          ],
        },
      ],
    },
  },
  markdown: {
    config: (md) => {
      md.use(markdownItTaskLists)
    },
  },
})
