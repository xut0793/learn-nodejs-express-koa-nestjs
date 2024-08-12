/*
 * @Date         : 2024-07-28 18:28:14 星期0
 * @Author       : xut
 * @Description  :
 */
import cluster from "node:cluster"
import { createServer } from "node:http"

if (cluster.isPrimary) {
  console.log(`主进程 ${process.pid} 正在运行`)

  const worker = cluster.fork()

  worker.on("message", (message) => {
    console.log(`主进程，接收到子进程 ${worker.id} 的消息： `, message)

    worker.send("消息已收到！")
  })
} else {
  createServer((req, res) => {
    res.writeHead(200)
    res.end("hello world\n")
    // 向主进程发送消息。
    process.send({ url: req.url })
  }).listen(8000)

  console.log(`工作进程 ${process.pid} 已启动`)

  process.on("message", (message) => {
    console.log("接收主进程的消息: ", message)
  })
}
