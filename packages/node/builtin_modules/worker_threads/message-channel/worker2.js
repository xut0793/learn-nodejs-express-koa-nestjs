/*
 * @Date         : 2024-07-27 22:29:31 星期6
 * @Author       : xut
 * @Description  :
 */
import { workerData, threadId } from "node:worker_threads"

const messagePort = workerData.port

messagePort.on("message", (message) => {
  console.log(`thread ${threadId} received: `, message)
})

setTimeout(() => {
  messagePort.postMessage("worker2")
}, 1000)
