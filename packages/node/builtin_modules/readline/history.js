/*
 * @Date         : 2024-06-13 19:06:05 星期4
 * @Author       : xut
 * @Description  :
 */
import readline from "node:readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.on("line", (input) => {
  console.log(`收到：${input}`)
  if (input.startsWith("exit")) {
    rl.close()
  }
})

// 监听 'history' 事件
rl.on("history", (history) => {
  if (history.length > 0) {
    rl.prompt() // 起到换行效果
    console.log("命令历史更新了:")
    history.forEach((item, index) => {
      console.log(`${index + 1}: ${item}`)
    })
  }
})
