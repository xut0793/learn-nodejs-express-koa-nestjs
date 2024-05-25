/*
 * @Date         : 2024-04-28 19:48:54 星期0
 * @Author       : xut
 * @Description  :
 */
import Redis from "ioredis"

const FIX_WINDOW_SIZE = 60 // second
const FIX_WINDOW_MAX_REQUEST = 100

const redisClient = new Redis(6379)

export const fixedWindowMiddleware = async (req, res, next) => {
  const redisKey = `ratelimit:${req.ip}`
  const curCount = await redisClient.get(redisKey)

  if (!curCount) {
    // setex(key, expire, value)
    await redisClient.setex(redisKey, FIX_WINDOW_SIZE, 1)
    next()
    return
  }
  if (Number(curCount) < FIX_WINDOW_MAX_REQUEST) {
    await redisClient.incr(redisKey)
    next()
  } else {
    res.status(429).send("you have too many requests")
  }
}
