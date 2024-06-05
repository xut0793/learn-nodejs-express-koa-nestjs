/*
 * @Date         : 2024-05-26 08:47:32 星期0
 * @Author       : xut
 * @Description  :
 */
import repl from "node:repl"

const sensitiveWords = ["foo", "bar"]

const customEval = (cmd, content, filename, callback) => {
  // console.log(
  //   "🚀 ~ customEval ~ cmd, content, filename,:",
  //   cmd,
  //   content,
  //   filename
  // )

  if (sensitiveWords.some((w) => cmd.includes(w))) {
    callback(new Error("Your input contains sensitive words"))
  } else {
    callback(null, eval(cmd))
  }
}

const replServer = repl.start({ prompt: "$ " })
replServer.defineCommand("cls", {
  help: "clear screen",
  action() {
    // 清空终端屏幕
    console.clear()
    // 清除当前命令输入缓冲区中的所有内容。换句话说，如果你正在输入一个命令但还没有执行（按回车），这个方法可以清除掉你已经输入但尚未完成的部分。
    this.clearBufferedCommand()
    console.log(`Screen is cleared.`)
    // 这个方法用于显示或更新 REPL 的提示符。当你在 REPL 会话中执行命令后，通常需要再次显示提示符，以便用户知道他们可以输入下一个命令。
    this.displayPrompt()
  },
})
