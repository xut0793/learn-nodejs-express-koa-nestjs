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
const connectPools = new Map()

sse.on("SSE", (uid, count) => {
  const conns = connectPools.get(uid)

  for (const conn of conns) {
    conn.write(`data:${uid}:${count}\n\n`)
  }

  gotActivity()
})

let keepaliveTimer = null
const keepaliveSecond = 25 // 因为客户端设置了20s，所以服务端设置稍长一点，由客户端优先保活
function gotActivity() {
  if (keepaliveTimer) {
    clearTimeout(keepaliveTimer)
  }

  if (connectPools.size === 0) return

  keepaliveTimer = setTimeout(() => {
    console.log("🚀 ~ heartbeat ~")
    Array.from(connectPools.values()).forEach((conns) => {
      conns.forEach((conn) => {
        conn.write(":heartbeat")
      })
    })
  }, keepaliveSecond * 1000)
}

router.get("/", (req, res) => {
  const uid = req.query.uid

  if (!uid) {
    res.status(403).end()
    return
  }
  if (connectPools.has(uid)) {
    const arr = connectPools.get(uid)
    connectPools.set(uid, [...arr, res])
  } else {
    connectPools.set(uid, [res])
  }

  res.type("text/event-stream")
  gotActivity()
  console.log("🚀 ~ 新增一个新连接...", connectPools.size)

  req.on("close", () => {
    connectPools.delete(uid)
    console.log("🚀 ~ 删除一个连接...", connectPools.size)
  })
})

router.get("/emit", (req, res) => {
  const uid = req.query.uid
  if (!uid) {
    res.status(403).end()
    return
  }
  sse.emit("SSE", uid, count++)
  res.end()
})
