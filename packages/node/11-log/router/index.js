/*
 * @Date         : 2024-01-06 18:39:40 星期6
 * @Author       : xut
 * @Description  :
 */
import { createRouter } from "../../src/lib/router.js"
import { urlParser, queryParser, cookieParser } from "../../src/parser/index.js"
import { bodyParser } from "../../src/parser/body-parser.js"
import { userController } from "../controller/user.controller.js"
import { loggerMiddleware } from "../middleware/logger.middleware.js"

const router = createRouter()

/************************************************
 * 前置中间件：解析 url query params body
 **********************************************/
router.use(urlParser)
router.use(queryParser)
router.use(cookieParser)
router.use(loggerMiddleware)

/************************************************
 * 注册路由，将路由与 controller 绑定
 **********************************************/
router.get("/user/page", userController.page)
router.get("/user/query", userController.query)
router.post("/user/create", bodyParser.json(), userController.create)
router.get("/user/debug", userController.debug)
router.get("/user/error", userController.error)
router.get("/user/:id", userController.findOne)
router.put("/user/:id", bodyParser.json(), userController.update)
router.delete("/user/:id", userController.delete)

/************************************************
 * 后置中间件：错误处理
 **********************************************/
router.use((req, res) => {
  res.writeHead(404)
  res.end("404 NOT FOUND")
})

router.use((err, req, res, next) => {
  // 错误中间件中记录错误日志
  req.logger.error(err)

  if (err instanceof BizException) {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify(err))
  } else {
    if (process.env.NODE_ENV !== "production") {
      console.error(err.stack || err.toString())
    }

    res.writeHead(500, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        code: err.code || 500,
        msg: err.msg || err.message || STATUS_CODES[500],
        data: null,
      })
    )
  }
})

export default router
