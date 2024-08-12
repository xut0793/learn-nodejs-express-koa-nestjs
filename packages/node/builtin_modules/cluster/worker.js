import { createServer } from "node:http"

createServer((req, res) => {
  res.writeHead(200)
  res.end(`hello world from process ${process.pid} \n`)
}).listen(8000)

console.log(`Worker ${process.pid} started`)
