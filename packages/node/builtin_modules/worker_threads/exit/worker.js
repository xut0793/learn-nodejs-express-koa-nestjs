import { hrtime } from "node:process"
import { parentPort, threadId } from "node:worker_threads"

// 5s秒定时任务执行完才能退出
setTimeout(() => {
  parentPort.postMessage(`thread ${threadId} done`)
  process.exit(0)
}, 5000)

// 主线程主动关闭worker时，worker子线程里处于等待的宏任务不会再执行了，所以setTimeout里的log也不会打印出来。但是如果是非宏任务，则会在处理完毕后再退出。

let start = hrtime.bigint()
let count = 0
// 进行一亿次计算
for (let i = 0; i < 1e8; i++) {
  count += i
}

let end = hrtime.bigint()

let duration = (end - start) / 1000n / 1000n
parentPort.postMessage(
  `thread ${threadId} calculation done: ${count}, time: ${duration} ms`
)

// 1s【秒】 = 1000ms【毫秒】   1ms【毫秒】 = 1000μs【微秒】    1μs【微秒】 = 1000ns【纳秒】   1ns 【纳秒】= 1000ps【皮秒】
