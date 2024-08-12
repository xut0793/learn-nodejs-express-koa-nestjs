/*
 * @Date         : 2024-07-27 23:00:13 星期6
 * @Author       : xut
 * @Description  :
 */
import {
  isMainThread,
  Worker,
  MessageChannel,
  workerData,
  threadId,
  parentPort,
  receiveMessageOnPort,
} from "node:worker_threads"

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url))

  let count = 0
  let interval = setInterval(() => {
    worker.postMessage("main message: " + ++count)

    if (count >= 10) {
      clearInterval(interval)
    }
  }, 500)
} else {
  // 自动接收，或者说被动接收
  // parentPort.on("message", (message) => {
  //   console.log(`thread ${threadId} received: `, message)
  // })

  // 主动接收，每隔二秒读取一次消息
  let timer = setInterval(() => {
    const message = receiveMessageOnPort(parentPort)

    if (message) {
      console.log(`thread ${threadId} received: `, message)
    } else {
      clearInterval(timer)
    }
  }, 2000)

  // parentPort.start()
  // start 猜测是为了对齐 web MessagePort 的 API。在 nodejs 中感觉没有用。
  // 在 web MessagePort 的描述中，如果 port.onmessage 方法调用会自动开启消息传送；如果是 port.addEventListener('message', cb) 形式，则需要调用 port.start 手动开启消息传送
  // 参考链接：https://developer.mozilla.org/zh-CN/docs/Web/API/MessagePort/start
}
