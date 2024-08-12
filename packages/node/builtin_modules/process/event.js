/*
 * @Date         : 2024-07-19 09:12:50 星期5
 * @Author       : xut
 * @Description  :
 */
import process from "node:process"

// // 绑定 rejectionHandled 事件监听
// process.on("rejectionHandled", (promise) => {
//   console.log(
//     "C: 先前未处理的 rejected，现已被处理",
//     promise instanceof Promise
//   )
// })

// process.on("unhandledRejection", (reason, promise) => {
//   console.log(
//     "A: 未被处理的 rejected:",
//     promise instanceof Promise,
//     "reason:",
//     reason
//   )
// })

// function mockQueryDB(query) {
//   return new Promise((resolve, reject) => {
//     // 模拟查询失败
//     reject(new Error("Query failed"))
//   })
// }

// // 执行查询，但是忘记了立即捕获可能出现的 rejected 错误，但获取了 rejected 句柄
// const promise = mockQueryDB("SELECT * FROM users")

// // 延迟一段时间后给 Promise 添加 catch 处理
// setTimeout(() => {
//   promise.catch((error) => console.log("B: 延迟处理 rejected:", error.message))
// }, 100)

// process.on("unhandledRejection", (err, promise) => {
//   console.trace("unhandledRejection", err)
// })
// process.on("uncaughtException", (err, origin) => {
//   console.log("uncaughtException", origin)
// })
process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log("uncaughtExceptionMonitor", origin, err.message)
})
Promise.reject(new Error("from promise"))

setTimeout(() => {
  console.log("This will still run.")
}, 500)

// 故意引发一个未被捕获的异常
// function test() {
//   throw new Error("哎呀，出错了！")
// }

// test()

console.log("This will not run.")
