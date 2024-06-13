/*
 * @Date         : 2024-06-13 20:45:00 星期4
 * @Author       : xut
 * @Description  :
 */
import readline from "node:readline/promises"

async function main() {
  // 使用 process.stdin 创建接口实例，这里 stdin 作为输入流
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  // AbortSignal 是全局变量
  const signal = AbortSignal.timeout(5_000) // 5s 超时

  signal.addEventListener(
    "abort",
    () => {
      console.log("The food question timed out")
      rl.close()
    },
    { once: true }
  )

  const answer = await rl.question("What is your favorite food? ", { signal })
  console.log(`Oh, so your favorite food is ${answer}`)
}

main()
