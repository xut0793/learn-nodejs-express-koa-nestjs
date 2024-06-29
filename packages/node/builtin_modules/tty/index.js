/*
 * @Date         : 2024-06-16 15:13:15 星期0
 * @Author       : xut
 * @Description  :
 */
// const { stdout } = process

// if (stdout.isTTY) {
//   const columns = stdout.columns
//   console.log(`您的终端宽度是: ${columns} 字符`)

//   // 假设我们要打印两列数据
//   const columnWidth = Math.floor(columns / 2)
//   console.log(`名称`.padEnd(columnWidth) + `值`)
//   console.log(`----`.padEnd(columnWidth) + `---`)
//   console.log(`Node.js版本`.padEnd(columnWidth) + `${process.version}`)
// } else {
//   console.log("不是在 TTY 环境下")
// }

const { stdout } = process

function drawProgressBar(percent) {
  const columns = stdout.columns - 10 // 留出空间显示百分比
  const progressWidth = (percent / 100) * columns
  const progressBar = "=".repeat(progressWidth) + ">"
  const emptySpace = " ".repeat(columns - progressWidth)

  stdout.cursorTo(0) // 将光标移回行首
  stdout.write(`[${progressBar}${emptySpace}] ${percent}%`)
}

let percent = 0
const interval = setInterval(() => {
  percent += 5
  drawProgressBar(percent)
  if (percent >= 100) clearInterval(interval)
}, 100)
