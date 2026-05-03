# Health Check 健康检查

## What

什么是健康检查，就是快速检测应用程序的运行情况而无需深挖代码。

当应用完成部署之后，如何确定应用已经处于可用状态呢？所以需要做一次应用的健康检查，类比于医生将听诊器放在胸口，听下应用是不是有心跳，如果有心跳，可以确定应用是存活可用的。所以健康检查有时也称为健康心跳检查。

## Why

为什么要在软件工程里使用健康检测？

- 健康检测很容易去实现。简单的只需要应用提供一个调用接口，返回成功即可。更难的问题是你如何去定义健康的数据，返回哪些数据才代表应用是健康的。
- 自动发布平台在发布应用程序时后，自动调用健康检查路由。
- 应用监控系统需要定时调用健康检查路由进行监测，及时预警
- 问题排查，当问题出现时，最首要，也最简单的事情是在无须深挖当前代码的情况下，去调用健康检查接口，通过返回的响应数据去排查问题。

## How

### 如何去定义应用程序的健康度？

如何去定义应用程序的健康度？

- 服务可以响应请求
- 服务可以响应请求，并且连接数据库。
- 服务可以响应请求，连接数据库并且连接其他第三方系统，如 Redis 等。
- 更多...

### Node.js应用如何进行健康检测？

1. 创建一个新的路由（如：healthcheck.routes.js）。
2. 在app.js中注册你的路由。我推荐使用 healthcheck 命名这个路由。
3. 在你的健康检测路由中，如果一切正常，你需要发送一个成功响应。如果你的应用程序不健康，你需要发送一个错误响应。
4. 如果你有的很多微服务，你应该给每个都添加一个健康检测。
5. 如果应用有很多依赖应用，则健康检查接口应该递归调用依赖应用的健康检查接口，只有所有依赖应用都成功响应才算健康，只要有一个应用响应失败，则响应失败。
6. 可选项：添加身份验证以限制对应用的健康检查路由的访问认证。

简单示例

```js
// app.js
import express from "express"
import healthCheckHandler from "./router/health-check.route.js"

const app = express()

// 省略其它代码

app.use("/healthcheck", healthCheckHandler)
```

健康检查路由 `/router/health-check.route.js`

```js
import { Router } from "express"

export const router = Router()

router.get("/", async (req, res) => {
  // optional: add further things to check (e.g. connecting to dababase)
  // 如果应用有很多依赖应用，则健康检查接口应该递归调用依赖应用的健康检查接口，只有所有依赖应用都成功响应才算健康，只要有一个应用响应失败，则响应失败。
  // 比如数据库连接是否正常，redis 连接是否正常等。
  const healthCheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
  }

  try {
    res.status(200).send(healthCheck)
  } catch (e) {
    healthCheck.message = e.message
    res.status(503).send(healthCheck)
  }
})

export default router
```

## 工具

能够提供健康检查的第三方依赖包：如 `Terminus`、`Lightship`、 `Pingdom`、`New Relic`、 `Freshping` 等。

这里以 Terminus 示例：

```sh
pnpm add @godaddy/terminus
```

Terminus 可为你的应用添加健康检查，也提供应用优雅关闭的实现，减少了很多样板代码。你只需提供用于正常关闭的清理逻辑和用于健康检查的健康检查逻辑，terminus 会处理其余部分。下面是一个基本使用模板。

```js
const http = require("http")
const express = require("express")
const { createTerminus } = require("@godaddy/terminus")

const app = express()
gg
app.get("/", (req, res) => {
  res.send("ok")
})

const server = http.createServer(app)

/**
 * 优雅关闭前的清理
 */
function onSignal() {
  console.log("server is starting cleanup")
  // start cleanup of resource, like databases or file descriptors
  // 开始清理资源，比如数据库关闭连接，移除监听的事件句柄等
}

/**
 * 健康检查
 */
async function onHealthCheck() {
  // checks if the system is healthy, like the db connection is live resolves, if health, rejects if not
  // 检查系统是否健康，比如数据库连接是否正常，如果运行正常则解析，如果不运行则拒绝
}

createTerminus(server, {
  signal: "SIGINT",
  healthChecks: { "/healthcheck": onHealthCheck },
  onSignal,
})

server.listen(3000)
```

其中 `createTerminus(server, options)` 中的选项如下：

