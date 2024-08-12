/*
 * @Date         : 2024-07-28 00:16:37 星期0
 * @Author       : xut
 * @Description  :
 */
import { BroadcastChannel, Worker } from "node:worker_threads"

const channel = new BroadcastChannel("custom_channel")

channel.onmessage = (evt) => {
  console.log("main thread received: ", evt.data)

  channel.postMessage("main thread send message")
}

const worker1 = new Worker("./worker1.js")
const worker2 = new Worker("./worker2.js")
