/*
 * @Date         : 2024-06-13 18:51:13 星期4
 * @Author       : xut
 * @Description  :
 */
import readline from "node:readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question("What's your name? ", (name) => {
  // console.log(`Hi ${name}`)
  rl.write(`Hi ${name}`)
  // rl.write(null, { ctrl: true, name: "u" })
  rl.close()
})

// rl.on("close", () => {
//   console.log("已经完成用户输入，程序即将退出。")
//   process.exit(0)
// })
