/*
 * @Date         : 2024-07-08 11:32:16 星期1
 * @Author       : xut
 * @Description  :
 */
import fs from "node:fs"
import { join, dirname } from "node:path"

const __dirname = dirname(import.meta.filename)
const filePath = join(__dirname, "./file.txt")

// const readStream = fs.createReadStream(filePath, {highWaterMark: })
// console.log("🚀 ~ readStream:", readStream)
// console.log(readStream.readableHighWaterMark)

// console.log(
//   "readStream flowing: %s, paused: %s",
//   // readStream.readableFlowing,
//   // readStream.isPaused()
//   readStream._readableState.flowing,
//   readStream._readableState.paused
// )

const writeStream = fs.createWriteStream(filePath)
writeStream.cork()
const ok = writeStream.write("a")
console.log("🚀 ~ ok:", ok)

console.log("writeStream.writableLength: ", writeStream.writableLength)
console.log("writeStream.writableCorked: ", writeStream.writableCorked) // 1
// console.log(
//   "writeStream.writableHighWaterMark: ",
//   writeStream.writableHighWaterMark
// )
// console.log("writeStream.writableNeedDrain: ", writeStream.writableNeedDrain)
console.log(writeStream);
console.log(writeStream._writableState.buffered[0].chunk.toString()) // a

setTimeout(() => {
  writeStream.uncork() // 打开出口，水会流完
  console.log("writeStream.writableCorked: ", writeStream.writableCorked) // 0
  console.log(writeStream._writableState.buffered[0]) // undefined
}, 1000)
