/*
 * @Date         : 2024-06-25 10:45:29 星期2
 * @Author       : xut
 * @Description  :
 */
import { EventEmitter } from "node:events"

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter()
const listener = (a, b) => {
  console.log("an event occurred!", a, b)

  return a + b
}

myEmitter.on("event", listener)

const result1 = myEmitter.emit("event", 1, 2) // an event occurred! 1 2
console.log("🚀 ~ result1:", result1) // true

myEmitter.off("event", listener)

const result2 = myEmitter.emit("event", 1, 2) // 无任务输出
console.log("🚀 ~ result2:", result2) // false
