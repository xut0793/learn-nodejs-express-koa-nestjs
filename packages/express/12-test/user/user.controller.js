/*
 * @Date         : 2024-01-23 17:09:44 星期2
 * @Author       : xut
 * @Description  :
 */
import { userService } from "./user.service.js"

export const userController = {
  queryUsers(req, res) {
    const queryUserDto = req.query
    const result = userService.queryUsers(queryUserDto)
    res.json(result)
  },
  createUser(req, res) {
    const createUserDto = req.body

    const result = userService.createUser(createUserDto)
    res.json(result)
  },
  updateUser(req, res) {
    const userId = +req.params.userId
    const updateUserDto = req.body
    const result = userService.updateUser(userId, updateUserDto)
    res.json(result)
  },
  delUser(req, res) {
    const userId = +req.params.userId
    const result = userService.delUser(userId)
    res.json(result)
  },
}
