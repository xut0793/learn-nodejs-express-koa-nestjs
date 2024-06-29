/*
 * @Date         : 2024-06-25 20:18:00 星期2
 * @Author       : xut
 * @Description  :
 */
import { EventEmitter } from "node:events"

const emitter = new EventEmitter()

const logFn = () => console.log("log >>>")

emitter.on("log", logFn)
emitter.once("log", logFn)

console.log("-----------------listeners-------------------")
// 返回事件监听器函数列表，监听器函数为实际代码传入的函数
const listeners = emitter.listeners("log")
console.log("🚀 ~ listeners length:", listeners.length) // 2
console.log("on listener: ", listeners[0] === logFn) // true
console.log("once listener: ", listeners[1] === logFn) // true

console.log("---------------rawListeners------------------")
// 这里的 raw 指的是实际添加到事件监听队列中的函数，所以对于 once 事件，传入的监听器函数会被包装一层后再注册
const rawListeners = emitter.rawListeners("log")
console.log("🚀 ~ raw listeners length:", rawListeners.length) // 2
console.log("on raw listener: ", rawListeners[0] === logFn) // true
console.log("once raw listener: ", rawListeners[1] === logFn) // false

console.log("-----------logFnWrapper.listener---------------")
// once 会对传入的原始监听器进行一层包装后，再注册为监听器 listener，这个监听器也称为 封装器 onceWrapper。
// 可以从 onceWrapper.listener 获得原始监听器函数。
const logFnWrapper = rawListeners[1]
console.log("logFnWrapper.listener: ", logFnWrapper.listener === logFn) // true

// 原始函数执行多次仍正常
logFnWrapper.listener() // log >>>
logFnWrapper.listener() // log >>>

console.log("----------listenerCount 1------------")
const count1 = emitter.listenerCount("log")
console.log("🚀 ~ count 1:", count1) // 2
const countLogFn = emitter.listenerCount("log", logFn)
console.log("🚀 ~ countLogFn:", countLogFn)

console.log("------onceWrapper----------")
// 但如果执行 once 事件的包装函数 onceWrapper，那么行为表现与 once 事件触发一致，只会被执行一次。
logFnWrapper() // log >>>
logFnWrapper() // 没有输出

console.log("---------emit----------")
emitter.emit("log") // 此时只会执行 on 方法注册的监听器，输出一次 log >>>

console.log("----------listenerCount 2------------")
const count2 = emitter.listenerCount("log")
console.log("🚀 ~ count 2:", count2) // 1
