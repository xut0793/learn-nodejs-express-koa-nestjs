/*
 * @Date         : 2024-06-28 20:46:33 星期5
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { subscribe, tracingChannel, channel } from "node:diagnostics_channel"

// subscribe(
//   "http.server.request.start",
//   ({ request, response, socket, server }, name) => {
//     console.log("name >>>", name)
//     console.log("request url >>>", request.method, request.url)
//   }
// )

// const server = createServer((req, res) => {
//   res.end("Hello Channel!")
// })

// server.listen(3000, () => {
//   console.log("Server running at http://localhost:3000/")
// })

/**
 * 相当于同进创建了
 */
// const tc = tracingChannel("my-channel")

// subscribe("tracing:my-channel:start", (message, name) => {
//   console.log(name, message)
// })

// tc.start.publish({ foo: "bar" })
// subscribe("tracing:plugin:start", (message, name) => {
//   console.log(name, message)
// })

// subscribe("tracing:plugin:end", (message, name) => {
//   console.log(name, message)
// })

// // const channelStart = channel("trace:plugin:start")
// // const channelEnd = channel("trace:plugin:end")

// const tc = tracingChannel("plugin")

// function plugin() {
//   console.time("plugin")
//   // channelStart.publish({ timestamp: Date.now() })
//   tc.start.publish({ timestamp: Date.now() })

//   for (let i = 0; i < 10000; i++) {}

//   // channelEnd.publish({ timestamp: Date.now() })
//   tc.end.publish({ timestamp: Date.now() })
//   console.timeEnd("plugin")
// }

// plugin()

const tc = tracingChannel({
  start: channel("tracing:module:function:a:start"),
})

function plugin() {
  tc.init({ foo: "bar" })
}

subscribe("tracing:module:function:a", (message, name) => {
  console.log(name, message)
})

plugin()
