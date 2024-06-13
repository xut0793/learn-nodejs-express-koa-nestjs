/*
 * @Date         : 2024-06-13 20:25:30 星期4
 * @Author       : xut
 * @Description  :
 */
import readline from "node:readline/promises"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function main() {
  // 使用 question 方法提示用户输入并等待用户的回答
  const name = await rl.question("What is your name? ")
  console.log(`Hello, ${name}!`)
  // 不要忘记关闭 readline.Interface 实例！
  rl.close()
}

main()
