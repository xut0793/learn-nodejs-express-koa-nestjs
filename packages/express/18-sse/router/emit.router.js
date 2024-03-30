/*
 * @Date         : 2024-03-30 15:28:59 星期6
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import { EventEmitter } from "node:events"

export const router = Router()
export class ServerSendEvent extends EventEmitter {}

const sse = new ServerSendEvent()
let count = 0
const connectPools = new Set()
sse.on("SSE", (count) => {
  for (const conn of connectPools) {
    conn.write(`data:${count}\n\n`)
  }
})

router.get("/", (req, res) => {
  res.type("text/event-stream")
  connectPools.add(res)
  console.log("🚀 ~ 新增一个新连接...", connectPools.size)

  req.on("close", () => {
    connectPools.delete(res)
    console.log("🚀 ~ 删除一个连接...", connectPools.size)
  })
})

router.get("/emit", (req, res) => {
  sse.emit("SSE", count++)
  res.end()
})
