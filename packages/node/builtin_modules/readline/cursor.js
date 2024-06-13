/*
 * @Date         : 2024-06-13 20:29:06 星期4
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

  console.log('请输入一些文本，按回车继续，输入 "exit" 退出：')

  for await (const line of rl) {
    // 这里使用 for-await-of 循环逐行读取
    if (line === "exit") {
      // 如果用户输入 exit，则退出循环
      rl.close() // 不要忘记关闭 readline 接口
    } else {
      const cursorPos = rl.getCursorPos()
      rl.write(
        `${line}, cursor=${rl.cursor}, line: ${cursorPos.rows}, column: ${cursorPos.cols}`
      )
    }
  }
}

main()
