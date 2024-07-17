/*
 * @Date         : 2024-07-17 21:13:03 星期3
 * @Author       : xut
 * @Description  :
 */
import { open } from "node:fs/promises"
import { createReadStream, createWriteStream } from "node:fs"

// readableStream 读完文件，会自动关闭文件句柄
function readableStream(filePath) {
  const readableStream = createReadStream(filePath, { encoding: "utf8" })

  readableStream.on("data", (chunk) => {
    console.log("🚀 ~ readableStream ~ chunk:", chunk)
  })

  readableStream.on("end", () => {
    console.log("File reading completed.")
  })

  readableStream.on("error", (err) => {
    console.log("🚀 ~ readableStream ~ err:", err)
  })
}

// readableStream(".vscode/settings.json")

async function readFileHandle(filePath) {
  let fileHandle
  try {
    fileHandle = await open(filePath, "r")
    const stream = fileHandle.createReadStream({ encoding: "utf8" })
    stream.on("data", (chunk) => {
      console.log("🚀 ~ stream.on ~ chunk:", chunk)
    })

    stream.on("end", () => {
      console.log("🚀 ~ stream.on ~ completed:", end)
    })

    stream.on("error", (err) => {
      console.log("🚀 ~ stream.on ~ error:", err)
    })
  } catch (err) {
    console.log("🚀 ~ readFileHandle ~ err:", err)
  } finally {
    fileHandle.close()
  }
}

// readFileHandle(".vscode/settings.json")

async function readFileLines(filePath) {
  let fileHandle
  try {
    fileHandle = await open(filePath, "r")
    const readline = fileHandle.readLines({ encoding: "utf8" })

    for await (const line of readline) {
      // {
      //   "cSpell.words": ["gitee"]
      // }
      console.log(line)
    }
  } catch (err) {
    console.log("🚀 ~ readFileLines ~ err:", err)
  } finally {
    // 处理结束主动关闭文件句柄
    fileHandle.close()
  }
}

// readFileLines(".vscode/settings.json")

async function readWebStream(filePath) {
  let fileHandle
  try {
    fileHandle = await open(filePath) // 默认就是 r
    const webStream = fileHandle.readableWebStream()
    const decoder = new TextDecoder("utf8", { fatal: true }) // fatal：true 表示在解码无效时抛出错误。默认 false ，使用替换字符替代无效字符
    let str = ""

    for await (const chunk of webStream) {
      str += decoder.decode(chunk, { stream: true })
      console.log("🚀 ~ decoder.decode ~ str:", str)
    }

    console.log("🚀 ~ readWebStream ~ str:", str)
  } catch (error) {
    console.error(error)
  } finally {
    // 虽然 readableWebStream 会读完文件，但不会自动关闭 FileHandle。用户代码仍然必须调用 fileHandle.close() 方法。
    fileHandle.close()
  }
}

// readWebStream(".vscode/settings.json")

async function appendLog(message) {
  let fileHandle
  try {
    fileHandle = await open("log.txt", "a") // 文件描述符标志 a 打开文件进行追加。如果文件不存在，则创建该文件。
    const writeStream = fileHandle.createWriteStream({ encoding: "utf8" })
    writeStream.write(`${new Date().toISOString()}: ${message}\n`)
    writeStream.end() // 关闭流
  } catch (err) {
    console.log("🚀 ~ appendFile ~ err:", err)
  } finally {
    fileHandle.close() // 关闭文件句柄
  }
}
