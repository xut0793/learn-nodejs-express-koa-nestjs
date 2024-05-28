/*
 * @Date         : 2024-05-28 13:40:51 星期2
 * @Author       : xut
 * @Description  : 健康检查和优雅关闭
 */
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
