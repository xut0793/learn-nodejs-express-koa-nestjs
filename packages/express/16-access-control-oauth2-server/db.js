/**
 * 此部分实际应该用数据库替换功能
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

/**
 * 客户端管理
 */
class ClientStore {
  clients = new Map()

  add(client) {
    if (client.client_id) {
      client.clientId = client.client_id
    } else {
      client.clientId = genRandomString(16)
    }
    this.clients.set(client.clientId, client)
  }
  get(clientId) {
    return this.clients.get(clientId)
  }
  update(client, keys) {
    const clientId = client.clientId
    const oldClient = this.clients.get(clientId)
    const newObj = keys.reduce((ret, key) => {
      ret[key] = client[key]
      return ret
    }, {})
    this.clients.set(clientId, { ...oldClient, ...newObj })
  }
  /**
   * 删除客户端的同时，需要删除该客户端的 token
   * @param {*} clientId
   */
  delete(clientId) {
    // deleteTokenByClientId(clientId)
    this.clients.delete(clientId)
  }
}

/**
 * 凭证管理
 */
class TokenStore {
  tokens = new Map()

  _find(key, value) {
    return Array.from(this.tokens.values()).filter((t) => t[key] === value)
  }
  add(token) {
    const tokenId = genRandomString(16)
    this.tokens.set(tokenId, { ...token, tokenId })
  }

  findByAccessToken(accessToken) {
    return this._find("accessToken", accessToken)?.[0]
  }

  findByRefreshToken(refreshToken) {
    return this._find("refreshToken", refreshToken)?.[0]
  }

  findByClientId(clientId) {
    return this._find("clientId", clientId)
  }

  deleteByRefreshToken(refreshToken) {
    const token = this.findByRefreshToken(refreshToken)

    if (token) {
      this.tokens.delete(token.tokenId)
    }

    return token
  }

  deleteByAccessToken(accessToken) {
    const token = this.findByAccessToken(accessToken)

    if (token) {
      this.tokens.delete(token.tokenId)
    }
  }

  deleteByClientId(clientId) {
    const tokenArr = this.findByClientId(clientId)

    for (const token of tokenArr) {
      this.tokens.delete(token.tokenId)
    }
  }

  deleteByClientAndGrantType(clientId, grantType) {
    const clientTokenArr = this.findByClientId(clientId)
    const grantTypeTokenArr = clientTokenArr.filter(
      (t) => t.grantType === grantType
    )

    for (const token of grantTypeTokenArr) {
      this.tokens.delete(token.tokenId)
    }
  }
}

/**
 * 用户管理
 */
class UserStore {
  users = new Map()

  add(user) {
    const uid = genRandomString(16)
    this.users.set(uid, { ...user, uid })
  }

  get(uid) {
    this.users.get(uid)
  }

  findByUsername(username) {
    return Array.from(this.users.values()).find((u) => u.username === username)
  }
}

export const clientStore = new ClientStore()
export const tokenStore = new TokenStore()
export const userStore = new UserStore()
