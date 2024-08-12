import { BroadcastChannel, threadId } from "node:worker_threads"

const channel = new BroadcastChannel("custom_channel")

channel.onmessage = (evt) => {
  console.log(`thread ${threadId} received: `, evt.data)
}

setTimeout(() => {
  channel.postMessage(`thread ${threadId} send message`)
}, 1000)
