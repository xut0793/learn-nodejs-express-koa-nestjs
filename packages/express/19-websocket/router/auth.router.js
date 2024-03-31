/*
 * @Date         : 2024-03-31 20:57:39 星期0
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import { randomBytes } from "node:crypto"
import { connectPools } from "../ws.js"

/**
 * 生成随机字符串
 *
 * 利用十六进制表示字符串。所以字符串长度  len * 4 / 8 = size，即 randomBytes(size) 的参数，表示要生成的字节数
 * 所以 len 最好是8的倍数
 * @param {number} len 字符串长度
 * @return {string}
 */
export function genRandomString(len) {
  const size = Math.floor((len * 4) / 8)
  return randomBytes(size).toString("hex")
}

export const router = Router()

router.post("/login", function (req, res) {
  //
  // "Log in" user and set userId to session.
  //
  const id = genRandomString(16)

  console.log(`Updating session for user ${id}`)
  req.session.userId = id
  res.send({ result: "OK", message: `Session updated, user id: ${id}` })
})

router.get("/logout", function (request, response) {
  const ws = connectPools.get(request.session.userId)

  console.log("Destroying session")
  request.session.destroy(function () {
    if (ws) ws.close()

    response.send({ result: "OK", message: "Session destroyed" })
  })
})
