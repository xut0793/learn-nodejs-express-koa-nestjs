/*
 * @Date         : 2024-02-28 15:18:37 星期3
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"

export const router = Router()

// 实际业务中将数据存入数据库
const users = []

/**
 * 用户注册
 *
 * 1.检查账号是否重复注册
 */
router.post("/register", (req, res) => {
  const params = req.body
  const { account, password } = params

  const isExist = users.some((i) => i.account === account)

  if (isExist) {
    res.send({ code: "-1", msg: "账号已存在，请重新命名", data: null })
  } else {
    users.push({ account, password })
    res.send({ code: 0, msg: "ok", data: params })
  }
})

/**
 * 用户登录
 *
 * 1.检查用户账号和密码是否匹配，存在用户
 * 2.不存在时，理想情况下是响应详细信息，到底是账号不对，还是密码错误。但为了避免穷举等安全风险，在此环节是避免透露详细报错信息的。
 */
router.post("/login", (req, res) => {
  const params = req.body

  const { account, password } = params

  const isExist = users.some(
    (i) => i.account === account && i.password === password
  )

  if (isExist) {
    res.send({ code: 0, msg: "ok", data: params })
  } else {
    res.send({
      code: "-1",
      msg: "登录失败，请检查用户名或密码是否正确",
      data: null,
    })
  }
})

/**
 * 获取用户列表
 */
router.get("/users", (req, res) => {
  res.send({ code: "0", msg: "ok", data: users })
})
