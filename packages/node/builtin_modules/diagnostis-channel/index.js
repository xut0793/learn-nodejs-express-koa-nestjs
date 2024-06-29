/*
 * @Date         : 2024-06-28 19:51:04 星期5
 * @Author       : xut
 * @Description  :
 */
import diagnostics_channel from "node:diagnostics_channel"
import { scheduler } from "node:timers/promises"

async function main() {
  const channel = diagnostics_channel.channel("channelName")

  function onMessage(message, name) {
    console.log(`Received message on ${name}:`, message)
    // Received message on channelName: { some: 'data' }
  }

  diagnostics_channel.subscribe("channelName", onMessage)

  if (channel.hasSubscribers) {
    channel.publish({
      some: "data",
    })
  }

  // 等待 5 秒后，取消订阅
  await scheduler.wait(3000, { ref: false })

  diagnostics_channel.unsubscribe("channelName", onMessage)

  console.log("通道没有订阅者: ", channel.hasSubscribers) // false
}

main()
