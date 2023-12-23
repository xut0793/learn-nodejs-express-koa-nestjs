# HMR(Hot Module Replacement)

HMR 全称 Hot Module Replacement，翻译为模块热更新。

在开发时，希望在代码改动保存时，服务能自动重启，不需要人为的手动重启。在前端工作中如 webpack / vite 都集成了 HMR 功能。但在 Node 项目中，需要安装相关依赖来设置热更新，常用的依赖包为 nodemon / forever / node-dev，这里以 nodemon 为示例。

## 安装

```sh
pnpm add -D nodemon
```

> [Node nodemon 详解](https://juejin.cn/post/7035266324670447623#heading-15)

## 基本使用

```json
"script": {
  "dev": "nodemon index.js"
}
```

## 配置文件

nodemon 可以在命令行中添加参数以支持某种功能，也可以使用本地配置文件 `nodemon.json` 进行配置，也可以在 `package.json` 文件中添加 `nodemonConfig` 字段进行配置。

配置文件优行级：命令行 > 项目根目录的 nodemon.json > nodemonConfig 字段

```json
"script": {
  "dev": "nodemon --config nodemon.json"
}
```

现在贴出的是默认配置，可以根据项目实际情况进行更新

```json
{
  // 设置重启命令，默认是 rs
  // nodemon在运行中时，如果你想重启应用，不需要退出并重新启动nodemon，你可以输入rs，按下回车键，nodemon将会重启你的应用。
  "restartable": "rs",
  // watch 可以监控多个目录，默认值：'*.*'。默认情况下，nodemon 监控当前工作目录。
  // 不要使用通配符来传递多个目录，例如- - watch ./lib/*，这种方式不生效。你需要使用- - watch指定每一个需要监听的目录。["app", "libs"]
  "watch": ["*.*"],
  // ignore 忽略项（包括文件、目录或文件名通配符匹配）
  // 默认情况下，nodemon会忽略 .git，node_modules，bower_components，.nyc_output，coverage 和 .sass-cache 目录
  // 可以添加你的忽略模式到列表中，比如 "*.test.js", "**/fixtures/**"。将 ignore 置空并不能取消忽略。
  "ignore": [
    ".git",
    "node_modules",
    "bower_components",
    ".nyc_output",
    "coverage",
    ".sass-cache"
  ],
  // 监控指定后缀名的文件，空格分隔，默认监听 “js mjs json"
  "ext": "js mjs json",
  // 设置重启的延迟时间，默认毫秒 ms。
  "delay": "1000",
  // 设定执行程序，比如指定 python 程序来运行指定文件，默认是 npm -v
  "exec": "python -v",
  // 当你使用的语言，不是nodemon默认支持的场景中，可以手动增加语言支持。比如下面增加了对 .py 文件运行 python 程序来执行。
  "execMap": {
    "py": "python",
    "rb": "ruby",
    "ts": "ts-node"
  },
  // 默认为 true，输出信息颜色有标示。
  "colours": true,
  // 为 true 时运行 nodemon xxx 项目不会启动，只保持对文件的监控，当监控的文件有修改并保存时才会启动应用，其他没有影响。默认是 false 即一开始就启动应用并监控文件改动。
  "runOnChangeOnly": false,
  // 设置日志输出模式，true 详细模式
  "verbose": false,
  "signal": "SIGUSR2",
  // 这个是关于标准输入输出的设置，上文提到 nodemon.json 文件中的 events 字段可以为状态设置标准输入输出语句，如果这里设置了 false，标准输入输出语句就会失效。
  "stdout": true,
  "stdin": true,
  //  表示 nodemon 运行到某些状态时的一些触发事件，总共有五个状态:
  // start 进程启动；crash: 进程崩溃，但不会触发 exit。exit 进程完全退出，restart: 重启 , config:update config 文件改变
  "events": {
    "restart": "osascript -e 'display notification \"app restarted\" with title \"nodemon\"'"
  },
  // 运行环境设置
  "env": {
    "NODE_ENV": "development",
    "PORT": "3000"
  },
  "watchOptions": {}
}
```

## nestjs 内置了 watch 命令。

### nestjs 内置的 watch 命令

```json
"script": {
  "start:dev": "nest start --watch",
}
```

### webpack HMR

但是 watch 是全量重启，这个过程还需要重新进行 typescript 编译，对于较大工程项目时较为费时。所以也可以在 nestjs 项目中集成 hmr 进行增量编译启动。

[webpack HMR](https://nest.nodejs.cn/recipes/hot-reload)

### Vite Plugin Node

[Vite Plugin Node](https://www.npmjs.com/package/vite-plugin-node)

> vite 对于 typescript 构建的 express / koa 也可以作为替换 ts-node 和 nodemon 来使用。

示例： [Getting started with NestJS, Vite, and esbuild](https://blog.logrocket.com/getting-started-with-nestjs-vite-esbuild/#installing-vite-esbuild-nestjs)

缺点是 vite 对 nestjs 的某些可选依赖还不能很好处理，但，所以暂不考虑。

```js
optimizeDeps: {
  // Vite does not work well with optionnal dependencies,
  // mark them as ignored for now
  exclude: [
      '@nestjs/microservices',
      '@nestjs/websockets',
      'cache-manager',
      'class-transformer',
      'class-validator',
      'fastify-swagger',
    ],
  },
```
