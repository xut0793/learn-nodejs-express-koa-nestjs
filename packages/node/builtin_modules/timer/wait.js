/*
 * @Date         : 2024-06-17 11:22:13 星期1
 * @Author       : xut
 * @Description  :
 */

import { setTimeout } from "node:timers/promises"

async function cancellableDelay() {
  const controller = new AbortController()
  const { signal } = controller

  // 在1秒后取消计时器，实际项目中可以基于业务逻辑判断进行取消
  // setTimeout(1000).then(() => controller.abort())

  try {
    const result = await setTimeout(5000, "Hello World!", { signal })
    console.log(result) // 预期输出 "Hello World!"，蛤因为提前被取消，不会输出
  } catch (err) {
    console.error("计时器被取消")
  }
}

cancellableDelay()

// import { scheduler } from "node:timers/promises"

// async function waitForUserInput() {
//   console.log("请在 10 秒内输入（或按 Ctrl+C 退出）...")

//   // 等待 10 秒，但允许进程在此期间退出
//   await scheduler.wait(10000, { ref: false })

//   console.log("时间到！")
// }

// waitForUserInput()
