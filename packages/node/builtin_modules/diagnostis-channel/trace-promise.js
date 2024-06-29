/*
 * @Date         : 2024-06-29 12:24:32 星期6
 * @Author       : xut
 * @Description  :
 */
import { tracingChannel, subscribe } from "node:diagnostics_channel"

async function fetchData(url) {
  // 模拟从网路获取数据的延迟
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url === "http://example.com") {
        resolve("data") // 假设获取数据成功
      } else {
        reject(new Error("Invalid URL")) // 假设URL无效导致数据获取失败
      }
    }, 1000)
  })
}

const tc = tracingChannel("promiseFn")

tc.subscribe({
  start(message) {
    console.log("🚀 ~ tracingChannel start ~ message:", message)
  },
  end(message) {
    console.log("🚀 ~ tracingChannel end ~ message:", message)
  },
  asyncStart(message) {
    console.log("🚀 ~ tracingChannel asyncStart ~ message:", message)
  },
  asyncEnd(message) {
    console.log("🚀 ~ tracingChannel asyncEnd ~ message:", message)
  },
  error(message) {
    console.log("🚀 ~ tracingChannel error ~ message:", message)
  },
})

// 订阅 promiseFn 跟踪通道的事件
subscribe("tracing:promiseFn:start", (message, name) => {
  console.log(name, message)
})
subscribe("tracing:promiseFn:end", (message, name) => {
  console.log(name, message)
})
subscribe("tracing:promiseFn:asyncStart", (message, name) => {
  console.log(name, message)
})
subscribe("tracing:promiseFn:asyncEnd", (message, name) => {
  console.log(name, message)
})
subscribe("tracing:promiseFn:error", (message, name) => {
  console.log(name, message)
})

// 使用 tracePromise 来跟踪 fetchData 函数
tc.tracePromise(
  fetchData,
  { description: "Fetching data" }, // context
  null, // thisArg
  "http://example.com" // args
)
  .then((data) => {
    console.log("Fetched data:", data)
  })
  .catch((error) => {
    console.error("Error fetching data:", error)
  })
