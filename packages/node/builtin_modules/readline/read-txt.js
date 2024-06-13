/*
 * @Date         : 2024-06-13 18:59:36 星期4
 * @Author       : xut
 * @Description  :
 */
import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"

const fileStream = createReadStream("example.txt")
const rl = createInterface({
  input: fileStream,
  // output: process.stdout,
  crlfDelay: Infinity,
})

// 如果 rl 实例时已经定义了输出，line 事件监听如果没有额外逻辑，可以不用监听，会自动输出到控制台
// 如果一定要通过 line 事件监听，那么在 rl 实例时可以不伟入 output。
// 就是说，如果想要文件原样输出，line 事件和 output 二选一即可。
// rl.on("line", (line) => {
//   console.log(line)
// })

// 逐行读取的另一种方式
for await (const line of rl) {
  console.log(line)
}

rl.on("close", () => {
  console.log("===========文件已全部读取===========")
})
