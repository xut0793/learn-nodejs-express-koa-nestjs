/*
 * @Date         : 2024-03-15 14:22:33 星期5
 * @Author       : xut
 * @Description  :
 */
export const userModel = {
  users: [{ uid: 1, username: "root", password: "123" }],

  find({ username, password }) {
    return this.users.find(
      (u) => u.username === username && u.password === password
    )
  },
  findByUsername(username) {
    return this.users.find((u) => u.username === username)
  },
  get(uid) {
    return this.users.find((u) => u.uid === uid)
  },
  has(username) {
    return this.users.some((u) => u.username === username)
  },
  add({ username, password }) {
    const newUser = { uid: this.users.length + 1, username, password }
    this.users.push(newUser)
    return newUser
  },
}
