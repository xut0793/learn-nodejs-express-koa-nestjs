/*
 * @Date         : 2024-07-28 00:16:52 星期0
 * @Author       : xut
 * @Description  :
 */
import { BroadcastChannel, threadId } from "node:worker_threads"

const channel = new BroadcastChannel("custom_channel")

channel.onmessage = (evt) => {
  console.log(`thread ${threadId} received: `, evt.data)
}
