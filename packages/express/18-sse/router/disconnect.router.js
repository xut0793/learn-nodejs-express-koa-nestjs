/*
 * @Date         : 2024-03-30 16:34:20 星期6
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import { CronJob } from "cron"

export const router = Router()

let count = 0
const connectPools = new Set()
const job = CronJob.from({
  cronTime: "0/1 * * * * *", // 每隔一秒执行
  onTick: () => {
    count++
    for (const conn of connectPools) {
      conn.write(`data:${count}\n\n`)

      if (count >= 5) {
        console.log("🚀 ~ disconnect count:", count)
        conn.write(`event:disconnect\n`)
        conn.write(`data:\n\n`)
      }
    }
  },
  start: false,
})

router.get("/", (req, res) => {
  res.type("text/event-stream")
  connectPools.add(res)
  console.log("🚀 ~ 新增一个新连接...", connectPools.size)

  if (!job.running) {
    job.start()
  }

  req.on("close", () => {
    connectPools.delete(res)
    console.log("🚀 ~ 删除一个连接...", connectPools.size)
  })
})
