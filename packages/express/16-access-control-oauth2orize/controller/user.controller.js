import { userModel } from "../db/index.js"

export function postUser(req, res) {
  const user = userModel.add({
    username: req.body.username,
    password: req.body.password,
  })

  return res.json({ code: 0, msg: "ok", data: user })
}

export function getAllUser(req, res) {
  const users = userModel.getAll()
  return res.json({ code: 0, msg: "ok", data: users })
}
