/*
 * @Date         : 2024-07-22 09:36:03 星期1
 * @Author       : xut
 * @Description  :
 */
// console.log("立即执行")

// process.nextTick(() => {
//   console.log(
//     "process.nextTick() 这将在下一个事件循环迭代中运行，但在任何I/O事件之前"
//   )
// })

// queueMicrotask(() => {
//   console.log("queueMicrotask() 当前事件循环帧的微任务队列中运行")
// })

import fs from "node:fs"

console.log("console.log 输出信息\n")

process.stdout.write("process.stdout.write 输出信息\n")

fs.writeSync(
  process.stdout.fd,
  "fs.writeSync 结合 process.stdout.fd 输出信息\n",
  null,
  "utf8"
)
