/*
 * @Date         : 2024-01-06 11:30:33 星期6
 * @Author       : xut
 * @Description  :
 */
import express, { Router } from "express"

const app = express()
const router1 = Router()
const router2 = Router()
const router3 = Router()

/***********************************************************************
 * 测试 next('route')
 * route 会跳出当前路由的后续中间件，继续匹配下一组路由
 *********************************************************************/
router1.get(
  "/:id",
  (req, res, next) => (req.params.id === "0" ? next("route") : next()),
  (req, res, next) => {
    console.log("next() >>>", req.params.id)
    res.send("route 测试，匹配到非 0 后调用 next()" + req.params.id)
  }
)

router1.get("/:id", (req, res, next) => {
  console.log('next("route") >>>', req.params.id)
  res.send('route 测试匹配到 0 后调用 next("route")' + req.params.id)
})

/***********************************************************************
 * 测试 next('router')
 * router 直接退出所有路由匹配，响应 404 Not Found，并且也不会执行 error 中间件
 *********************************************************************/
router2.get(
  "/:id",
  (req, res, next) => (req.params.id === "0" ? next("router") : next()),
  (req, res, next) => {
    console.log("next() >>>", req.params.id)
    res.send("router 到非 0 后调用 next()" + req.params.id)
  }
)

router2.get("/:id", (req, res, next) => {
  console.log('next("router") >>>', req.params.id)
  res.send('router 匹配到 0 后调用 next("router")，应该不会被执行')
})

/***********************************************************************
 * 测试 next(error)
 * 直接跳转到 error 中间件执行
 *********************************************************************/
router3.get(
  "/:id",
  (req, res, next) =>
    req.params.id === "0" ? next(new Error("id 为 0，直接报错")) : next(),
  (req, res, next) => {
    console.log("error next() >>>", req.params.id)
    res.send("error 测试，匹配到非 0 后调用 next()" + req.params.id)
  }
)

router3.get("/:id", (req, res, next) => {
  console.log("next(err) >>>", req.params.id)
  res.send("error 测试，应该不会被执行" + req.params.id)
})

/***********************************************************************
 * 注册路由
 *********************************************************************/
app.use("/next-route", router1)
app.use("/next-router", router2)
app.use("/next-error", router3)
app.use((err, req, res, next) => {
  console.log("error 测试匹配到 0 后调用 next(err) >>>" + req.params.id, err)
  next(err)
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
