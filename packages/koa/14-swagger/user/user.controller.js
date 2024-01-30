/*
 * @Date         : 2024-01-23 17:09:44 星期2
 * @Author       : xut
 * @Description  :
 */
import { userService } from "./user.service.js"

export const userController = {
  findAll(ctx) {
    ctx.body = userService.findAll()
  },
  queryUsers(ctx) {
    const queryUserDto = ctx.request.query
    const result = userService.queryUsers(queryUserDto)
    ctx.body = result
  },
  createUser(ctx) {
    const createUserDto = ctx.request.body

    const result = userService.createUser(createUserDto)
    ctx.body = result
  },
  updateUser(ctx) {
    const userId = +ctx.params.userId
    const updateUserDto = ctx.request.body
    const result = userService.updateUser(userId, updateUserDto)
    ctx.body = result
  },
  delUser(ctx) {
    const userId = +ctx.params.userId
    const result = userService.delUser(userId)
    ctx.body = result
  },
}
