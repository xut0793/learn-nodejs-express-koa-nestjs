/*
 * @Date         : 2024-07-17 21:59:40 星期3
 * @Author       : xut
 * @Description  :
 */
import { watch } from "node:fs/promises"
import { watchFile, unwatchFile, watch as fsWatch } from "node:fs"

/*****************************************************************
 * 可以递归监听文件和目录
 *
 * fs.watch(filename[, options][, listener])
 * fsPromises.watch(filename[, options])
 *
 * filename <string> | <Buffer> | <URL>
 * options <string> | <Object>
 *    persistent <boolean> 指示只要正在监视文件，进程是否应继续运行。默认值：true。
 *    recursive <boolean> 指示是应监视所有子目录，还是仅监视当前目录。这在指定目录时适用，并且仅适用于受支持的平台（参见 caveats）。默认值：false。
 *    encoding <string> 指定用于传给监听器的文件名的字符编码。默认值：'utf8'。
 *    signal <AbortSignal> 用于指示监视器何时应停止的 <AbortSignal>。
 * 返回：<AsyncIterator> 个，具有以下属性的对象：
 *      eventType <string> 变更类型
 *      filename <string> | <Buffer> | <null> 变更的文件的名称。
 ***************************************************************/

const ac = new AbortController()
setTimeout(() => ac.abort(), 5000)

function watchDir(filePath) {
  return fsWatch(
    filePath,
    { signal: ac.signal, recursive: true },
    (eventType, filename) => {
      console.log(`event type is: ${eventType}`)
      if (filename) {
        console.log(`filename provided: ${filename}`)
      } else {
        console.log("filename not provided")
      }
    }
  )
}

async function watchDirPromise(filePath) {
  try {
    const watcher = watch(filePath, {
      signal: ac.signal,
      recursive: true,
      // persistent: false,
    })

    for await (const event of watcher) {
      console.log("🚀 ~ watch file change ~ event:", event)
      // { eventType: 'change', filename: 'settings.json' }
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("🚀 ~ watcher abort:", err.message)
      return
    }
    console.error(err)
  }
}

watchDirPromise(".vscode/settings.json")

/*************************************************************
 * 单独监听某个文件
 *
 * 使用 fs.watch() 比 fs.watchFile 和 fs.unwatchFile 更高效。应尽可能使用 fs.watch 而不是 fs.watchFile 和 fs.unwatchFile。
 * 因为 watchFile 它使用 stat 轮询，但这种方法较慢且不太可靠。
 * 而 watch 则基于操作系统底层提供的一种方式来通知文件系统变更，比如 Linux 系统上使用 inotify(7) macOS 上对文件使用 kqueue(2)，对目录使用 fsEvents，在 windows 系统上取决于 ReadDirectoryChangesW。
 *
 * fs.watchFile(filename[, options], listener)
 *
 * filename <string> | <Buffer> | <URL>
 * options <Object>
 *    bigint <boolean> 默认值：false
 *    persistent <boolean> 默认值：true 指示当文件正在被监视时，进程是否应该继续运行
 *    interval <integer> 默认值：5007 指示应该轮询目标的频率（以毫秒为单位）
 * listener <Function>
 *    current <fs.Stats>
 *    previous <fs.Stats>
 * 返回：<fs.StatWatcher>
 ***********************************************************/
function watchFilename(filename) {
  function handleFileChange(curr, prev) {
    console.log(`the current mtime is: ${curr.mtime}`)
    console.log(`the previous mtime was: ${prev.mtime}`)
    console.log("🚀 ~ return watchFile ~ curr:", curr)
  }
  watchFile(filename, handleFileChange)

  // 稍后移除监听
  setTimeout(() => {
    unwatchFile(filename, handleFileChange)
    console.log("监听已移除")
  }, 10000) // 10秒后移除监听
}
