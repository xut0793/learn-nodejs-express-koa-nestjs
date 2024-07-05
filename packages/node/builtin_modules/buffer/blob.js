/*
 * @Date         : 2024-07-04 14:05:57 星期4
 * @Author       : xut
 * @Description  :
 */
// const string = "Hello World"

// const blob = new Blob([string], { type: "text/plain" })
// console.log("🚀 ~ blob:", blob)
// // Blob { size: 11, type: 'text/plain' }

// const partBlob = blob.slice(0, 5, 'text/plain')
// console.log("🚀 ~ partBlob:", partBlob)
// // Blob { size: 5, type: 'text/plain' }

// blob.arrayBuffer().then((buffer) => {
//   console.log("🚀 ~ blob.arrayBuffer ~ buffer:", buffer)
//   //  ArrayBuffer {[Uint8Contents]: <48 65 6c 6c 6f 20 57 6f 72 6c 64>, byteLength: 11 }

//   const uint8 = new Uint8Array(buffer)
//   console.log("🚀 ~ blob.arrayBuffer ~ uint8:", uint8)
//   // Uint8Array(11) [72, 101, 108, 108, 111,  32,  87, 111, 114, 108, 100]

//   const decoder = new TextDecoder()
//   const str = decoder.decode(buffer)
//   console.log("🚀 ~ blob.arrayBuffer ~ str:", str)
//   // Hello World 不会受到 blo.slice 的影响
// })

// partBlob.text().then((str) => {
//   console.log("🚀 ~ partBlob.text ~ str:", str)  // Hello
// })

import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { createReadStream } from "node:fs"
import { on } from "node:events"
import { join, dirname } from "node:path"

const __dirname = dirname(import.meta.filename)
const imagePath = join(__dirname, "./floppy_disk.png")
const indexPath = join(__dirname, "./blob-web.html")
const mimeType = "image/png"

const server = createServer()
async function handle() {
  for await (const [req, res] of on(server, "request")) {
    const url = req.url
    switch (url) {
      case "/":
        const indexStream = createReadStream(indexPath)
        res.writeHead(200, { "Content-Type": "text/html;charset='UTF-8'" })
        indexStream.pipe(res)
        break
      case "/download":
        // const imageStream = createReadStream(imagePath)
        // res.writeHead(200, { "Content-Type": mimeType })
        // imageStream.pipe(res)

        const imageBuffer = await readFile(imagePath)
        const imageBlob = new Blob([imageBuffer], { type: mimeType })
        res.writeHead(200, {
          "Content-Type": mimeType,
          "Content-Length": imageBlob.size,
        })

        // Fix: 管道操作报错？？ imageBlob 属于 Web 标准的 ReadableStream 与  res 属性 Nodejs 标准 WritableStream 不能兼容？？
        // imageBlob.pipeTo(res)

        const arrayBuffer = await imageBlob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        res.end(buffer)
        break
      default:
        res.end()
        break
    }
  }
}

handle()
server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/")
})
