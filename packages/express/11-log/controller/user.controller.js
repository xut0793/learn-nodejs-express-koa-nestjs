/*
 * @Date         : 2024-01-06 19:03:09 星期6
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import { createReadStream } from "node:fs"
import { userModel } from "../model/index.js"

export const userController = {
  page(req, res) {
    const pagePath = resolve(process.cwd(), "./06-mvc/view/user-list.html")
    const page = createReadStream(pagePath)
    res.status(200)
    res.type("html")
    page.pipe(res)
  },
  query(req, res) {
    const list = userModel.query()
    res.json(list)
  },
  findOne(req, res) {
    const user = userModel.findOne(req.params.id)
    if (user) {
      res.json(user)
    } else {
      res.sendStatus(404)
    }
  },
  create(req, res) {
    const createdUser = userModel.create(req.body)
    res.json(createdUser)
  },
  update(req, res) {
    const updatedUser = userModel.update(req.params.id, req.body)

    if (updatedUser) {
      res.json(updatedUser)
    } else {
      res.sendStatus(404)
    }
  },
  delete(req, res) {
    const userId = req.params.id
    const deletedUser = userModel.delete(userId)

    if (deletedUser) {
      res.json(deletedUser)
    } else {
      res.sendStatus(404)
    }
  },
  debug(req, res) {
    req.logger.debug("user.controller debug message", {
      scope: "user.controller",
    })

    res.status(200).json({ debug: true })
  },
  error(req, res) {
    throw new Error("test logger error")
  },
}
