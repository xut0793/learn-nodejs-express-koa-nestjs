/*
 * @Date         : 2026-05-03 16:29:42 星期0
 * @Author       : xut
 * @Description  :
 */
import { defineConfig } from "vitepress"
import markdownItTaskLists from "markdown-it-task-lists"

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/learn-nodejs-express-koa-nestjs/",
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
          text: "脚手架",
          items: [
            {
              text: "CLI",
              link: "/builtin/1-cli.md",
            },
            {
              text: "repl",
              link: "/builtin/2-repl.md",
            },
            {
              text: "corepack",
              link: "/builtin/3-corepack.md",
            },
          ],
        },
        {
          text: "全局",
          items: [
            {
              text: "global/globalThis",
              link: "/builtin/7-global.md",
            },
            {
              text: "OS",
              link: "/builtin/8-os.md",
            },
            {
              text: "v8",
              link: "/builtin/9-v8.md",
            },
            {
              text: "vm",
              link: "/builtin/10-vm.md",
            },
            {
              text: "tty",
              link: "/builtin/11-tty.md",
            },
          ],
        },
        {
          text: "工具",
          items: [
            {
              text: "util",
              link: "/builtin/12-util.md",
            },
            {
              text: "timer",
              link: "/builtin/13-timer.md",
            },
            {
              text: "zlib",
              link: "/builtin/14-zlib.md",
            },
            {
              text: "crypto",
              link: "/builtin/15-crypto.md",
            },
            {
              text: "web-crypto",
              link: "/builtin/16-web-crypto.md",
            },
          ],
        },
        {
          text: "事件",
          items: [
            {
              text: "events/EventEmitter",
              link: "/builtin/17-events-EventEmitter.md",
            },
            {
              text: "events/EventTarget",
              link: "/builtin/17-events-EventTarget.md",
            },
            {
              text: "diagnostis_channel",
              link: "/builtin/18-diagnostis-channel.md",
            },
          ],
        },
        {
          text: "I/O",
          items: [
            {
              text: "console",
              link: "/builtin/5-console.md",
            },
            {
              text: "readline",
              link: "/builtin/6-readline.md",
            },
          ],
        },
        {
          text: "路径和文件",
          items: [
            {
              text: "path",
              link: "/builtin/21-path.md",
            },
            {
              text: "fs",
              link: "/builtin/22-fs.md",
            },
            {
              text: "linux fs",
              link: "/builtin/22-fs-linux.md",
            },
          ],
        },
        {
          text: "二进制和流",
          items: [
            {
              text: "buffer",
              link: "/builtin/19-buffer.md",
            },
            {
              text: "web ArrayBuffer",
              link: "/builtin/19-arraybuffer-typedarray-dataview-textencoder-textdecoder.md",
            },
            {
              text: "blob-file",
              link: "/builtin/19-buffer-blob.md",
            },
            {
              text: "string_decoder",
              link: "/builtin/19-buffer-string-decoder.md",
            },
            {
              text: "stream",
              link: "/builtin/20-stream.md",
            },
            {
              text: "web stream",
              link: "/builtin/20-stream-web.md",
            },
            {
              text: "stream 源码解析",
              link: "/builtin/20-stream-resource.md",
            },
          ],
        },
        {
          text: "进程和线程",
          items: [
            {
              text: "概念认知",
              link: "/builtin/concurrency_index.md",
            },
            {
              text: "process",
              link: "/builtin/concurrency_process.md",
            },
            {
              text: "child_process",
              link: "/builtin/concurrency_child_process.md",
            },
            {
              text: "cluster",
              link: "/builtin/concurrency_cluster.md",
            },
            {
              text: "worker_threads",
              link: "/builtin/concurrency_worker_threads.md",
            },
            {
              text: "web worker",
              link: "/builtin/concurrency_web_worker.md",
            },
            {
              text: "异步",
              link: "/builtin/concurrency_async.md",
            },
          ],
        },
        {
          text: "网络",
          items: [
            {
              text: "Internet 历史",
              link: "/builtin/network_index.md",
            },
            {
              text: "IP/DNS",
              link: "/builtin/network_ip_dns.md",
            },
            {
              text: "UDP/TCP",
              link: "/builtin/network_udp_tcp.md",
            },
            {
              text: "web 历史",
              link: "/builtin/network_web.md",
            },
            {
              text: "http历史",
              link: "/builtin/etwork_http_history.md",
            },
            {
              text: "http协议",
              link: "/builtin/network_http_protocol.md",
            },
            {
              text: "URL",
              link: "/builtin/network_url_queryString.md",
            },
            {
              text: "http",
              link: "/builtin/network_http_client_server.md",
            },
            {
              text: "http2",
              link: "/builtin/network_http2.md",
            },
            {
              text: "https",
              link: "/builtin/network_https.md",
            },
          ],
        },
        {
          text: "数据持久化",
          items: [
            {
              text: "文本和二进制",
              link: "/builtin/persistent_storage.md",
            },
            {
              text: "数据库",
              link: "/builtin/persistent_sqlite_orm.md",
            },
          ],
        },
        {
          text: "测试",
          items: [],
        },
        {
          text: "错误和调试",
          items: [],
        },
      ],
      "/web/": [
        {
          text: "Web",
          link: "/web/00-hello-world.md",
        },
        {
          text: "热更新",
          link: "/web/01-hot-module-replacement.md",
        },
        {
          text: "Request 请求",
          link: "/web/02-request.md",
        },
        {
          text: "Response 响应",
          link: "/web/03-response.md",
        },
        {
          text: "Router 路由",
          items: [
            {
              text: "router",
              link: "/web/04-router.md",
            },
            {
              text: "node 实现 router",
              link: "/web/04-router-node.md",
            },
          ],
        },
        {
          text: "Middleware 中间件",
          link: "/web/05-middleware.md",
        },
        {
          text: "MVC 分层",
          link: "/web/06-mvc.md",
        },
        {
          text: "Views 视图",
          link: "/web/07-render.md",
        },
        {
          text: "Static 静态文件服务",
          items: [
            {
              text: "static",
              link: "/web/08-static.md",
            },
            {
              text: "node 实现 static",
              link: "/web/08-static-node.md",
            },
          ],
        },
        {
          text: "Environment 环境变量",
          link: "/web/09-environment.md",
        },
        {
          text: "Error 错误",
          link: "/web/10-error-handle.md",
        },
        {
          text: "Log 日志",
          items: [
            {
              text: "介绍",
              link: "/web/11-log-intro.md",
            },
            {
              text: "集成",
              link: "/web/11-log-integration.md",
            },
            {
              text: "winston",
              link: "/web/11-log-winston.md",
            },
            {
              text: "nestjs",
              link: "/web/11-log-nestjs.md",
            },
          ],
        },
        {
          text: "Debug 调试",
          link: "/web/12-debug.md",
        },
        {
          text: "Test 测试",
          link: "/web/13-test.md",
        },
        {
          text: "Document 文档",
          link: "/web/14-swagger.md",
        },
        {
          text: "ORM 数据库",
          link: "/web/15-orm-prisma.md",
        },
        {
          text: "访问控制",
          items: [
            {
              text: "介绍",
              link: "/web/16-access-control/index.md",
            },
            {
              text: "注册登录",
              link: "/web/16-access-control/register-login.md",
            },
            {
              text: "Authentication 认证",
              link: "/web/16-access-control/authentication.md",
            },
            {
              text: "Authentication/passport",
              link: "/web/16-access-control/passport.md",
            },
            {
              text: "Authorization 授权",
              link: "/web/16-access-control/authorization.md",
            },
            {
              text: "Authorization/casbin",
              link: "/web/16-access-control/authorization-rbac-action.md",
            },
            {
              text: "Authorization/rbac",
              link: "/web/16-access-control/authorization-rbac-action.md",
            },
            {
              text: "Authorization/oauth",
              link: "/web/16-access-control/oauth.md",
            },
            {
              text: "Audit 鉴权",
              link: "/web/16-access-control/audit.md",
            },
            {
              text: "SSO",
              link: "/web/16-access-control/sso.md",
            },
          ],
        },
        {
          text: "Cron 定时任务",
          link: "/web/17-cron.md",
        },
        {
          text: "服务端推送",
          items: [
            {
              text: "SSE",
              link: "/web/18-sse.md",
            },
            {
              text: "websocket",
              link: "/web/19-websocket.md",
            },
          ],
        },
        {
          text: "GraphQL",
          items: [
            {
              text: "GraphQL",
              link: "/web/20-graphql.md",
            },
            {
              text: "GraphQL 类型系统",
              link: "/web/20-graphql-type.md",
            },
          ],
        },
        {
          text: "Microservice 微服务",
          items: [
            {
              text: "微服务介绍",
              link: "/web/21-microservice/microservice.md",
            },
            {
              text: "RPC",
              link: "/web/21-microservice/rpc.md",
            },
            {
              text: "Protobuf",
              link: "/web/21-microservice/protobuf.md",
            },
          ],
        },
        {
          text: "Security 安全",
          items: [
            {
              text: "介绍",
              link: "/web/22-security/index.md",
            },
            {
              text: "xss",
              link: "/web/22-security/xss.md",
            },
            {
              text: "csrf",
              link: "/web/22-security/csrf.md",
            },
            {
              text: "hijacking",
              link: "/web/22-security/interface-hijacking.md",
            },
            {
              text: "cors",
              link: "/web/22-security/cors.md",
            },
            {
              text: "rate limiting",
              link: "/web/22-security/rate-limit.md",
            },
          ],
        },
        {
          text: "Build 构建",
          link: "/web/23-build.md",
        },
        {
          text: "Deploy 部署",
          link: "/web/24-deploy-pm2.md",
        },
        {
          text: "Release 发布",
          items: [
            {
              text: "发布策略",
              link: "/web/25-release-policy.md",
            },
            {
              text: "健康检查",
              link: "/web/25-release-health-check.md",
            },
            {
              text: "预热和优雅退出",
              link: "/web/25-release-graceful-start-exit.md",
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
