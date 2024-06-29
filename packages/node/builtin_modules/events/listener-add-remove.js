/*
 * @Date         : 2024-06-26 11:02:59 星期3
 * @Author       : xut
 * @Description  :
 */
import { EventEmitter } from "node:events"

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter()

const listenerA = () => console.log("A")
const listenerB = () => console.log("B")

// 注意回调函数的入参，当前事件名称 eventName，和监听器 listener
myEmitter.once("newListener", (eventName, listener) => {
  console.log("newListener: ", eventName)

  if (eventName === "event") {
    // Insert a new listener in front
    myEmitter.on("event", listenerB)
  }
})

myEmitter.on("event", listenerA)
myEmitter.on("event", () => {
  console.log("C")
})

myEmitter.on("removeListener", (eventName, listener) => {
  console.log("removeListener: ", eventName)
})

myEmitter.emit("event")

console.log("count: ", myEmitter.listenerCount("event"))
myEmitter.off("event", listenerB)
console.log("removed B count: ", myEmitter.listenerCount("event"))
myEmitter.removeAllListeners("event")
console.log("removed all count: ", myEmitter.listenerCount("event"))
// Prints:
// newListener:  event
// B
// A
// C
// count:  3
// removeListener:  event
// removed B count:  2
// removeListener:  event
// removeListener:  event
// removed all count:  0
