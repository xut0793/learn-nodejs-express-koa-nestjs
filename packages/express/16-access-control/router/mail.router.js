/*
 * @Date         : 2024-02-28 15:18:37 星期3
 * @Author       : xut
 * @Description  : 邮箱发送验证码
 */
import { Router } from "express"
import {
  sendMail,
  generateRandomCode,
  validateCode,
  validateThreshold,
} from "../utils/nodemailer.util.js"

export const router = Router()

// 实际情况下，可以存入数据库是操作
const users = []

/**
 * 获取邮箱验证码
 *
 * 1. 生成指定位数的随机数字，作为验证码
 * 2. 验证码保持1分钟内有效，最多使用3次
 * 3. 限制频繁发送验证码
 */
router.get("/code", async (req, res) => {
  try {
    const mail = req.query.mail

    if (!mail) throw new Error("邮箱不能为空")

    const { err, msg } = validateThreshold(mail)

    if (err) {
      throw new Error(msg)
    }

    const code = generateRandomCode(mail)
    const text = `验证码：${code}，请勿转发或泄漏。如果非本人操作，请联系管理员`

    const sendResult = await sendMail(text, mail)

    res.send({ code: "0", msg: "ok", data: sendResult })
  } catch (error) {
    res.status(200).send({ code: "-1", msg: error.message, data: error })
  }
})

/**
 * 用户注册
 *
 * 1.将邮箱作为账号使用，检查邮箱是否重复注册
 * 2.检查邮箱是否有效，邮箱格式校验，校验邮箱验证码
 */
router.post("/register", (req, res) => {
  try {
    const params = req.body
    const { mail, mailCode, password } = params

    const isExist = users.some((i) => i.mail === mail)

    if (isExist) {
      throw new Error("邮箱已存在，请重新输入邮箱注册")
    }

    const { err, msg } = validateCode(mail, mailCode)
    if (err) {
      throw new Error(msg)
    }

    users.push({ mail, password })
    res.send({ code: 0, msg: "ok", data: params })
  } catch (error) {
    res.status(200).send({ code: "-1", msg: error.message, data: error })
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
  const { mail, password } = params

  const isExist = users.some((i) => i.mail === mail && i.password === password)

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
