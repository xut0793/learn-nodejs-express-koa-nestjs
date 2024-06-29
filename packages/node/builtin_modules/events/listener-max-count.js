/*
 * @Date         : 2024-06-25 21:04:38 星期2
 * @Author       : xut
 * @Description  :
 */
import event from "node:events"

const emitter = new event.EventEmitter()

console.group("base")
console.log("event.defaultMaxListeners ", event.defaultMaxListeners) // 10
console.log("event.getMaxListeners() ", event.getMaxListeners(emitter)) // 10
console.log("emitter.getMaxListeners() ", emitter.getMaxListeners()) // 10
console.groupEnd("base")

console.group("setMaxListeners(20)")
event.setMaxListeners(20)
console.log("event.defaultMaxListeners ", event.defaultMaxListeners) // 20
console.log("event.getMaxListeners() ", event.getMaxListeners(emitter)) // 20
console.log("emitter.getMaxListeners() ", emitter.getMaxListeners()) // 20
console.groupEnd("setMaxListeners(20)")

console.group("setMaxListeners(20, emitter)")
event.setMaxListeners(30, emitter)
console.log("event.defaultMaxListeners ", event.defaultMaxListeners) // 20
console.log("event.getMaxListeners() ", event.getMaxListeners(emitter)) // 30
console.log("emitter.getMaxListeners() ", emitter.getMaxListeners()) // 30
console.groupEnd("setMaxListeners(20, emitter)")

// 输出
// base
//   event.defaultMaxListeners  10
//   event.getMaxListeners()  10
//   emitter.getMaxListeners()  10
// setMaxListeners(20)
//   event.defaultMaxListeners  20
//   event.getMaxListeners()  20
//   emitter.getMaxListeners()  20
// setMaxListeners(20, emitter)
//   event.defaultMaxListeners  20
//   event.getMaxListeners()  30
//   emitter.getMaxListeners()  30