```js
const options = {
  // health check options
  healthChecks: {
    // a function accepting a state and returning a promise indicating service health,
    // 提供健康检查的处理函数 ，返回 Promise
    "/healthcheck": healthCheck,
    // [optional = false] use object returned from /healthcheck verbatim in response,
    verbatim: true,
    // [optional = false] return stack traces in error response if healthchecks throw errors
    // 如果健康检查抛出错误，则在错误响应中返回堆栈跟踪
    __unsafeExposeStackTraces: true,
  },
  // [optional] whether given health checks routes are case insensitive (defaults to false)
  // 健康检查路由 /healthcheck 不区分大小写，默认 false
  caseInsensitive,

  // [optional = 200] status to be returned for successful healthchecks
  // /healthcheck 接口返回成功时，响应的状态码，默认 200
  statusOk,
  // [optional = { status: 'ok' }] status response to be returned for successful healthchecks
  // /healthcheck 接口返回成功时，响应的对象，默认 { status: 'ok'}
  statusOkResponse,
  // [optional = 503] status to be returned for unsuccessful healthchecks
  // /healthcheck 健康检查接口返回失败时的响应状态码，默认 503
  statusError,
  // [optional = { status: 'error' }] status response to be returned for unsuccessful healthchecks
  // // /healthcheck 接口返回错误时，响应的对象，默认 { status: 'error'}
  statusErrorResponse,

  // cleanup options

  // [optional = 1000] number of milliseconds before forceful exiting
  // 强制退出时延迟时间
  timeout: 1000,
  // [optional = 'SIGTERM'] what signal to listen for relative to shutdown
  // 触发优雅退出的监听信号，默认 SIGTERM
  signal,
  // [optional = []] array of signals to listen for relative to shutdown
  // 触发优雅退出的监听信号，也可以传递多个信息数组，比如 ['SIGTERM', 'SIGINT']
  signals,
  // [optional = false] instead of sending the received signal again without beeing catched, the process will exit(0)
  // 进程退出码使用 0，即 process.exit(0)
  useExit0,

  // [optional = true] whether or not to send failure (503) during shutdown
  // 在关机期间是否发送失败(503)
  sendFailuresDuringShutdown,
  // [optional] called before the HTTP server starts its shutdown
  // 在HTTP服务器开始关闭之前调用的钩子函数，可以在此自定义一些行为
  beforeShutdown,
  // [optional] cleanup function, returning a promise (used to be onSigterm)
  // 优雅关机时，调用的钩子函数，可以在此自定义一些清理行为，返回一个 promise
  onSignal,
  // [optional] called right before exiting
  // 正式关机的钩子函数
  onShutdown,
  // [optional] called before sending each 503 during shutdowns
  // 在关机时，发送每个503之前调用
  onSendFailureDuringShutdown,

  // both

  // [optional] logger function to be called with errors. Example logger call: ('error happened during shutdown', error). See terminus.js for more details.
  // 自定义日志记录器，或者外接日志对象
  logger,
}
```

## 示例

> 参照示例：`@godaddy/terminus` 的使用示例 [@godaddy/terminus example](https://github.com/godaddy/terminus/blob/main/example/index.js)

将健康检查和优雅关机，一起用 `@godaddy/terminus` 实现。

```js
// 入口 index.js
import express from "express"
import http from "node:http"
import { createTerminus } from "@godaddy/terminus"
import {
  onMysqlHealthCheck,
  mysqlConnect,
  mysqlDisconnect,
} from "./db/mysql.js"
import {
  onRedisHealthCheck,
  redisConnect,
  redisDisconnect,
} from "./db/redis.js"
import {
  onMongodbHealthCheck,
  mongodbConnect,
  mongodbDisconnect,
} from "./db/mongodb.js"

const app = express()

app.get("/", (req, res) => {
  setTimeout(() => {
    // 5秒后响应，测试在5秒前就关闭服务，观察是否能响应
    console.log("response GET /")
    res.status(200).json({ status: "success", message: "Hello" })
  }, 5000)
})

/**
 * 健康检查，mysql / redis / mongodb 都已正常连接
 */
async function onHealthCheck() {
  return await Promise.all([
    onMysqlHealthCheck(),
    onRedisHealthCheck(),
    onMongodbHealthCheck(),
  ])
}

/**
 * 优雅关闭，将 mysql / redis / mongodb 断开连接
 */
async function onSignal() {
  console.log("server is starting cleanup")
  await Promise.all([mysqlDisconnect(), redisDisconnect(), mongodbDisconnect()])
}

function onBeforeShutdown() {
  console.log("before shutdown, server will cleanup")
}

function onShutdown() {
  console.log("cleanup finished, server is shutting down")
}

/**
 * 执行顺序：onBeforeShutdown => onSignal => onShutdown
 */
const terminusOptions = {
  healthChecks: {
    "/healthcheck": onHealthCheck,
  },
  signals: ["SIGINT", "SIGQUIT", "SIGTERM"],
  onSignal: onSignal,
  onShutdown,
  beforeShutdown: onBeforeShutdown,
  logger: console.log,
}

async function startServer() {
  const server = http.createServer(app)
  await Promise.all([mysqlConnect(), redisConnect(), mongodbConnect()])
  createTerminus(server, terminusOptions)

  server.listen(9002, () => {
    console.log(
      `🚀 Server running at http://localhost:9002, PID: ${process.pid}`
    )
  })
}

