/*
 * @Date         : 2024-06-29 14:11:48 星期6
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { subscribe, channel } from "node:diagnostics_channel"
import { scheduler } from "node:timers/promises"

const REQUEST_CHANNEL = "http:server:request"

// 创建一个存储对象保存请求的时间
const store = {
  count: 0,
  run(ctx, publish) {
    // ctx 为 bindStore(store, transfer) 中 transfer 函数返回结棍
    this.count += ctx.count

    console.log(`累计数据库查询 ${this.count} 次`)
    // publish = () => {
    //   this.publish(data);
    //   return ReflectApply(fn, thisArg, args);
    // };
    publish()
  },
}

const requestChannel = channel(REQUEST_CHANNEL)

requestChannel.bindStore(store, (ctx) => {
  return ctx
})

const server = createServer(async (req, res) => {
  await scheduler.wait(2000)

  // 假设 handleRequest 是一个异步函数，它内部可能执行多个数据库查询
  await handleRequest(req)

  res.end("Hello Channel BindStore")

  const count = store.count
  console.log(`This request executed ${count} queries.`)

  requestChannel.publish({ count: count })
})

server.listen(3000, () => {
  console.log("🚀 ~ Server running at http://localhost:3000/")
})

/**
 * 另一个查询模块
 */
async function handleRequest(req) {
  let count = random(1, 5)
  console.log("🚀 ~ handleRequest ~ count:", count)

  for (let i = 0; i < count; i++) {
    await makeQuery()
  }

  // 假设这是一个数据库查询函数
  const reqChannel = channel(REQUEST_CHANNEL)
  reqChannel.runStores({ count: ++count }, () => {})
}

async function makeQuery() {
  await scheduler.wait(2000)
}

function random(min, max) {
  return min + Math.floor(Math.random() * (max - min))
}

/**
 * 另一个监听模块文件
 */
// 如果通道名称已经存在，则会直接返回该通道实例，此时可以获取到绑定的 store
const reqChannel = channel(REQUEST_CHANNEL)
console.log(
  "🚀 ~ reqChannel === requestChannel:",
  reqChannel === requestChannel // false
)

subscribe(REQUEST_CHANNEL, (message, name) => {
  console.log(name, message)
})
