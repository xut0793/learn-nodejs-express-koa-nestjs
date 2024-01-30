/*
 * @Date         : 2024-01-26 23:07:22 星期5
 * @Author       : xut
 * @Description  :
 */
import Router from "@koa/router"
import { resolve } from "node:path"
import swaggerDoc from "swagger-jsdoc"
import { koaSwagger } from "koa2-swagger-ui"

/**
 * swagger-ui 的配置 options
 */
const options = {
  // swagger ui 页面主题的一些显示令牌
  definition: {
    openapi: "3.1.0",
    info: {
      title: "learn koa",
      version: "0.0.1",
      description:
        "This is a simple CRUD API application made with Koa and documented with Swagger",
      contact: {
        name: "xquant",
        url: "https://bing.com",
        email: "info@email.com",
      },
    },
    servers: [{ url: "http://localhost:9002/api" }],
  },
  // 去哪个路由下收集 swagger 注释
  apis: [resolve(process.cwd(), "./14-swagger/**/*.router.js")],
}

const swaggerSpecs = swaggerDoc(options)

async function swaggerJsonMiddleware(ctx) {
  ctx.set("Content-Type", "application/json")
  ctx.body = swaggerSpecs
}

const router = new Router()

// 开放相关所有接口 swagger.json，可用于外部客户端导入，如 postman 等。
router.get("/api/swagger.json", swaggerJsonMiddleware)

// 使用 swaggerSpec 生成 swagger 文档页面，并开放在指定路由
// 区别于 express 必须用 use，这里必须用 get
router.get(
  "/api/docs",
  koaSwagger({
    routerPrefix: false, // 默认 /docs
    swaggerOptions: {
      spec: swaggerSpecs,
    },
  })
)

export default router
