/*
 * @Date         : 2024-06-25 19:08:47 星期2
 * @Author       : xut
 * @Description  :
 */
import { EventEmitter } from "node:events"

const emitter = new EventEmitter()

emitter.on("event", () => {
  console.log("on A")
})

emitter.addListener("event", () => {
  console.log("add B")
})

emitter.once("event", () => {
  console.log("once C")
})

emitter.prependListener("event", () => {
  console.log("prepend D")
})

emitter.prependOnceListener("event", () => {
  console.log("prepend once E")
})

console.log("--------1------------")
emitter.emit("event")
console.log("--------2-----------")
emitter.emit("event")
console.log("--------3-----------")
emitter.emit("event")

// 输出
// --------1------------
// prepend once E
// prepend D
// on A
// add B
// once C
// --------2-----------
// prepend D
// on A
// add B
// --------3-----------
// prepend D
// on A
// add B
