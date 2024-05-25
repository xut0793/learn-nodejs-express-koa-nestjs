/*
 * @Date         : 2024-04-28 19:43:57 星期0
 * @Author       : xut
 * @Description  :
 */
import express from "express"
// import { rateLimitMiddleware } from './middleware/rate-limit.middleware.js'
// import { slidingWindowMiddleware } from "./middleware/slidingWindow.middleware.js";
// import { slidingLogMiddleware } from "./middleware/slidingLog.middleware.js";
// import { leakyBucketMiddleware } from "./middleware/leakyBucket.middleware.js";
import { tokenBucketMiddleware } from "./middleware/tokenBucket.middleware.js"

const app = express()

// app.use(rateLimitMiddleware)
// app.use(slidingWindowMiddleware);
// app.use(slidingLogMiddleware);
// app.use(leakyBucketMiddleware);
app.use(tokenBucketMiddleware)

app.get("/", (req, res) => {
  res.send("Hello World")
})
app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
