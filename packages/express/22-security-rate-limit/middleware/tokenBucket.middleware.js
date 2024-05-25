/*
 * @Date         : 2024-04-28 19:50:40 星期0
 * @Author       : xut
 * @Description  :
 */
import Redis from "ioredis"

const RATE = 1000 // 生成令牌的速率
const CAPACITY = 5 // 令牌桶容量
const redisClient = new Redis(6379)

export const tokenBucketMiddleware = async (req, res, next) => {
  const redisKey = `ratelimit:${req.ip}`
  const now = Date.now()
  const exists = await redisClient.exists(redisKey)

  if (!exists) {
    await redisClient
      .multi()
      .hset(redisKey, "amount", CAPACITY - 1)
      .hset(redisKey, "update_time", now)
      .expire(redisKey, RATE / 1000)
      .exec()
    next()
    return
  }

  const updateTime = await redisClient.hget(redisKey, "update_time")
  const amount = await redisClient.hget(redisKey, "amount")
  // 计算当前距上一个时间间隔内，可以生成多少令牌，并与桶内上次剩余令牌相加，并减掉当前请求消耗的一个令牌
  const newAmount =
    Math.min(CAPACITY, Number(amount) + Math.floor((now - updateTime) * RATE)) -
    1

  if (newAmount >= 0) {
    await redisClient
      .multi()
      .hset(redisKey, "update_time", now)
      .hset(redisKey, "amount", newAmount)
      .expire(redisKey, ((CAPACITY - newAmount) * RATE) / 1000)
      .exec()
    next()
  } else {
    res.status(429).send("you have too many requests")
  }
}
