/*
 * @Date         : 2024-04-28 19:49:19 星期0
 * @Author       : xut
 * @Description  :
 */
import Redis from "ioredis"

const DURATION = 60
const MAX_REQ_IN_DURATION = 100
const redisClient = new Redis(6379)

export const slidingLogMiddleware = async (req, res, next) => {
  const redisKey = `ratelimit:${req.ip}`
  const durationEnd = Date.now()
  const durationStart = durationEnd - DURATION * 1000
  const exists = await redisClient.exists(redisKey)

  if (!exists) {
    await redisClient
      .multi()
      .zadd(redisKey, durationEnd, durationEnd) // 初始时以当前时间添加时间戳
      .expire(redisKey, DURATION)
      .exec()
    next()
    return
  }
  const re = await redisClient
    .multi()
    .zremrangebyscore(redisKey, 0, durationStart) // 先使用清除过期的数据
    .zcard(redisKey) // 统计当前周期的请求数量
    .expire(redisKey, DURATION)
    .exec()
  if (re[1][1] < MAX_REQ_IN_DURATION) {
    // 若请求数没达到限制，则添加时间戳，score 也设置为时间戳的值
    await redisClient.zadd(redisKey, durationEnd, durationEnd)
    next()
  } else {
    res.status(429).send("you have too many requests")
  }
}
