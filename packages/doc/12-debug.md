# 调试 debug

## What: 调试的相关概念

我们利用不同的语言描述业务逻辑，然后运行它看效果，当代码的逻辑比较复杂的时候，难免会出错，所以程序运行的**错误**叫做 `bug`。

为查找解决这个问题(BUG)，我们希望能够一步步运行或是运行到某个点停下来，这个点叫做**断点`breakpoint`**，通常情况下，它的表现真的是个点，比如 vscode 里红色的点，还有浏览器开发者工具中调试面板上在序号前的绿色箭头，或者代码语句中添加 `debugger` 语句等方式都能让程序运行到此停下来。

此时可以查看断点所在的上下文环境中的作用域变量、函数参数、函数调用堆栈等信息，能够完成这个功能的程序叫**调试器`debugger`**。

> 1947 年 9 月 9 日，哈佛大学在测试马克 II 型艾肯中继器计算机的时候，一只飞蛾粘在一个继电器上，导致计算机无法正常工作，操作员把飞蛾移除之后，计算机又恢复了正常运转。于是他们将这只飞蛾贴在了他们当时记录的日志上，并在日志最后写了这样一句话：First actual case of bug being found。这是他们发现的第一个真正意义上的 bug，这也是人类计算机软件历史上发现的第一个 bug。他们也提出了一个词，“debug（调试）”了机器，由此引出了计算机调试技术的发展。

## Why: 为什么需要调试

在纷繁复杂的代码世界中，出错是难免的，调试代码是你最快找到问题原因的便捷途径。使用断点调试的主要好处就是可以观察程序运行的实际情况，而不用做假设。另一方面，在调试器中可以手动控制代码执行的逻辑，比如暂定执行，或者逐行运行，甚至修改内存中的值，让它走到另一个分支里。

对于简单的问题调试，可以使用 `console` API 来打日志，但是这种排除问题的方式有很多缺点：

- 不能完全展现代码逻辑当前的上下文信息，
- 同添加 `debugger` 语句一样，调试代码入侵了业务代码。
- `console` 或 `debugger` 方式需要刷新页面或重启应用程序。

所以我们需要更高效的应用程序调试的方式。

## How: 如何调试 Node 程序

### 使用内置调试器 Debugger

Node 有一个核心模块 `debugger`，实现了 node 调试器的功能。要对某个应用程序开启内置调试器，简单地在程序启动添加 `inspect` 参数即可。

```
node inspect app.js             # 通过 --inspect 标志生成一个新的子进程，然后在当前主进程运行 node 内置的 CLI 调试器。
node inspect --port=xxx app.js  # 自定义调试端口号，默认 9229
```

此时命令行进入交互模式，输入相应的调试命令可对程序进行调试。

```
# 单步执行
cont, c:  继续执行
next, n:  单步执行下一行
step, s:  单步进入
out, o:   单步退出
pause:    暂停运行中的代码（类似于开发者工具中的暂停按钮）

# 断点
setBreakpoint(), sb():                              在当前行上设置断点
setBreakpoint(line), sb(line):                      在指定行上设置断点
setBreakpoint('fn()'), sb('fn()'):                  在函数体的第一个语句上设置断点
setBreakpoint('script.js', 1)、 sb(path, line):     在 script.js 文件的第一行上设置断点
setBreakpoint('script.js', 1, 'num < 4')、 sb(path, line, condition): 在 script.js 的第一行上设置条件断点，仅当 num < 4 计算为 true 时才会中断
clearBreakpoint(), cb():                            清除所有断点
clearBreakpoint(line), cb(line):                    清除指定行上的断点
clearBreakpoint('script.js', 1), cb(path, line):    清除 script.js 中第一行上的断点

# 查看信息
backtrace, bt:    打印当前执行帧的回溯
list(5):          列出脚本源码的 5 行上下文（前后各 5 行）
watch(expr):      将表达式添加到监视列表
unwatch(expr):    从监视列表中移除表达式
watchers:         列出所有的监视器和它们的值（在每个断点上自动地列出）
repl:             打开调试器的 repl，用于调试脚本的上下文中的执行
exec expr:        在调试脚本的上下文中执行一个表达式

# 执行的控制
run:              运行脚本（在调试器启动时自动地运行）
restart:          重启脚本
kill:             杀死脚本

# 其它
scripts:          列出所有已加载的脚本
version:          显示 V8 的版本
```

