/*
 * @Date         : 2024-07-14 10:05:47 星期0
 * @Author       : xut
 * @Description  :
 */
import { Readable } from "node:stream"
import { createReadStream } from "node:fs"
import { dirname, join } from "node:path"
import { EOL } from "node:os"

export class JSONLineReader extends Readable {
  constructor(filename) {
    super()
    this._filename = filename
    this._source = null
    this._foundLineEnd = false
    this._buffer = ""
    this.count = 0
  }

  _construct(callback) {
    this._source = createReadStream(this._filename, { encoding: "utf8" })
    this._source.on("readable", () => {
      this.read()
    })
    callback()
  }

  _read(size) {
    let chunk, line, lineIndex, result

    if (this._buffer.length === 0) {
      chunk = this._source.read()
      this._buffer += chunk
    }

    lineIndex = this._buffer.indexOf(EOL)

    if (lineIndex === -1) return

    line = this._buffer.slice(0, lineIndex)

    if (!line) {
      // 把当前的 n 裁掉，等待下一次读取
      this._buffer = this._buffer.slice(1)
      return
    }

    result = JSON.parse(line)
    this._buffer = this._buffer.slice(lineIndex + 1)
    this.count += line.length

    this.emit("object", result)
    this.push(line)
  }

  _destroy(err, callback) {
    this._source = null
    this._buffer = ""
    callback(err)
  }

  _flush(callback) {
    this.push(`Total length received: ${this.count} bytes\n`)
    callback()
  }
}

// 使用
const __dirname = dirname(import.meta.filename)
const filename = join(__dirname, "json-lines.txt")
const jsonLineReader = new JSONLineReader(filename)

jsonLineReader.on("object", (obj) => {
  console.log("🚀 ~ jsonLineReader ~ obj:", obj)
})
