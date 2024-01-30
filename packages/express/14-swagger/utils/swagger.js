/*
 * @Date         : 2024-01-26 14:26:56 星期5
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import { Router } from "express"
import swaggerDoc from "swagger-jsdoc"
import swaggerUI from "swagger-ui-express"

/**
 * swagger-ui 的配置 options
 */
const options = {
  // swagger ui 页面主题的一些显示令牌
  definition: {
    openapi: "3.1.0",
    info: {
      title: "learn express",
      version: "0.0.1",
      description:
        "This is a simple CRUD API application made with Express and documented with Swagger",
      contact: {
        name: "xquant",
        url: "https://bing.com",
        email: "info@email.com",
      },
    },
    servers: [{ url: "http://localhost:9001/api" }],
  },
  // 去哪个路由下收集 swagger 注释
  apis: [resolve(process.cwd(), "./14-swagger/**/*.router.js")],
}

const swaggerSpecs = swaggerDoc(options)

function swaggerJsonMiddleware(req, res) {
  res.setHeader("Content-Type", "application/json")
  res.send(swaggerSpecs)
}

const router = Router()
// 开放相关接口，
router.get("/api/swagger.json", swaggerJsonMiddleware)
// 使用 swaggerSpec 生成 swagger 文档页面，并开放在指定路由
router.use(
  "/api/docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpecs, { explorer: true })
) // explorer：true，显示顶部搜索栏

export default router
