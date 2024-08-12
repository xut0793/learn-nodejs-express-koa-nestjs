/*
 * @Date         : 2024-07-27 21:33:49 星期6
 * @Author       : xut
 * @Description  :
 */
import { Worker, setEnvironmentData } from "node:worker_threads"

const worker1 = new Worker("./worker1.js")

setEnvironmentData("foo", { foo: 123 })

const worker2 = new Worker("./worker2.js")

const worker3 = new Worker("./worker3.js")

worker1.on("message", (data) => {
  console.log(`received thread ${worker1.threadId} message: `, data)
})

worker2.on("message", (data) => {
  console.log(`received thread ${worker2.threadId} message: `, data)
})

worker3.on("message", (data) => {
  console.log(`received thread ${worker3.threadId} message: `, data)
})
