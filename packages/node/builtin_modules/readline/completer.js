/*
 * @Date         : 2024-06-13 20:24:05 星期4
 * @Author       : xut
 * @Description  :
 */
import readline from "node:readline"
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: completerFunction,
})

function completerFunction(line) {
  const commands = ["add", "commit", "push"]
  const hits = commands.filter((c) => c.startsWith(line))
  // 如果有匹配项，则显示它们；否则，不显示任何东西。
  return [hits.length ? hits : [], line]
}

rl.question("Enter a git command: ", (answer) => {
  console.log(`Your command was: ${answer}`)
  rl.close()
})
