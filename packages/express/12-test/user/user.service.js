/*
 * @Date         : 2024-01-23 17:09:52 星期2
 * @Author       : xut
 * @Description  :
 */
import dayjs from "dayjs"
import { userModel } from "./user.model.js"
import { UserNotFoundBizException } from "../../../node/src/utils/biz.exception.js"

export const userService = {
  queryUsers(queryUserDto) {
    if (Object.keys(queryUserDto).length === 0) {
      const users = userModel.query()
      return {
        total: users.length,
        list: users,
      }
    }

    const { pageSize = 2, pageNum = 1 } = queryUserDto
    const start = (pageNum - 1) * pageSize
    const end = pageNum * pageSize
    const users = userModel.query()
    return {
      total: users.length,
      list: users.slice(start, end),
    }
  },

  createUser(createUserDto) {
    const allUsers = userModel.query()
    const newUser = {
      ...createUserDto,
      id: allUsers.length + 1,
      createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    }
    userModel.create(newUser)
    return newUser
  },

  updateUser(userId, updateUserDto) {
    const curUser = userModel.findOne(userId)

    if (!curUser) {
      throw new UserNotFoundBizException()
    }

    const newUser = {
      ...curUser,
      ...updateUserDto,
      updateTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    }
    userModel.update(userId, newUser)
    return newUser
  },

  delUser(userId) {
    const result = userModel.delete(userId)

    if (!result) {
      throw new UserNotFoundBizException()
    }

    return result[0]
  },
}
