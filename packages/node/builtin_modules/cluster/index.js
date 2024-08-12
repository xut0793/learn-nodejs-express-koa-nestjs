/*
 * @Date         : 2024-07-28 16:36:01 星期0
 * @Author       : xut
 * @Description  :
 */
import cluster from "node:cluster"
import { cpus } from "node:os"
import { createServer } from "node:http"

// 方式一
// if (cluster.isPrimary) {
//   console.log(`Primary ${process.pid} is running`)

//   // Fork workers
//   const cpusLength = cpus().length
//   console.log("🚀 ~ cpusLength:", cpusLength)
//   for (let i = 0; i < cpusLength; i++) {
//     cluster.fork()
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`)
//   })
// } else {
//   // 工作进程可以共享任何 TCP 连接。
//  // 在本例子中，共享的是 HTTP 服务器。
//   createServer((req, res) => {
//     res.writeHead(200)
//     res.end(`hello world from process ${process.pid} \n`)
//   }).listen(8000)

//   console.log(`Worker ${process.pid} started`)
// }

// 方式二
cluster.on("setup", (setting) => {
  console.log("on setup: ", setting)
})

cluster.setupPrimary({
  exec: "worker.js",
  silent: true,
})

// 设置轮询模式分配请求
cluster.schedulingPolicy = cluster.SCHED_RR // cluster.SCHED_NONE

// Fork workers
const cpusLength = cpus().length
console.log("🚀 ~ cpusLength:", cpusLength)
for (let i = 0; i < cpusLength; i++) {
  cluster.fork()
}