上述测试在 window 系统上大概率会报错 `Timeout (2000) waiting for 127.0.0.1:9229 to be free`，原因是在win10中使用 node inspect 命令启动调试器时需要调用系统接口分配端口，代码中设定的超时时间是2秒，而win10分配端口耗时较长，大约需要 3-5 秒，超过了2秒，因此会报错。[见此处 node inspect 报错](https://github.com/nodejs/node-inspect/issues/48)，最新的 Node v12.19.0 和 v15.0.1 现在已修复（超时设置为 9999 毫秒）。

### 早期的第三方依赖 `node-inspector` 开启 GUI 调试

上面这种原始的命令行调试模式，除了要知道各种调试命令，视觉上也非常不直观，基本很少直接使用，所以出现了一个第三方模块 `node-inspector` 实现了 node 调试的可视化，它帮助我们在 `Chrome DevTools` 上能可视化地调试 Node.js 程序。

```
# 安装依赖
npm install -g node-inspector

# 启动inspector服务：
node-inspector

# 以debug模式运行node.js应用，要求 node 版本在 6.3 以下。你可以使用 nvm 来控制本地 node 版本。
# nvm use 6.2.1
node --debug=5858 index.js

# 浏览器打开 http://127.0.0.1:8080/debug?port=5858，后台会提供一个类似于 chrome devtools 的 UI 调试界面。
```

由于 `node-inspector` 很大程度提升了 Node 的调试体验，在 `v6.3` 的时候，Node.js 官方直接把这个能力给整合了进去，不再使用 `--debug` 参数启动调试程序，而是改为 `--inspect` 参数启动调试程序。

### 使用浏览器的 DevTools 作为 GUI 调试终端

使用 `v6.3+` 的 Node.js 中调试程序时，执行添加了 `--inspect` 或 `--inspect-brk` 参数的命令。

```
node --inspect index.js                     # 启用 debuger 模块开启监听器，默认 127.0.0.1:9229。对直接运行完成就结束的 node 程序，需要提前使用 debugger 语句设置程序断点，才能让调试器捕获到调试信号
node --inspect=[host:port] index.js         # 自定义监听的主机和端口
node --inspect-brk index.js                 # 与 --inspect 基本功能一样，但是它会自动在程序运行的第一行代码中断，所以解决了手动添加 debugger 语句设置断点的问题
node --inspec-brkt=[host:port] index.js     # 自定义监听的主机和端口
```

此时 Node 已经开启了调试模式，监听调试端口的信号。我们有以下几种方式来打开一个 `DevTools` 调试器终端。

- 打开 Chrome 浏览器，输入 `chrome://inspect/#devices` 地址后回车，弹出的页面中点击显示远程目标（remote target) 下的 inspect 文字按钮。（首次使用时需要勾选 Discover network targets ，然后点击 Configure 设置地址和端口，添加默认使用的 9229 端口，然后点击完成），切换到 sources 面板，首次时需要点击 `+ Add folder to workspace` 授权浏览器读取本地文件，将调试文件加载进来。
- 打开 Chrome 浏览器，f12 打开 `Chrome DevToo` 控制台，看到一个 NODE 图标，点击打开对接 node 调试器的调试容器。

### 已运行的 node 程序附加调试

如果 Node.js 程序在启动的时候没有带 `--inspect / --inspect-brk` 参数，默认情况下 Node.js 的 Debugger 模块是不会启动的，这种情况下并非就不能调试了，我们可以手动来启动调试模块：

```
ps -aux | grep 'yourscript.js' # linux 下找到对应的 Node.js 进程的 PID
netstat -ano | findstr 8080 # window 下只能通过当前端口号查找 node 进程的 PID

# 方法1：在该进程上启动（exec） 调试器
node -e 'process._debugProcess(PID)'

# 方法2：或者给这个 PID 发送 SIGUSR1 信号, 在已经运行的进程上启动调试器，即启用 debugger 模块。但是 SIGUSR1 在 Windows 下不可用
kill -SIGUSR1 PID
```

