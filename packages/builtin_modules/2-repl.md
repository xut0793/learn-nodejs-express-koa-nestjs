# REPL 交互编程环境

REPL（Read-Eval-Print Loop，读取-执行-打印循环）是 Node.js 提供的一个交互式编程环境，可以让你直接在命令行中方便地编写和测试 JavaScript 代码片段，并立刻看到代码执行结果。它非常适合实验性编程和快速学习。

## 基本使用

基本的使用方法如下：

- 启动：在命令行界面，输入 `node` 后按回车。
- 退出：输入 `.exit`，或者使用 `Ctrl+C` 两次，或者直接关闭命令行窗口来退出 REPL 环境。
- 单行输入：输入 node 回车后，可以直接输入任何 JavaScript 代码，按回车后，这段代码将被执行，结果将直接输出在下一行。
- 多行输入：进行 repl 后，输入 `.editor` 后，可以输入多选代码，然后按 `Ctrl+D` 退出，然后输入对应函数可执行。
- 更多命令，可以输入 `.help` 查看

```
.help 后输出以下内容

.break    在输入多行表达式的过程中，输入 .break 命令（或按 Ctrl+C）可中止对该表达式的进一步输入或处理。
.clear    将 REPL context 重置为空对象并清除任何输入的多行表达式。
.editor   进入编辑模式（Ctrl+D 完成，Ctrl+C 取消）。
.exit     关闭 I/O 流， REPL 退出。
.help     打印可用的命令列表。
.load     将文件加载到当前 REPL 会话中。> .load ./file/to/load.js
.save     将当前 REPL 会话保存到一个文件中：> .save ./file/to/save.js
```

## 特殊组合键

REPL 中的以下组合键具有这些特殊效果：

- `Tab`补全：在空白行输入部分内容时，按下 Tab 键，repl 会尝试自动补全可用的变量名或函数名。
- `上/下箭头`：允许你在此前输入的命令之前切换。
- `Ctrl+C`: 按一次时，与 `.break` 命令具有相同的效果。当在空白行上按两次时，效果与 `.exit` 命令相同。如果在多行编辑模式下，按一次退出当前编辑模式。
- `Ctrl+D`: 也可以用来退出 REPL 环境。这是另一种退出方式，特别是当你的终端不响应 Ctrl + C 时十分有用。与 `.exit` 命令具有相同的效果。同样如果在多行编辑模式下，按一次退出当前编辑模式。
- `Ctrl+R` 进入 reverse-i-search 搜索模式，触发向前搜索。
- `Ctrl+S` 进入 reverse-i-search 搜索模式下，触发向后搜索。

## 默认行为

- 内置核心模块的访问，在 repl 环境中，会默认将 Node.js 核心模块加载到 REPL 环境中，所以可以直接使用 nodejs 的核心模块相关功能。例如，输入 fs 将按需评估为 `global.fs = require('node:fs')`，除非另外声明为全局变量或作用域变量。
- `_`下划线表示最近表达式的输出。默认情况下，默认求值器会将最近求值的表达式的结果分配给特殊变量 _（下划线）。将 _ 显式设置为一个值将禁用此行为。同样，特殊的 `_error` 将引用上次看到的错误，
- 支持顶层启用对 await 关键字的支持。

## Reverse-i-search 搜索功能

Reverse-i-search 是一种搜索技巧，允许你在命令行界面中逆向搜索之前输入的命令。这意味着，如果你之前执行过一些操作或命令，并且想要快速找到并重新执行它们，reverse-i-search 可以帮你做到这一点。在 Node.js 的 REPL 环境中使用时，它可以帮助你查找之前执行过的 JavaScript 代码片段。

如何使用 Reverse-i-search?

1. 启动 Node.js REPL: 打开终端或命令提示符，键入 node 并按 Enter 键。
2. 激活 Reverse-i-search: 按下 `Ctrl + r` 组合键。你会注意到提示符变成了 (fwd-i-search)，表明你现在可以输入搜索关键词了。
3. 输入搜索关键词: 开始输入你记得的命令或代码片段的一部分。REPL 会根据你的输入显示匹配的历史命令。
4. 浏览结果: 如果第一个出现的结果不是你想要的，你可以再次按下 `Ctrl + r` 来检索更早的匹配项。重复此步骤，直到找到所需的命令。
5. 执行命令: 找到你想要的命令后，直接按 Enter 键执行它，或者按右箭头键`(→)`把它带到命令行编辑或修改。

## 通过 `repl.start` 模块自定义功能

可以通过 `repl` 模块的 `repl.start(options)` 方法的配置项，自定义部分功能。

```ts
function start(options?: string | ReplOptions): REPLServer
```

其中 replOptions 的选项包括：

