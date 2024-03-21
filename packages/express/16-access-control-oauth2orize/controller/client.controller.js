import { clientModel } from "../db/index.js"

export function postClient(req, res) {
  const { name } = req.body
  const client = clientModel.add({ name, uid: req.user.uid })

  return res.json({ code: 0, msg: "ok", data: client })
}

export function getClients(req, res) {
  const clients = clientModel.getAll()
  return res.json({ code: 0, msg: "ok", data: clients })
}