### 使用 vscode 调试 Node 程序

使用 vscode 调试 Node 程序也同上面一样，有两种模式：

- `launch`： vscode 开启一个进程运行程序，并进行调试。 `launch` 译为发起，即独立开启进程。
- `attach`：vscode 附加到一个已经运行的程序中进行调试。`attach` 译为“附加”，实际"监听"更合适。

一段基本 node 程序 `app.js`

```js
const http = require("http")
const server = http.createServer((req, res) => {
  debugger // 或者在 vscode 中添加断点
  res.end("Hello Node Debugging")
})
server.listen(8080, () => {
  console.log("server is runnig localhost:8080")
})
```

#### vscode launch program

vscode launch 模式调试一个 node 程序，在 `launch.json` 中添加配置，选择 `Node.js: Launch Program` 模板：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-node",
      "request": "launch",
      "name": "Launch Node Program",
      "program": "${workspaceFolder}/app.js", // 输入 node app.js 启动的路径
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

此时在调试视图中选择 `Launch Node Program` 调试顶后，点击调试或按f5，vscode 会自动开启 node 服务。在浏览器中输入服务访问地址`localhost:8080`，即可在 vscode 中执行到断点处停止，等待调试信号。

上述配置是默认 `"runtimeExecutable": "node"`，指使用 node 执行 `program` 指定的程序，类似在终端直接执行 `node ./app.js` 的效果。

#### vscode launch npm

