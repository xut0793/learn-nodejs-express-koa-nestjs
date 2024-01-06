/*
 * @Date         : 2024-01-06 18:39:40 星期6
 * @Author       : xut
 * @Description  :
 */
import { createRouter } from "../../src/lib/router.js"
import { urlParser, queryParser, cookieParser } from "../../src/parser/index.js"
import { bodyParser } from "../../src/parser/body-parser.js"
import { userController } from "../controller/user.controller.js"

const router = createRouter()

/************************************************
 * 前置中间件：解析 url query params body
 **********************************************/
router.use(urlParser)
router.use(queryParser)
router.use(cookieParser)

/************************************************
 * 注册路由，将路由与 controller 绑定
 **********************************************/
router.get("/user/page", userController.page)
router.get("/user/query", userController.query)
router.get("/user/:id", userController.findOne)
router.post("/user/create", bodyParser.json(), userController.create)
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
  console.log("error handle")
  next()
})

export default router