startServer()
```

数据库相关代码

db/mysql.js

```js
import mysql from "mysql"

const MYSQL_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Mysql_12345",
  database: "learn-node-blog",
}

// 创建连接对象，建立连接
let connection = mysql.createConnection(MYSQL_CONFIG)

/**
 * mysql 健康检查接口
 */
export function onMysqlHealthCheck() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT 1", (err) => {
      if (err) {
        return reject(err)
      }

      return resolve()
    })
  })
}

export function mysqlConnect() {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error("mysql connection error", err.stack)
        return reject(err)
      }

      console.log("mysql connected")
      resolve()
    })
  })
}

/**
 * 调用 end()方法确保在数据库连接关闭之前始终执行所有剩余的查询。
 * 调用 destroy()方法强制关闭，不会像end那样触发回调或事件。 connection.destroy()
 */
export function mysqlDisconnect() {
  return new Promise((resolve, reject) => {
    connection.end((err) => {
      if (err) {
        console.error("mysql error during disconnection ", err.stack)
        return reject(err)
      }

      console.log("mysql disconnected")
      resolve()
    })
  })
}

export function exec(sql, values = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, values, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export const mysqlEscape = mysql.escape

export default connection
```

db/redis.js

```js
import { createClient } from "redis"

const REDIS_CONFIG = {
  port: 6379,
  host: "127.0.0.1",
}

const client = createClient(REDIS_CONFIG.port, REDIS_CONFIG.host)

client.on("connect", () => {
  console.log("Connected to the Redis server.")
})
client.on("end", () => {
  console.log("quitted to the Redis server.")
})
client.on("error", (err) => console.log("Redis Client Error", err))

/**
 * redis 健康检查接口
 */
export function onRedisHealthCheck() {
  return client.status === "ready"
    ? Promise.resolve()
    : Promise.reject(new Error("not ready"))
}

export async function redisConnect() {
  return await client
    .connect()
    .then(() => console.log("mysql connected"))
    .catch((err) => {
      console.error("redis connection error", err.stack)
    })
}

/**
 * quit() 方法将所有运行的命令正确处理后，将quit命令发送到redis服务器，并将其完全正确地结束。就是所谓的优雅退出
 * end()方法不会等到所有的答复都被解析之后才断开和redis的连接，他会立刻断开与数据库的连接
 */
export async function redisDisconnect() {
  return await client
    .quit()
    .then(() => console.log("redis disconnected"))
    .catch((err) =>
      console.error("redis error during disconnection", err.stack)
    )
}

export async function redisGet(key) {
  try {
    if (!key) return null

    let value = await client.get(key)

    try {
      value = JSON.parse(value)
    } catch {
      value = value
    }

    return value
  } catch (err) {
    return Promise.reject(err)
  }
}

export async function redisSet(key, value) {
  try {
    if (!key) throw new Error("key 是必须的")

    if (typeof value === "object") {
      value = JSON.stringify(value)
    }

    await client.set(key, value)
  } catch (error) {
    return Promise.reject(error)
  }
}

export default client
```

db/mongodb.js

```js
import { MongoClient } from "mongodb"

let client, db

export function onMongodbHealthCheck() {
  return db.command({ ping: 1 })
}

export async function mongodbConnect() {
  client = await MongoClient.connect("mongodb://localhost:27017")
  db = client.db("learn-node")
  console.log("db connected")
}

export async function mongodbDisconnect() {
  return client
    .close()
    .then(() => console.log("client has disconnected"))
    .catch((err) =>
      console.error("mongodb error during disconnection", err.stack)
    )
}

export default db.collection
```