但实际项目开发时，经常使用 npm / yarn / pnpm 来执行 package.json 中 script 字段指定的命令。可以这样配置：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Node Npm",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run-script", "dev"],
      // 如果单项目，直接默认根路径，如果 monorepo 项目，可以 cwd 到具体子项目路径
      "cwd": "${workspaceFolder}/packages/node",
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    }
  ]
}
```

#### vscode attach

vscode attach 调试一个已经运行的 node 程序，在 `launch.json` 中添加配置，选择 `Node.js: Attach Program` 模板：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-node",
      "request": "attach",
      "name": "Attach Node Program",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

1. 找到已运行 node 服务的进程PID：`netstat -ano | findstr 8080`
2. 对该进程的 node 进程启动调试模式：`node -e 'process._debugProcess(PID)'`
3. vscode 调试视图中选择 `Attach Node Program` 运行
4. 在程序中添加断点，然后浏览器访问当前服务，即可进入vscode 调试面板

另一种方式是省略第2步，将第1步查询的进程 PID 直接写入配置文件中。

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-node",
      "request": "attach",
      "name": "Attach Node Program",
      // "port": 9229,
      "processId": "19556", // PID， 使用该属性时，调试端口是根据Node.js版本（和所使用的协议）自动确定的，无法明确配置。因此，请不要指定port属性。
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## vscode 调试总结

1. vscode 可调试的程序类型，大体分为 web 应用、node 程序两大类，其它还包括 vscode 插件开发等调试
   - `type: pwa-chrome` Chrome 浏览器 web 应用调试
   - `type: pwa-msedge` Microsoft Edge 浏览器 web 应用调试
   - `type: pwa-node` node 程序调试
   - `type: pwa-extensionHost` vscode 扩展插件
2. vscode 调试的两种模式

- `launch`: vscode 自己在开启一个独立进程来启动应用。 launch 译为发起，即独立开启进程。
- `attach`: 调试一个已运行的应用，vscode 监听程序已经运行的进程进行调试。attach 译为“附加”，实际"监听"更合适。

3. vscode 内置变量替换
   - `${workspaceFolder}`：项目文件夹在 VS Code 中打开的路径
   - `${file}`：当前开打开（激活）的文件
   - `${relativeFile}`：相对于 `{workspaceFolder}` 的文件路径
   - `${fileBasename}`：当前打开文件的名称
   - `${fileBasenameNoExtension}`：当前打开文件的名称，不带扩展名的
   - `${fileExtname}`：当前打开文件的扩展名
   - `${fileDirname}`：当前打开文件的文件夹名称
4. `launch.json` 配置项

### 配置项

下面是针对一些常用的配置项，更多其它配置属性查阅 [vscode-js-debug/options](https://github.com/microsoft/vscode-js-debug/blob/main/OPTIONS.md)

```json
{
  "version": "0.2.0",
  "configurations": [
    /****************************************************************************************
    * pwa-node launch 模式可用配置项
    ****************************************************************************************/
    {
      // 必填属性
      "name": "Launch",
      "type": "node",
      "request": "launch", // 当前调试的模式 launch，如果选择的是Launch，那么接着按下F5就可以启动调试了


      // request: "launch | attach"  共同配置属性
      "localRoot": "${workspaceRoot}", // 包含调试程序的本地目录
      "cwd": "${workspaceRoot}", // 在该目录中启动要调试的程序
      "remoteRoot": null, // 节点的根目录
      "smartStep": true, // 尝试自动跳过不会映射到源文件的代码
      "skipFiles": [
        // 自动跳过这些glob模式所覆盖的文件
        "${workspaceFolder}/node_modules/**/*.js", // 项目中node_modules 文件夹中的所有代码都将被跳过。
        "<node_internals>/**/*.js" // 跳过Node.js的内置核心模块
      ],
      "trace": false, // 启用诊断输出
      "timeout": 10000, // 重新启动会话时，请在此毫秒数后放弃
      "restart": false, // 终止时重新启动连接
      // 环境相关
      "env": {
        // 可选的环境变量。此属性期望环境变量作为字符串类型的键/值对的列表。
        "NODE_ENV": "development"
      },
      "envFile": "${workspaceFolder}/.env", // 从外部加载包含环境变量定义的文件的路径
      // sourceMaps 相关
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "webpack:///./~/*": "${workspaceFolder}/node_modules/*",
        "webpack:////*": "/*",
        "webpack://?:*/*": "${workspaceFolder}/*",
        "webpack:///([a-z]):/(.+)": "$1:/$2",
        "meteor://💻app/*": "${workspaceFolder}/*"
      },
      "resolveSourceMapLocations": [
        "**",
        "!**/node_modules/**"
      ],
      "runtimeSourcemapPausePatterns": [],
      "pauseForSourceMap": false,

      "outDir": null,
      "outFiles": [
        "${workspaceFolder}/**/*.js",
        "!**/node_modules/**"
      ], // 用于指定需要进行 source-map 源码映射的文件。即仅对bin夹中文件的.js 文件进行源码映射

      "outputCapture": "console",
      "preLaunchTask": null, // 如需在启动前执行某些任务，在.vscode 目录下建立 task.json 文件
      "autoAttachChildProcesses": true, // 自动将调试器附加到新的子进程。
      "cascadeTerminateToConfigurations": [],
      "customDescriptionGenerator": null,
      "customPropertiesGenerator":null,
      "enableContentValidation": true,
      "showAsyncStacks": true,

      // launch 特有配置属性
      "program": "${workspaceRoot}/app.js", // 要调试的Node.js程序的绝对路径
      "args": [], // 传递给程序的参数进行调试。该属性的类型为array，并且期望将各个参数作为数组元素。
      "runtimeExecutable": "node", // 要使用的运行时可执行文件的绝对路径。默认值为node, 也可以是 npm / gulp 等
      "runtimeArgs": [
        // 传递给运行时可执行文件的可选参数， 如 npm run debug
        "run-script",
        "debug"
      ],
      "runtimeVersion": "default", // 如果使用“ nvm ”（或“ nvm-windows ”）或“ nvs ”来管理Node.js版本，则此属性可用于选择特定版本的Node.js
      "stopOnEntry": false, // 程序启动时在首行立即中断
      "attachSimplePort": null,
      "console": "internalConsole", // internalConsole：VS Code 的调试控制台; integratedTerminal：VS Code 的集成终端; externalTerminal：VS Code 外部的集成终端
      "killBehavior": "forceful",
      "profileStartup": false,
    }

    /****************************************************************************************
    * pwa-node attach 模式可用配置项
    ****************************************************************************************/
    {
      // 必填属性
      "name": "Attach",
      "type": "node",
      "request": "attach",

      // request: "launch | attach"  共同配置属性
      "localRoot": "${workspaceRoot}",
      "cwd": "${workspaceRoot}",
      "remoteRoot": null,
      "smartStep": true,
      "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "<node_internals>/**/*.js", // node 内部模块
      ],
      "trace": false,
      "timeout": 10000,
      "restart": false,
      "websocketAddress": null,
      // 环境相关
      "env": {
        "NODE_ENV": "development"
      },
      "envFile": "${workspaceFolder}/.env",
      "externalConsole": "internalConsole",
      // sourceMaps 相关
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "webpack:///./~/*": "${workspaceFolder}/node_modules/*",
        "webpack:////*": "/*",
        "webpack://?:*/*": "${workspaceFolder}/*",
        "webpack:///([a-z]):/(.+)": "$1:/$2",
        "meteor://💻app/*": "${workspaceFolder}/*"
      },
      "resolveSourceMapLocations": [
        "**",
        "!**/node_modules/**"
      ],
      "runtimeSourcemapPausePatterns": [],
      "pauseForSourceMap": false,

      "outDir": null,
      "outFiles": [
        "${workspaceFolder}/**/*.js",
        "!**/node_modules/**"
      ],
      "preLaunchTask": null,
      "autoAttachChildProcesses": true, // 自动将调试器附加到新的子进程。
      "cascadeTerminateToConfigurations": [],
      "customDescriptionGenerator": null,
      "customPropertiesGenerator":null,
      "enableContentValidation": true,
      "showAsyncStacks": true,

      // attach 特有配置属性
      "protocol": null, // 使用的调试协议，开启调试时会自动匹配相关插件
      "port": 9229, // 使用调试端口
      "address": "localhost", // 调试端口的TCP / IP地址
      "processId": null, // 调试器在发送USR1信号后尝试附加到该进程。使用此设置，调试器可以附加到尚未在调试模式下启动的已经运行的进程。使用该processId属性时，调试端口是根据Node.js版本（和所使用的协议）自动确定的，无法明确配置。因此，请不要指定port属性。
      "continueOnAttach": false, // 如果在附加到该进程时已暂停，是否继续该进程。如果使用启动程序，此选项很有用--inspect-brk
      "attachExistingChildren": true, // 是否尝试附加到已生成的子进程。

    }

    /****************************************************************************************
    * pwa-chrome launch 模式可用配置项
    ****************************************************************************************/
    {
      // 必填属性
      "type": "pwa-chrome",
      "request": "launch",
      "name": "Attach",

      // request: "launch | attach"  共同配置属性
      "browserLaunchLocation": "workspace", // 强制浏览器附加到一个位置,用于连接到远程计算机上的浏览器而不是本地浏览器。
      "cascadeTerminateToConfigurations": [], // 调试会话列表，当此调试会话终止时，也将停止。
      "customDescriptionGenerator": null, // 自定义调试器为对象（局部变量等）输出显示方法的配置。
      "disableNetworkCache": true, // 控制是否为每个请求跳过网络缓存
      "enableContentValidation": true, // 设置是否验证磁盘上文件的内容与运行时加载的内容匹配。这在各种场景中都很有用，并且在某些场景中是必需的
      "profileStartup": false, // 是否在启动后立即开始性能分析，对应 profile 面板的功能
      "showAsyncStacks": true, // 显示导致当前调用堆栈的异步调用。
      "smartStep": true,
      "timeout": 10000, // 端口通信连接超时时间
      "trace": false, // 是否输出问题信息

      // sourceMaps以及 path 相关
      "sourceMaps": true, // 使用 sourceMaps 文件，如果存在的话。
      "sourceMapPathOverrides": { // 一组映射，用于将源文件的位置映射到到磁盘上的位置。
        "webpack:///./~/*": "${webRoot}/node_modules/*",
        "webpack:////*": "/*",
        "webpack://?:*/*": "${webRoot}/*",
        "webpack:///([a-z]):/(.+)": "$1:/$2",
        "meteor://💻app/*": "${webRoot}/*"
      },
      "pauseForSourceMap": true, // 是否等待为每个运行的脚本完成 sourceMap 文件的加载，这会产生性能开销，如果运行在磁盘时可以安全地禁用
      "perScriptSourcemaps": "auto", // 是否使用包含源文件基本名称的唯一源映射单独加载脚本。可以设置为在处理许多小脚本时优化源地图的处理。如果设置为“自动”，我们将检测合适的已知情况。
      "resolveSourceMapLocations": null, // 可使用源映射解析本地文件的位置（文件夹和 URL）的最小匹配模式列表。这可用于避免错误地破坏外部源映射代码。模式可以以“！”为前缀 排除他们。可以设置为空数组或 null 以避免限制。
      "vueComponentPaths": [ // 用于查找*.vue组件的文件 glob 模式列表。默认情况下，搜索整个工作区。由于 Vue 的源映射需要在 Vue CLI 4 中进行额外查找，因此需要指定此项。您可以通过将其设置为空数组来禁用此特殊处理。
        "${workspaceFolder}/**/*.vue",
        "!**/node_modules/**"
      ],
      "outFiles": [ // 如果启用了源映射 sourceMaps: true，这些 glob 模式会指定生成的 JavaScript 文件。如果模式以!文件开头，则排除。如果未指定，则生成的代码应与其源代码位于同一目录中。
        "${workspaceFolder}/**/*.js",
        "!**/node_modules/**"
      ],
      "skipFiles": ["${workspaceFolder}/node_modules/**/*.js"], // 调试时要跳过的文件或文件夹名称或路径 glob 的数组。
      "pathMapping": {}, // URL/路径到本地文件夹的映射，用于将浏览器中的脚本解析为磁盘上的脚本
      "outputCapture": "console", // 设置消息输出方式：console / std
      "inspectUri": null,

      "webRoot": "${workspaceFolder}", // 指定了 Web 服务器根目录的工作区绝对路径，用于解析磁盘上的文件路径
      "url": null, // 调试页面的 url 地址，如本地vue页面：http://localhost:8080
      "urlFilter": "*", // 也附加到与 glob 匹配的多个页面
      "port": 0, // 用于远程调试浏览器的端口，--remote-debugging-port 在启动浏览器时给出，默认 9222。


      // launch 特有配置
      "cwd": null, // 运行时可执行文件的可选工作目录。
      "runtimeExecutable": "stable", // canary / stable / custom 或浏览器可执行文件的路径 C:\Program Files (x86)\Google\Chrome\Application\chrome.exe。如果选择 custom 自定义，意味着需要自定义包装器、自定义构建或 CHROME_PATH 环境变量。
      "runtimeArgs": null, // 传递给 runtimeExecutable 设置的可执行文件执行时的参数
      "includeDefaultArg": true, // 默认浏览器启动参数包含在启动程序中。
      "userDataDir": true, // 默认情况下，浏览器在临时文件夹中使用单独的用户配置文件启动。设置为 false 将使用您的默认用户配置文件启动。
      "cleanUp": "wholeBrowser", // 关闭正在调试的选项，即调试会话完成后要做什么清理。
      "env": {}, // 设置环境变量
      "file": null, // 指定要在浏览器中打开的本地 html 文件，如 index.html
    }

    /****************************************************************************************
    * pwa-chrome attach 模式可用配置项
    ****************************************************************************************/
    {
      // 必填属性
      "type": "pwa-chrome",
      "request": "attach",
      "name": "Attach debug vue",

      // request: "launch | attach"  共同配置属性
      "browserLaunchLocation": "workspace",
      "cascadeTerminateToConfigurations": [],
      "customDescriptionGenerator": null,
      "disableNetworkCache": true,
      "enableContentValidation": true,
      "profileStartup": false,
      "showAsyncStacks": true,
      "smartStep": true,
      "timeout": 10000,
      "trace": false,

      // sourceMaps以及 path 相关
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "webpack:///./~/*": "${webRoot}/node_modules/*",
        "webpack:////*": "/*",
        "webpack://?:*/*": "${webRoot}/*",
        "webpack:///([a-z]):/(.+)": "$1:/$2",
        "meteor://💻app/*": "${webRoot}/*"
      },
      "pauseForSourceMap": true,
      "perScriptSourcemaps": "auto",
      "resolveSourceMapLocations": null,
      "pathMapping": {},
      "vueComponentPaths": [
        "${workspaceFolder}/**/*.vue",
        "!**/node_modules/**"
      ],
      "outFiles": [
        "${workspaceFolder}/**/*.js",
        "!**/node_modules/**"
      ],
      "skipFiles": [],
      "outputCapture": "console",
      "inspectUri": null,

      "webRoot": "${workspaceFolder}",
      "url": null,
      "urlFilter": "*",
      "port": 0,

      // attach 特有配置
      "address": "localhost", // 需要侦听的浏览器 IP 地址或主机名。
      "restart": false, // 浏览器连接关闭时是否重新连接
      "targetSelection": "automatic", // 是附加到与 urlFilter 值匹配的所有目标（“自动”）还是要求选择一个（“选择”）。
    }
  ]
}
```

### 常用调试示例

#### launch program

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-node",
      "request": "launch",
      "name": "Launch Node Program",
      "runtimeExecutable": "node", // 默认 node ，前端基本都是在 node 环境下，所以可省略
      "runtimeArgs": null, // 可同 runtimeExecutable 一起省略
      "program": "${workspaceFolder}/app.js", // 输入 node app.js 启动的路径
      "args": [],
      "stopOnEntry": true, // 程序启动时在首行立即中断
      "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "<node_internals>/**"
      ]
    }
  ]
}
```

