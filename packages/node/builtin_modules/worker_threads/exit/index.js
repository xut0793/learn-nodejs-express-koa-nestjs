import { Worker } from "node:worker_threads"

const worker = new Worker("./worker.js")

worker.on("message", (message) => {
  console.log(`main thread received: `, message)
})

worker.on("exit", (exitCode) => {
  console.log("on exit: ", exitCode)
})

setTimeout(() => {
  worker.terminate()
}, 10)
