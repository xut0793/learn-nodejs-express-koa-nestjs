/*
 * @Date         : 2024-01-06 19:03:09 星期6
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import { createReadStream } from "node:fs"
import { userModel } from "../model/index.js"

export const userController = {
  page(req, res, next) {
    try {
      const pagePath = resolve(process.cwd(), "./06-mvc/view/user-list.html")
      const page = createReadStream(pagePath)
      res.writeHead(200, { "Content-Type": "text/html" })
      page.pipe(res)
    } catch (error) {
      next(error)
    }
  },
  query(req, res, next) {
    try {
      const list = userModel.query()
      res.writeHead(200)
      res.end(JSON.stringify(list))
    } catch (error) {
      next(error)
    }
  },
  findOne(req, res, next) {
    try {
      const user = userModel.findOne(req.params.id)
      res.writeHead(200)
      res.end(JSON.stringify(user))
    } catch (error) {
      next(error)
    }
  },
  create(req, res, next) {
    try {
      const createdUser = userModel.create(req.body)
      res.writeHead(200)
      res.end(JSON.stringify(createdUser))
    } catch (error) {
      next(error)
    }
  },
  update(req, res, next) {
    try {
      console.log("req.params.id >>>", req.params.id)
      const updatedUser = userModel.update(req.params.id, req.body)

      if (!updatedUser) throw new Error("user is not exist")

      res.writeHead(200)
      res.end(JSON.stringify(updatedUser))
    } catch (error) {
      next(error)
    }
  },
  delete(req, res, next) {
    try {
      const deletedUser = userModel.delete(req.params.id)

      if (!deletedUser) throw new Error("user is not exist")
      res.writeHead(200)
      res.end(JSON.stringify(deletedUser))
    } catch (error) {
      next(error)
    }
  },
}