#### launch npm

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch via NPM",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run-script", "debug"],
      "stopOnEntry": true, // 程序启动时在首行立即中断
      "port": 9229,
      "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "<node_internals>/**"
      ]
    }
  ]
}
```

#### webpack 调试

在源码阅读时，开启调试模式，逐步阅读会更加程序逻辑，所以对常见的一些框架类库开启调试的配置如下：

两种方式：

- 使用 npm 命令调试，添加run-script：`"debug": "webpack --config=./dev-demo/webpack.config.js",`，然后如上面添加 npm 调试的配置文件
- program: 直接使用 webpack 启动文件，因为其本质也是一个 node 程序。

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-node",
      "request": "launch",
      "name": "webpack debug",
      "program": "${workspaceFolder}/node_modules/webpack/bin/webpack.js", // 输入 webpack 的启动路径
      "args": ["--config=./dev-demo/webpack.config.js"],
      "stopOnEntry": true, // 程序启动时在首行立即中断
      "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "<node_internals>/**"
      ]
    }
  ]
}
```

#### vue-cli-server 调试

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-node",
      "request": "launch",
      "name": "vue-cli-server debug",

      // 对应 vue 本地开发启动命令："vue-cli-service serve
      "program": "${workspaceFolder}/node_modules/@vue/cli-service/bin/vue-cli-service.js",
      "args": ["serve"],
      "stopOnEntry": true, // 程序启动时在首行立即中断
      "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "<node_internals>/**"
      ]
    }
  ]
}
```

#### jest 调试

调试当前 vscode 打开的某个 jest 测试文件

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-node",
      "request": "launch",
      "name": "jest debug",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": ["--runInBand", "--no-cache", "${fileBasename}"],
      "stopOnEntry": true, // 程序启动时在首行立即中断
      "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "<node_internals>/**"
      ]
    }
  ]
}
```

#### attach

附加到一个已经运行的程序中进行调试

> 前置条件：对该进程的 node 进程启动调试模式：`node -e 'process._debugProcess(PID)'`，或者添加 "processId": PID,

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-node",
      "request": "launch",
      "name": "Launch Node Program",
      "address": "localhost", // 调试端口的TCP / IP地址
      "port": 9229, // 使用调试端口
      // "processId": "19556",
      "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "<node_internals>/**/*.js"
      ]
    }
  ]
}
```
