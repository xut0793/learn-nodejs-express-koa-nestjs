/*
 * @Date         : 2024-06-13 19:30:09 星期4
 * @Author       : xut
 * @Description  :
 */
import readline from "node:readline"

let timer = null
const rl = readline.createInterface({
  input: process.stdin,
  output: process.output,
})

rl.on("line", (input) => {
  if (input === "pause") {
    rl.pause()
    return
  }

  if (input.startsWith("exit")) {
    console.log("input === exit", input === "exit")
    rl.close()
    return
  }

  console.log(`收到：${input}`)
})

// rl.close() 方法调用也会触发 pause 事件。
rl.on("pause", () => {
  console.log("暂停输入，5秒后继续接收输入...")

  timer = setTimeout(() => {
    rl.resume()
  }, 5000)
})

rl.on("resume", () => {
  console.log("输入流恢复了，继续接收用户的输入...")
})

rl.on("close", () => {
  console.log("关闭输入，程序将退出")
  clearTimeout(timer)
  process.exit(0)
})
