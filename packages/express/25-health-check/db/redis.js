/*
 * @Date         : 2024-05-28 14:27:16 星期2
 * @Author       : xut
 * @Description  :
 */
import { createClient } from "redis"

const REDIS_CONFIG = {
  port: 6379,
  host: "127.0.0.1",
}

const client = createClient(REDIS_CONFIG.port, REDIS_CONFIG.host)

client.on("connect", () => {
  console.log("Connected to the Redis server.")
})
client.on("end", () => {
  console.log("quitted to the Redis server.")
})
client.on("error", (err) => console.log("Redis Client Error", err))

/**
 * redis 健康检查接口
 */
export function onRedisHealthCheck() {
  return client.status === "ready"
    ? Promise.resolve()
    : Promise.reject(new Error("not ready"))
}

export async function redisConnect() {
  return await client
    .connect()
    .then(() => console.log("mysql connected"))
    .catch((err) => {
      console.error("redis connection error", err.stack)
    })
}

/**
 * quit() 方法将所有运行的命令正确处理后，将quit命令发送到redis服务器，并将其完全正确地结束。就是所谓的优雅退出
 * end()方法不会等到所有的答复都被解析之后才断开和redis的连接，他会立刻断开与数据库的连接
 */
export async function redisDisconnect() {
  return await client
    .quit()
    .then(() => console.log("redis disconnected"))
    .catch((err) =>
      console.error("redis error during disconnection", err.stack)
    )
}

export async function redisGet(key) {
  try {
    if (!key) return null

    let value = await client.get(key)

    try {
      value = JSON.parse(value)
    } catch {
      value = value
    }

    return value
  } catch (err) {
    return Promise.reject(err)
  }
}

export async function redisSet(key, value) {
  try {
    if (!key) throw new Error("key 是必须的")

    if (typeof value === "object") {
      value = JSON.stringify(value)
    }

    await client.set(key, value)
  } catch (error) {
    return Promise.reject(error)
  }
}

export default client
