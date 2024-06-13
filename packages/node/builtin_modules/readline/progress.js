import readline from "node:readline/promises"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

/**
 * 定时输出进度条显示
 */
let percentage = 0

// 模拟文件下载进度
function updateProgress() {
  rl.clearLine(0) // 清除当前行
  rl.cursorTo(0) // 将光标移动到行首

  percentage += 10
  rl.write(`Loading... [${percentage}%]`) // 更新进度信息

  if (percentage >= 100) {
    clearInterval(interval)
    rl.close()
  }
}

const interval = setInterval(updateProgress, 1000)
