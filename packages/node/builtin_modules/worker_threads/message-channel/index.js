/*
 * @Date         : 2024-07-27 22:29:15 星期6
 * @Author       : xut
 * @Description  :
 */
import { Worker, MessageChannel } from "node:worker_threads"

const { port1, port2 } = new MessageChannel()

const worker1 = new Worker("./worker1.js", {
  workerData: { port: port1 },
  transferList: [port1],
})

const worker2 = new Worker("./worker2.js", {
  workerData: { port: port2 },
  transferList: [port2],
})
