# winston 使用

[A Complete Guide to Winston Logging in Node.js](https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/#log-levels-in-winston)

## 安装

```sh
pnpm add winston
```

## 创建日志记录器

使用 winston 推荐的方法是创建一个独立的 logger 实例。

```js
const logger = winston.createLogger(options)
```

其中 options 选项包括：

```js
options = {
  level: "info", // 只会输出该等级和比它严重等级的日志，比它低的等级会忽略
  levels: winston.config.npm.levels, //  日志等级体系，默认为 npm，可选的值为：
  format: winston.format.json, // 日志格式化规范，默认 json
  transports: [], // 日志传输器，即设置日志存放位置，默认为空，可选的值为 控制台输出 Console，存入本地文件 File，发送到远程服务 HTTP
  exitOnError: true, // 是否在处理到异常后退出进程
  silent: false, // 是否静默，忽略所有日志打印
}
```

创建了日志记录器后，有统一的 log 方法打包日志，也可以以使用日志的级别方法进行打印。

```js
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
})
logger.log("silly", "log silly")
logger.error("winston error")
logger.warn("winston warn")
logger.info("winston info")
logger.debug("log debug")

// 默认日志级别是 info，忽略 debug / silly，并且默认格式 json，所以控制台只会输出以下日志
{"level":"info","message":"winston info"}
{"level":"error","message":"winston error"}
{"level":"warn","message":"winston warn"}
```

## level 控制输出日志级别

options.level 默认 info, 表示只会输出该等级和比它严重等级的日志，比它低的等级会忽略。

设置日志级别的最佳做法是使用环境变量，这样就能控制不同环境输出日志的级别了，比如生产环境只记录 warn 及以上日志，测试环境设置info，开发环境设置 debug等。

```js
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
})
```

当然，在创建记录时确定的日志级别并不是固定的，也可以在后续设置传输器时指定输出日志级别，优先级高 options.level。

```js
const logger = winston.createLogger({
  level: "debug",
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.Console({ level: "silly" }),
    new winston.transports.File({
      filename: "combined.log",
      level: "error",
    }),
  ],
})
```

如果把 transport 实例对象单独定义，也可以动态设置

```js
const transports = {
  console: new winston.transports.Console({ level: "warn" }),
  file: new winston.transports.File({
    filename: "combined.log",
    level: "error",
  }),
}

const logger = winston.createLogger({
  transports: [transports.console, transports.file],
})

logger.info("Will not be logged in either transport!") // 不会输出，info < warn < error
transports.console.level = "info"
transports.file.level = "info"
logger.info("Will be logged in both transports!") // 会输出
```

## levels 日志级别

levels 定义日志的严重性，通用约定整数越小，认为越严重。

winston 内置了三套日志级别

- winston.config.npm.levels
  ```js
  {
    error: 0, // 严重错误
    warn: 1, // 警告
    info: 2, // 信息
    http: 3, // http
    verbose: 4, // 冗长的，详细的
    debug: 5, // 调试
    silly: 6 // 临时的，随意的
  }
  ```
- winston.config.syslog.levels
  ```js
  {
    emerg: 0,
    alert: 1,
    crit: 2,
    error: 3,
    warning: 4,
    notice: 5,
    info: 6,
    debug: 7
  }
  ```
- winston.config.cli.levels
  ```js
  {
    error: 0
    warn: 1
    help: 2
    data: 3
    info: 4
    debug: 5
    prompt: 6
    verbose: 7
    input: 8
    silly: 9
  }
  ```
  对应的每个日志级别还有对应的颜色设置，以便需要颜色输出时进行着色，具体见 format 章节。

另外，如果不满足内置的日志级别，也可以自定义。主要是约定好 levels 和 colors。

```js
const customLevels = {
  levels： {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    fatal: 'red',
    error: 'magenta',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'purple',
  }
};
```

使用

```js
const customLevelLogger = winston.createLogger({
  levels: myCustomLevels.levels,
})
winston.addColors(customLevels.colors)
```

## format 格式

默认情况下，winston 以 json 格式输出。但也可以在 format 属性上定义其它格式。

winston.format 属性提供了各种格式化工具，内部依赖于 [winston/logform](https://github.com/winstonjs/logform) 包实现。

提供了以下几种格式选择：

```
CLI
Simple
Printf
PadLevels
PrettyPrint
JSON
Logstash
Errors
Splat
Align
Timestamp
Colorize
Uncolorize
Label
Metadata
```

如果要同时应用多种格式，则需要工具函数 combine 来组合。并且对于有些样式组合有先后要求，比如着色必须在 simple 之前。

```js
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    winston.format.align(),
    winston.format.printf(
      (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
  ),
})

logger.info("log info")

// 输出
// [2024-01-19 23:24:24.386 PM] info:      winston info
```

更多的关于各个格式的配置及信息筛选，可以访问 logform 主页查看。

虽然可以按照任何希望的方式设置日志的格式，但对于服务器应用程序，建议的做法是坚持使用结构化日志记录格式（如 JSON），以便日志可以轻松进行筛选和收集，或对接日志监控系统等用途。

对于开发或调试时，输出控制台的日志格式，可以设置性能更高的字符串形式，如 simple / printf，搭配颜色 colorize 和点位符语法 splat 等进行组合。

## transports 传输器

transports 传输是指设置如何输出或存储日志。Winston 通过分离 transports 的设置，在选择日志传输方面提供了极大的灵活性。默认情况下，Winston 中提供以下传输选项：

- Console : 将日志输出到 Node.js 控制台。
- File : 将日志消息存储到一个或多个文件中。
- HTTP : 将日志流式传输到某个远程的 HTTP 端点处理。
- Stream : 将日志输出到任何 Node.js 流中传输。

示例演示下所有内置传输器的使用。

```js
import winston from "winston"
import { createServer } from "node:http"
import { Writable } from "node:stream"
// 创建可写流
const { Writable } = require("stream")
const stream = new Writable({
  objectMode: false,
  write: (raw) => console.log("stream msg", raw.toString()),
})

// 创建http服务
const http = require("http")
http
  .createServer((req, res) => {
    const arr = []
    req
      .on("data", (chunk) => arr.push(chunk))
      .on("end", () => {
        const msg = Buffer.concat(arr).toString()
        console.log("http msg", msg)
        res.end(msg)
      })
  })
  .listen(8080)

// 配置 4 种通道
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Http({ host: "localhost", port: 8080 }),
    new winston.transports.Stream({ stream }),
  ],
})

// 打印日志
logger.info("winston transports")
```

自定义传输器，可以实现将日志存储在数据库、上传日志监控系统等功能。例如传输到 MongoDB 或者 Kafka 或者 ElasticSearch 等等。

在实现上，只要写一个类，继承自 winston.Transport，那么 winston 接收到日志之后会触发类的 log 方法执行，参数就是包含日志的消息对象，所以自定义传输通道的逻辑是：

- 在 constructor 构造函数里面建立远程连接（MongoDB、Kafka、ElasticSearch...）
- 在 log 方法里面处理和发送消息。

```js
import winston, { Transport } from "winston"
class CustomTransport extends winston.Transport {
  constructor(opts) {
    super(opts)
  }

  log(info, callback) {
    console.log("info", info)
    callback()
  }
}

const logger = winston.createLogger({
  transports: [new CustomTransport()],
})
```

下面是一些常见的自定义传输器的实现：

- winston-mongodb: 将日志存储到 MongoDB。
- winston-mysql: 将日志存储在 MySQL 中。
- @logtail/winston: 发送日志到 Logtail 系统。

### 文件传输器

重点讲下文件传输器的实践。在开发和测试环境时常用 Console 输出，在生产环境将日志输出到文件时，格式化就选用 json，并且不需求影响性能的着色、对齐相关的格式了。

```js
const winston = require("winston")
const { combine, timestamp, json } = winston.format

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), json()),
  transports: [
    new winston.transports.File({
      filename: "combined.log",
    }),
  ],
})

logger.info("Info message")
logger.error("Error message")
logger.warn("Warning message")
```

在生产环境中，将所有日志记录到单个文件中并不推荐，因为这会使筛选关键问题变得困难，因为文件中混杂了无关紧要的日志。更推荐的做法是使用两个文件传输，一个将所有消息记录到组合的 combined.log 文件中，另一个将错误的消息记录到单独的文件中。

```js
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), json()),
  transports: [
    new winston.transports.File({
      filename: "combined.log",
    }),
    new winston.transports.File({
      filename: "error.log",
      level: "error", // 将覆盖全局的 level 设置
    }),
  ],
})
```

winston 对 level 的默认规则是，记录当前 level 以及严重程序高于它的级别。像上述 error.log 文件，如果用自定义的日志级别，在 error 级别之上还有 fatal，那么此时 error.log 文件中将会记录级别为 error 和 fatal 的日志。

如果实际需求只想在 error.log 文件中只记录 `level: error` 级别的日志，如何做呢？此时需要用到 format 格式中自定义格式。

```js
const errorFilter = winston.format((info, opts) => {
  return info.level === "error" ? info : false
})

const infoFilter = winston.format((info, opts) => {
  return info.level === "info" ? info : false
})

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), json()),
  transports: [
    new winston.transports.File({
      filename: "combined.log",
    }),
    new winston.transports.File({
      filename: "app-error.log",
      level: "error",
      format: combine(errorFilter(), timestamp(), json()), // 注意组合的先后顺序
    }),
    new winston.transports.File({
      filename: "app-info.log",
      level: "info",
      format: combine(infoFilter(), timestamp(), json()),
    }),
  ],
})
```

## 日志拆分

如果让程序的日志一直记录到同一个文件，不久之后，日志文件会变得非常大，并且管理起来很麻烦，这时就需要拆分日志文件了。

日志拆分可以约定自己的规则，比如，每天创建一个新的日志文件，并且自动删除早于某个时间段（例如 30 天）的日志文件。

Winston 提供了 winston-daily-rotate-file 模块。它根据日期或文件大小的配置进行日志文件拆分，并且也可以设置根据计数或经过的天数自动删除旧的日志文件。

安装

```sh
pnpm add winston-daily-rotate-file
```

使用

```js
const winston = require("winston")
require("winston-daily-rotate-file")

const { combine, timestamp, json } = winston.format

const fileRotateTransport = new winston.transports.DailyRotateFile({
  // winston transport 原本支持的 options
  level: "error",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), json()),
  dirname: resolve(process.cwd(), "./11-log/logs"),
  filename: "combined-%DATE%.log", // %DATE% = datePattern 模式的值

  // 扩展的 options
  frequency: NODE_ENV === "development" ? "1m" : null, // 定时分割文件，如果为 null，则使用 datePattern 属性
  datePattern: "YYYY-MM-DD", // 默认值 YYYY-MM-DD，按天分割文件模式，以 moment.js 的时间格式表示，当 frequency 未启用时生效
  zippedArchive: false, // 默认值 false, 是否对存档的日志文件进行 gzip 压缩
  maxSize: "10M", // 默认值 null，当文件大小超过该值时，分割文件
  maxFiles: "30d", // 当日志文件超过 30 天后自动删除
})

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), json()),
  transports: [fileRotateTransport],
})
```

也可以监听日志拆分的相关事件，添加需要的业务逻辑。

```js
// fired when a log file is created
fileRotateTransport.on("new", (filename) => {})
// fired when a log file is rotated
fileRotateTransport.on("rotate", (oldFilename, newFilename) => {})
// fired when a log file is archived
fileRotateTransport.on("archive", (zipFilename) => {})
// fired when a log file is deleted
fileRotateTransport.on("logRemoved", (removedFilename) => {})
```

## 向日志添加元数据

在实际项目中，需要向日志信息中统一添加一些通用信息。比如当前服务名称，请求链路ID等。通常有以下几种方法：

### defaultMeta 元数据

在创建记录器的选项中，通过 defaultMeta 属性注入全局信息，对象的内容将被注入到每条日志中。

```js
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: {
    service: "admin-service",
  },
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
})

logger.info("Info message")
logger.error("Error message")
```

此时输出信息内容为：

```js
{"level":"info","message":"Info message","service":"admin-service"}
{"level":"error","message":"Error message","service":"admin-service"}
```

### 子记录器

另一种方法是通过创建子记录器。如果某些元数据要添加到特定范围内的所有日志，比如将请求链路标识 requestId 添加到请求周期内的所有日志中。

```js
const childLogger = logger.child({
  requestId: "f9ed4675f1c53513c61a3b3b4e25b4c0",
})

childLogger.info("Info message")
childLogger.info("Error message")
```

输出信息为：

```js
{"level":"info","message":"Info message","requestId":"f9ed4675f1c53513c61a3b3b4e25b4c0","service":"admin-service"}
{"level":"error","message":"Error message","requestId":"f9ed4675f1c53513c61a3b3b4e25b4c0","service":"admin-service"}
```

### 单条日志追加额外信息

第三方法应用于对单条日志追加额外信息，可以如下操作：

```js
childLogger.info("File uploaded successfully", {
  file: "something.png",
  type: "image/png",
  userId: "jdn33d8h2",
})
```

输出信息为：

```js
{"file":"something.png","level":"info","message":"File uploaded successfully","requestId":"f9ed4675f1c53513c61a3b3b4e25b4c0","service":"admin-service","type":"image/png","userId":"jdn33d8h2"}
```

## 记录错误

### 记录错误堆栈信息

Winston 在处理错误消息时有一个疑惑的地方，就是在记录 Error 对象的实例会导致一条空消息。

```js
const winston = require("winston")
const { combine, timestamp, json } = winston.format
const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), json()),
  transports: [new winston.transports.Console()],
})

logger.error(new Error("an error"))
```

输出

```js
{"level":"error","timestamp":"2022-07-03T19:58:26.516Z"}
```

可以看到错误的 message 消息和错误堆栈都没有记录。这是因为对于错误的处理，在格式化时需要明确提供 errors 方法。

```js
const winston = require("winston")
const { combine, timestamp, json, errors } = winston.format
const logger = winston.createLogger({
  level: "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [new winston.transports.Console()],
})

logger.error(new Error("an error"))
```

此时输出

```js
{"level":"error","message":"an error","stack":"Error: an error\n    at Object.<anonymous> (/home/ayo/dev/betterstack/betterstack-community/demo/snippets/main.js:9:14)\n    at Module._compile (node:internal/modules/cjs/loader:1105:14)\n    at Module._extensions..js (node:internal/modules/cjs/loader:1159:10)\n    at Module.load (node:internal/modules/cjs/loader:981:32)\n    at Module._load (node:internal/modules/cjs/loader:827:12)\n    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:77:12)\n    at node:internal/main/run_main_module:17:47","timestamp":"2022-07-03T20:11:23.303Z"}
```

## 记录全局的异常

对于全局的未捕获的异常(uncaught exceptions)和未捕获的承诺拒绝(uncaught promise rejections)，winston 提供了即时可用的便捷方法，不需要业务逻辑上自行监听处理。

分别通过 exceptionHandlers 和 rejectionHandlers 属性指定应将这些事件指定传输器。

```js
const winston = require("winston")
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
  exitOnError: false, // 默认 true
  exceptionHandlers: [
    new winston.transports.File({ filename: "exception.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "rejections.log" }),
  ],
})

// 或者
// logger.exitOnError = false;
```

对全局未捕获的异常，Winston 有个默认行为：会在记录未捕获的异常后退出当前进程，并显示非零状态代码。如果要更改当前默认行为，可以将 exitOnError 属性设置为 false。

在生产环境推荐的做法是，保持 winston 的默认设置，记录未捕获的错误后立即退出，同时设置一些警报机制进行通知。然后由 Node.js 进程管理器（例如 PM2）以立即重新启动它。

## 记录链路时长

Winston 提供了 profile 方法，可以收集应用程序的一些基本性能数据。

```js
// start a timer
logger.profile("test")

setTimeout(() => {
  // End the timer and log the duration
  logger.profile("test")
}, 1000)
```

会输出一个时长字段 durationMs 属性包含计时器的持续时间（以毫秒为单位）

```
{"durationMs":1001,"level":"info","message":"test"}

```

另一种方式，实现同样效果

```js
// start a timer
const profiler = logger.startTimer()

setTimeout(() => {
  // End the timer and log the duration
  profiler.done({ message: "Logging message" })
}, 1000)
```

logger.profile 或 profiler.done 同其它 log 方法一样，可以将日志记录为特别等级 level。

```js
profiler.done({ message: "Logging message", level: "debug" })
// or
logger.profile("test", { level: "debug" })
```

## 多个记录器

大型应用程序通常具有多个记录器，这些记录器具有不同的设置，用于在不同区域进行日志记录。

通过 loggers 定义多个记录器

```js
const winston = require("winston")

winston.loggers.add("serviceALogger", {
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: {
    service: "service-a",
  },
  format: winston.format.logstash(),
  transports: [
    new winston.transports.File({
      filename: "service-a.log",
    }),
  ],
})

winston.loggers.add("serviceBLogger", {
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: {
    service: "service-b",
  },
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
})
```

上面添加了两个记录器，用于指定服务，使用了不同的配置。在使用时，可以通过 loggers.get 方法选择记录器。

```js
require("./loggers.js")

const winston = require("winston")

const serviceALogger = winston.loggers.get("serviceALogger")
const serviceBLogger = winston.loggers.get("serviceBLogger")

serviceALogger.error("logging to a file")
serviceBLogger.warn("logging to the console")
```

注意添加多记录器和创建子记录器的使用场景区别。
