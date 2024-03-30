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
      conn.write(`id:${count}\n`)
      conn.write(`retry:10000\n`)
      conn.write(`data:数据${count}\n\n`)
    }
  },
  start: false,
})

router.get("/", (req, res) => {
  const lastEventId = req.headers["last-event-id"]
  console.log("🚀 ~ router.get ~ lastEventId:", lastEventId)

  if (lastEventId) {
    count = +lastEventId
  }

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
