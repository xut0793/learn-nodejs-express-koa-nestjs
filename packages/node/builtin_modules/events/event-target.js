/*
 * @Date         : 2024-06-28 09:12:35 星期5
 * @Author       : xut
 * @Description  :
 */
// function handler1(event) {
//   console.log(event.type) // Prints 'foo'
//   event.a = 1
// }

// async function handler2(event) {
//   console.log(event.type) // Prints 'foo'
//   console.log(event.a) // Prints 1
// }

// const handler3 = {
//   handleEvent(event) {
//     console.log(event.type) // Prints 'foo'
//   },
// }

// const handler4 = {
//   async handleEvent(event) {
//     console.log(event.type) // Prints 'foo'
//   },
// }

// const target = new EventTarget()

// target.addEventListener("foo", handler1)
// target.addEventListener("foo", handler2)
// target.addEventListener("foo", handler3)
// target.addEventListener("foo", handler4, { once: true })

// const fooEvent = new Event("foo")
// target.dispatchEvent(fooEvent)
// // foo
// // foo
// // 1
// // foo
// // foo

// console.log("--------------------------")
// target.removeEventListener("foo", handler3)

// target.dispatchEvent(fooEvent)
// // foo
// // foo
// // 1

/******************************************************
 * 阻止事件传播
 *************************************************/
// const target = new EventTarget()

// // 第一个事件监听器
// target.addEventListener("myEvent", (event) => {
//   console.log("第一个监听器")
//   // 调用 stopImmediatePropagation 将阻止后续监听器被调用
//   event.stopImmediatePropagation()
// })

// // 第二个事件监听器
// target.addEventListener("myEvent", (event) => {
//   // 这个监听器将不会被执行，因为前一个监听器已经停止了传播
//   console.log("第二个监听器")
// })

// // 触发事件
// const myEvent = new Event("myEvent")
// target.dispatchEvent(myEvent)

// 控制台将只输出：
// 第一个监听器

/******************************************************
 * 取消事件监听
 *************************************************/

// const controller = new AbortController()
// const { signal } = controller

// signal.addEventListener("abort", (event, ...args) => {
//   console.log("addEventListener event >>>", event, args)
// })

// signal.addListener("abort", (...args) => {
//   console.log("on args >>>", args)
// })

// 假设一段时间后，我们决定取消操作
// controller.abort("信号取消", 1, 2, 3)
// addEventListener event >>> {
//   type: 'abort',
//   defaultPrevented: false,
//   cancelable: false,
//   timeStamp: 30.996
// }
// [] 不会接收到后续参数

/******************************************************
 * 事件监听器的参数传递
 *************************************************/

// const eventTarget = new EventTarget()

// // 添加事件监听器
// eventTarget.addEventListener("signup", function onUserSignup(event) {
//   console.log(`User signup with detail: `, event.detail)
// })

// // 触发事件
// const signupEvent = new CustomEvent("signup", {
//   detail: { username: "tom", plan: "premium" },
// })

// eventTarget.dispatchEvent(signupEvent)

/******************************************************
 * 错误处理
 *************************************************/
const target = new EventTarget()

target.addEventListener("foo", () => {
  throw new Error("foo error")
})

target.addEventListener("async-foo", async () => {
  return Promise.reject()
})

// 不会被执行
target.addEventListener("error", (event) => {
  console.log("🚀 ~ target.addEventListener error ~ event:", event.type)
})

// 不会被执行
process.on("error", (err) => {
  console.log("🚀 ~ process.on error ~ args:", err instanceof Error)
})

// 捕获 EventTarget 错误
process.on("uncaughtException", (err) => {
  console.log(
    "🚀 ~ process.on uncaughtException ~ args:",
    err instanceof Error, // throw 时 true， reject 时 false
    err
  )
})

const myEvent = new Event("foo")
target.dispatchEvent(myEvent)

const asyncEvent = new Event("async-foo")
target.dispatchEvent(asyncEvent)
