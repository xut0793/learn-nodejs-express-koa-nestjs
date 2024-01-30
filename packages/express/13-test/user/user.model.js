/*
 * @Date         : 2024-01-06 19:38:01 星期6
 * @Author       : xut
 * @Description  :
 */
import { userDB } from "../db/index.js"
export const userModel = {
  query: () => userDB,
  findOne: (id) => userDB.find((u) => u.id === id),
  create: (user) => userDB.push({ ...user, id: userDB.length + 1 }),
  update: (id, user) => {
    const oldUser = userDB.find((u) => u.id === id)
    if (oldUser) {
      return Object.assign(oldUser, user)
    } else {
      return false
    }
  },
  delete: (id) => {
    const idx = userDB.findIndex((u) => u.id === id)
    if (idx > -1) {
      return userDB.splice(idx, 1)
    } else {
      return false
    }
  },
}
