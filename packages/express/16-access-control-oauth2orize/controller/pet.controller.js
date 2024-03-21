import { petModel } from "../db/index.js"

export function postPet(req, res) {
  const { name, type, quantity } = req.body
  const pet = petModel.add({ name, type, quantity, uid: req.user.uid })
  return res.json({ code: 0, msg: "ok", data: pet })
}

export function getAllPet(req, res) {
  const pets = petModel.getAll(req.user.uid)
  return res.json({ code: 0, msg: "ok", data: pets })
}

export function getPetById(req, res) {
  const pet = petModel.get(req.params.id)
  return res.json({ code: 0, msg: "ok", data: pet })
}

export function updatePet(req, res) {
  const pet = petModel.update(req.params.id, { quantity: res.body.quantity })
  return res.json({ code: 0, msg: "ok" })
}

export function deletePet(req, res) {
  petModel.delete(req.params.id)
  return res.json({ code: 0, msg: "ok" })
}
