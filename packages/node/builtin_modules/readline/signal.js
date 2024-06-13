/*
 * @Date         : 2024-06-13 19:56:42 星期4
 * @Author       : xut
 * @Description  : 以下内容，在 windows 系统无效，仅作参考。
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

// TODO: windows 上似乎不行？？
console.log(`脚本正在运行在进程号: ${process.pid}`)
console.log("你可以再开一个终端，然后使用以下命令：")
console.log("   暂停 SIGTSTP：kill -20 [pid]")
console.log("   继续 SIGCONT：kill -18 [pid]")
console.log("   退出 SIGINT：kill -2 [pid]")

// windows 下 ctrl+z 没有用
rl.on("SIGTSTP", () => {
  // 当用户按下Ctrl+Z 时，执行的逻辑
  console.log("收到 SIGCONT 信号，暂停中...")

  // 这里可以添加暂停前需要执行的代码，比如资源的释放、状态的保存
})

// 监听 'SIGCONT' 信号
process.on("SIGCONT", () => {
  console.log("收到 SIGCONT 信号，进程将继续执行。")
  // 在这里添加任何你希望在进程继续执行时进行的操作
})

rl.on("SIGINT", () => {
  console.log("收到 SIGINT 信号，程序退出前，执行清理...")
  // 这里可以放置清理资源的代码，比如关闭文件、数据库连接等
  // 清理完成后退出程序
  process.exit(0)
})

// 当用户试图通过 Ctrl+C 退出时，我们不会立即结束程序，而是询问用户是否确实希望退出。
// 如果用户回答"yes"，则程序结束；否则，程序不会结束，用户可以继续之前的操作。
// rl.on("SIGINT", () => {
//   rl.question("确定要退出吗？(yes/no) ", (answer) => {
//     if (answer.match(/^y(es)?$/i)) rl.close()
//     else console.log("继续操作...")
//   })
// })
