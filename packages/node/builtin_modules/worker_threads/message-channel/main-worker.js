/*
 * @Date         : 2024-07-27 22:41:44 星期6
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
} from "node:worker_threads"

if (isMainThread) {
  // const { port1, port2 } = new MessageChannel()
  // const worker = new Worker(new URL(import.meta.url), {
  //   workerData: { port: port2 },
  //   transferList: [port2],
  // })
  // port1.on("message", (message) => {
  //   console.log(`main received: `, message)
  // })
  // port1.postMessage("main thread")

  const worker = new Worker(new URL(import.meta.url))
  worker.on("message", (message) => {
    console.log(`main received: `, message)
  })
  worker.postMessage("main message")
} else {
  // const port = workerData.port
  // port.on("message", (message) => {
  //   console.log(`thread ${threadId} received: `, message)
  // })
  // setTimeout(() => port.postMessage("worker thread"), 500)

  parentPort.on("message", (message) => {
    console.log(`thread ${threadId} received: `, message)
  })

  setTimeout(() => parentPort.postMessage("worker thread"), 500)
}
