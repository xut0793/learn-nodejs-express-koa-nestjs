/*
 * @Date         : 2024-03-15 14:22:33 星期5
 * @Author       : xut
 * @Description  :
 */
import { randomBytes, randomInt } from "node:crypto"

/**
 * 生成随机字符串
 *
 * 利用十六进制表示字符串。所以字符串长度  len * 4 / 8 = size，即 randomBytes(size) 的参数，表示要生成的字节数
 * 所以 len 最好是8的倍数
 * @param {number} len 字符串长度
 * @return {string}
 */
export function genRandomString(len) {
  const size = Math.floor((len * 4) / 8)
  return randomBytes(size).toString("hex")
}

export const petModel = {
  pets: [
    // { id: 1, name: "welsh", type: "corgi", quantity: 0, uid: 1 }
  ],

  getAll(uid) {
    return this.pets.filter((p) => p.uid === uid)
  },
  get(id) {
    return this.pets.find((u) => u.id === id)
  },
  delete(id) {
    const idx = this.pets.findIndex((p) => p.id === id)

    if (idx > -1) {
      this.pets.splice(idx, 1)
    }
  },
  add(pet) {
    const newPet = { id: this.pets.length + 1, ...pet }
    this.pets.push(newPet)
    return newPet
  },
  update(id, params) {
    const idx = this.pets.findIndex((p) => p.id === id)

    if (idx > -1) {
      const pet = this.pets[idx]
      const newPet = {
        ...pet,
        ...params,
        id,
      }
      this.pets.splice(idx, 1, newPet)
      return newPet
    }
  },
}

export const userModel = {
  users: [{ uid: 1, username: "root", password: "123" }],
  getAll() {
    return this.users
  },
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

export const clientModel = {
  clients: [
    {
      id: "123",
      name: "test_client",
      secret: "123",
      redirectUri: "http://localhost:9001/api/oauth2/redirect",
      uid: 1,
    },
  ],
  add(client) {
    const newClient = {
      id: genRandomString(8),
      secret: genRandomString(16),
      name: client.name,
      uid: client.uid,
    }
    this.clients.push(newClient)
    return newClient
  },
  getAll() {
    return this.clients
  },
  get(id) {
    return this.clients.find((i) => i.id === id)
  },
  check({ id, secret, redirectUri }) {
    return this.clients.find((i) => i.id === id && i.secret === secret)
  },
}

export const codeModel = {
  codeList: [
    // {code, uid, clientId, redirectUri}
  ],
  add(codeInfo) {
    this.codeList.push(codeInfo)
  },
  get(code) {
    return this.codeList.find((i) => i.code === code)
  },
  delete(code) {
    const idx = this.codeList.findIndex((i) => i.code === code)
    if (idx > -1) {
      this.codeList.splice(idx, 1)
    }
  },
}

export const tokenModel = {
  tokenList: [
    // {token, uid, clientId}
  ],
  add(tokenInfo) {
    this.tokenList.push(tokenInfo)
  },
  get(token) {
    return this.tokenList.find((i) => i.token === token)
  },
}
