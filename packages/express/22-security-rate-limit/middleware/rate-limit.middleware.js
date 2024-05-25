/*
 * @Date         : 2024-04-28 19:45:06 星期0
 * @Author       : xut
 * @Description  :
 */
const rateLimit = require("express-rate-limit")

export const rateLimitMiddleware = rateLimit({
  windowMs: 12 * 60 * 60 * 1000, // 12 hour duration in milliseconds
  limit: 5,
  message: "You exceeded 100 requests in 12 hour limit!",
  standardHeaders: true,
  legacyHeaders: false,
})