```ts
interface ReplOptions {
  /**
   * The input prompt to display.
   * @default "> "
   */
  prompt?: string | undefined
  /**
   * The `Readable` stream from which REPL input will be read.
   * @default process.stdin
   */
  input?: NodeJS.ReadableStream | undefined
  /**
   * The `Writable` stream to which REPL output will be written.
   * @default process.stdout
   */
  output?: NodeJS.WritableStream | undefined
  /**
   * If `true`, specifies that the output should be treated as a TTY terminal, and have
   * ANSI/VT100 escape codes written to it.
   * Default: checking the value of the `isTTY` property on the output stream upon
   * instantiation.
   */
  terminal?: boolean | undefined
  /**
   * The function to be used when evaluating each given line of input.
   * Default: an async wrapper for the JavaScript `eval()` function. An `eval` function can
   * error with `repl.Recoverable` to indicate the input was incomplete and prompt for
   * additional lines.
   *
   * @see https://nodejs.org/dist/latest-v20.x/docs/api/repl.html#repl_default_evaluation
   * @see https://nodejs.org/dist/latest-v20.x/docs/api/repl.html#repl_custom_evaluation_functions
   */
  eval?: REPLEval | undefined
  /**
   * Defines if the repl prints output previews or not.
   * @default `true` Always `false` in case `terminal` is falsy.
   */
  preview?: boolean | undefined
  /**
   * If `true`, specifies that the default `writer` function should include ANSI color
   * styling to REPL output. If a custom `writer` function is provided then this has no
   * effect.
   * Default: the REPL instance's `terminal` value.
   */
  useColors?: boolean | undefined
  /**
   * If `true`, specifies that the default evaluation function will use the JavaScript
   * `global` as the context as opposed to creating a new separate context for the REPL
   * instance. The node CLI REPL sets this value to `true`.
   * Default: `false`.
   */
  useGlobal?: boolean | undefined
  /**
   * If `true`, specifies that the default writer will not output the return value of a
   * command if it evaluates to `undefined`.
   * Default: `false`.
   */
  ignoreUndefined?: boolean | undefined
  /**
   * The function to invoke to format the output of each command before writing to `output`.
   * Default: a wrapper for `util.inspect`.
   *
   * @see https://nodejs.org/dist/latest-v20.x/docs/api/repl.html#repl_customizing_repl_output
   */
  writer?: REPLWriter | undefined
  /**
   * An optional function used for custom Tab auto completion.
   *
   * @see https://nodejs.org/dist/latest-v20.x/docs/api/readline.html#readline_use_of_the_completer_function
   */
  completer?: Completer | AsyncCompleter | undefined
  /**
   * A flag that specifies whether the default evaluator executes all JavaScript commands in
   * strict mode or default (sloppy) mode.
   * Accepted values are:
   * - `repl.REPL_MODE_SLOPPY` - evaluates expressions in sloppy mode.
   * - `repl.REPL_MODE_STRICT` - evaluates expressions in strict mode. This is equivalent to
   *   prefacing every repl statement with `'use strict'`.
   */
  replMode?: typeof REPL_MODE_SLOPPY | typeof REPL_MODE_STRICT | undefined
  /**
   * Stop evaluating the current piece of code when `SIGINT` is received, i.e. `Ctrl+C` is
   * pressed. This cannot be used together with a custom `eval` function.
   * Default: `false`.
   */
  breakEvalOnSigint?: boolean | undefined
}
```

示例：

```js
// custom-cmd.js
import repl from "node:repl"

// 自定义终端提示符，默认是 >，改为 $
repl.start({ prompt: "$" })
```

然后在命令行终端输入 `node custom-cmd.js` 即可看到此时已经进入 repl 模式下，并且终端输入指示符变为 `$`。

```js
import repl from "node:repl"

/**
 * 过滤敏感词汇
 */
const sensitiveWords = ["foo", "bar"]
const customEval = (cmd, content, filename, callback) => {
  if (sensitiveWords.some((w) => cmd.includes(w))) {
    callback(new Error("Your input contains sensitive words"))
  } else {
    callback(null, eval(cmd))
  }
}
repl.start({ prompt: "> ", eval: customEval })

/**
 * 自定义日志记录
 */
import fs from "node:fs"
const logStream = fs.createWriteStream("repl.log", { flags: "a" })

const logEval = (cmd, context, filename, callback) => {
  logStream.write(cmd)
  // 继续正常的求值流程
  callback(null, eval(cmd))
}

repl.start({ prompt: "> ", eval: logEval })

/**
 * 美化对象输出
 */
repl.start({
  prompt: "> ",
  writer: (obj) => {
    // 如果是Date类型，以特定格式显示
    // 输入new Date()，它会输出类似Date: 2023-04-01T12:00:00.000Z的格式，而不是 Date 对象的默认 toString()输出。
    if (obj instanceof Date) {
      return `Date: ${obj.toISOString()}`
    }
    // 其他类型还是以JSON格式显示，比如 { name: "Node.js" }，它就会以格式化后的 JSON 形式展示，而不是一行紧凑的字符串
    return JSON.stringify(obj, null, 2)
  },
})
```

## 通过 `replServer` 扩展功能

可以通过向 REPL 环境添加自定义命令或修改其行为来扩展它。

例如，你可以定义一个命令 `.cls` 来清空终端，并且清除 REPL 历史记录或执行特定的代码。

```js
import repl from "node:repl"
const replServer = repl.start({ prompt: "> " })
// 自定义一个命令 .cls
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
```

监听事件，执行自定义行为

```js
import repl from "node:repl"
const replServer = repl.start({ prompt: "> " })

/**
 * 每当用户输入完成时触发的 line 事件：如果输入exit则退出，相当于内置命令 .exit
 */
replServer.on("line", (line) => {
  if (line === "exit") {
    replServer.close()
  }
})
```

replServer 常见事件：

- exit 退出事件，用户显式地通过 `.exit` 命令退出，或者通过按下Ctrl + C两次来退出 REPL 会话时触发
- reset 重置事件，用户显式地调用了 `.reset` 命令，或者有其他内部机制触发了重置。这提供了一个事件回调钩子，开发者可以在这个时刻插入自定义的逻辑，比如重新初始化环境变量或清理之前的操作痕迹、重连数据库等操作。
