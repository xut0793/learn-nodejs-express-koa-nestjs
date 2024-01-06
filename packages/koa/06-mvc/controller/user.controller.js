/*
 * @Date         : 2024-01-06 19:03:09 星期6
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import { createReadStream } from "node:fs"
import { userModel } from "../model/index.js"

export const userController = {
  page(ctx) {
    const pagePath = resolve(process.cwd(), "./06-mvc/view/user-list.html")
    ctx.type = "html"
    ctx.body = createReadStream(pagePath)
  },
  query(ctx) {
    const list = userModel.query()
    ctx.body = list
  },
  findOne(ctx) {
    const user = userModel.findOne(ctx.params.id)
    if (user) {
      ctx.body = user
    } else {
      ctx.status = 404
    }
  },
  create(ctx) {
    const createdUser = userModel.create(ctx.request.body)
    ctx.body = createdUser
  },
  update(ctx) {
    const updatedUser = userModel.update(ctx.params.id, ctx.request.body)

    if (updatedUser) {
      ctx.body = updatedUser
    } else {
      ctx.status = 404
    }
  },
  delete(ctx) {
    const userId = ctx.params.id
    const deletedUser = userModel.delete(userId)

    if (deletedUser) {
      ctx.body = deletedUser
    } else {
      ctx.status = 404
    }
  },
}
