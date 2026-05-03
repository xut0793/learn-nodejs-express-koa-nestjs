# 环境变量

在现代应用程序开发中都需要某种形式的配置，这些配置通常包括端口号、服务账户凭证、数据库连接信息等。而且在不同的环境下，比如 development 、test、sit、uat、 staging 、 production 都有不同的配置信息。

常见的应用环境分类：

- 开发环境 (DEV: Development Environment)：直接通过源代码编译打包，其会跑单元测试，服务API自动化测试QA ，服务UI自动化测试
- 测试环境 (TEST: Test Environment)：部署带版本的组件，服务API自动化测试，服务 UI自动化测试QA
- 系统集成环境 (SIT: System Integration Test Environment)：部署带版本的组件，服务API自动化测试，服务U自动化测试，多系统集成API测试，多系统集成UI自动化测试。
- 用户可接受性测试环境 (UAT: User Acceptance Test Environment)：部署带版本的组件，此环境主要用来进行软件产品的验收，用户(客户方)会直接参与，用户根据需求功能文档进行验收，当然在用户验收前可以可以跑API自动化测试和UI自动化测试。此外根据客户项目合同要求，可能需要出具可接受性测试报告:包括但不限于，功能性测试报告，安全测试报告，性能测试报告等
- 预生产环境 (STAGING: Staging Environment)：部署带版本的组件，一般在直接上生产环境之前，会进行一些基本健康测试自动或者手工，有的时候还会进行模拟生产环境的真实数据进行Dry Run，其Dry Run很多时候都是在正常生产环境的配置和网络条件下进行的，Dry Run之后，没有问题了，就会把预生产环境切换回来，或者直接上生产环境，从预生产环境集群切换到生产环境集群的方法有:蓝绿部署，A/B测试，金丝雀部署灰度发布等方法。
- 生产环境 (PROD: Production Environment)：部署带版本的组件，正式生产环境。
- 灾备环境 (DR: Disaster Recovery Environment)：部署带版本的组件，对于一些服务可用性，可连续性有特别要求，比如关系到国计民生的系统，需要进行灾备

```
     +------------------------------+
     |     DEV 开发环境              |  必有
     +-------------+----------------+
                   |
     +-------------v----------------+
     |     TEST 测试环境             |  可选
     +-------------+----------------+
                   |
     +-------------v----------------+
     |    SIT 集成环境                |  必有
     +-------------+----------------+
                   |
     +-------------v----------------+
     |   UAT 用户可接受性测试环境       |  可选
     +-------------+----------------+
                   |
     +-------------v----------------+
     |   STAGING 预生产环境           |  可选
     +----+------------------+------+
          |                  |
+---------v-----+     +------v--------+
| PROD 生产环境   |     |  DR 灾备环境   |
+---------------+     +---------------+
      必有                  可选
```

所以如何设置不同的项目环境和如何读取不同环境下的配置参数。

- 认识 process 、 process.env 、process.env.NODE_ENV
- 认识 cross-env
- 认识 .env 文件和加载程序 dotenv

## process

`process` 是 node 原生提供的一个全局对象，在 node 环境下的任何地方都能访问到它，无需引入额外模块。通过这个对象提供的属性和方法，使我们可以对当前运行的程序的 node 进程进行访问和控制。

```js
console.log(process) // 输出一长串属性，显示进程信息，也提供一系列方法获取相关信息，如 process.cwd() 获取当前工作目录(current work directory)
```

## process.env

`process.env` 属性会返回包含用户环境相关参数的对象

> [你应该知道的 Windows 环境变量](https://zhuanlan.zhihu.com/p/67726501)

```js
console.log(process.env)
// 输出，根据个人电脑上安装的不同程序，输出变量会有不同
{
  HOME: 'C:\\Users\\xuxx29099',
  HOMEPATH: '\\Users\\xuxx29099',
  LANG: 'zh_CN.UTF-8',
  NODE_PATH: 'D:\\nvm\\node_global\\node_modules',
  // 省略更多...
}
```

可以看出，`process.env`输出对象的惯例是大写。但在 Windows 操作系统上，环境变量不区分大小写。所以以下小写仍然可以正确输出：

```js
console.log(process.env.node_path)
```

> 但是便于程序跨系统运行，尽量统一使用大写。

另外，`process.env`表示的对象可以进行修改，比如增加属性和删除属性。虽然是在 node 全局对象 process 上修改，但是这些修改仅对当前进程有效，不会反映到其它进程或线程中（除非明确地要求）。

```js
// a.js
process.env.FOO = "bar"
console.log(process.env.FOO)

// b.js
console.log(process.env.FOO)
```

```
node a.js # 输出 bar
node b.js # 输出 undefined
```

在 `process.env` 上为属性赋值会隐式地将值转换为字符串。

> 当值不是字符串、数字或布尔值时，Node.js 未来的版本可能会抛出错误，所以对于引用对象赋值，建议统一使用 `JSON.stringify`转为字符串。

```js
process.env.TEST = null
console.log(typeof process.env.TEST, process.env.TEST)
// =>  string null

process.env.TEST = undefined
console.log(typeof process.env.TEST, process.env.TEST)
// => string undefined

process.env.TEST = true
console.log(typeof process.env.TEST, process.env.TEST)
// => string true
```

使用 `delete` 可以从 `process.env` 中删除属性。

```js
process.env.TEST = 1
delete process.env.TEST
console.log(process.env.TEST)
// => undefined
```

总结：

- `process.env`对象的属性惯例是大写。
- `process.env`对象属性可以进行修改，如增加和删除属性，且修改只对当前 process 进程有效。
- `process.env` 上为属性赋值会隐式地将值转换为字符串。
- `process.env` 上的属性可以使用 `delete` 删除。

## process.env.NODE_ENV

`NODE_ENV` 并不是 `process.env` 对象的原生属性。正如上面 `process.env` 所讲的，可以对其进行添加属性，所以 process.env.NODE_ENV 就是属于自定义添加的属性。

`NODE_ENV` 最早是由 `Express` 框架普及的，慢慢变成了一个约定成俗的环境变量，用来指定运行 js 应用程序的环境，例如开发 development，生产 production，测试 test等环境。

> [您应该了解的NODE_ENV](https://dzone.com/articles/what-you-should-know-about-node-env)<br/>同样的，也是由 Express 普及的变量 `process.env.PORT`

## process.argv

除了在 js 文件中直接设置 `process.env` 对象属性，常见的操作是通过命令行传入参数，或者在 run-script 中传入参数，比如：

```
# cmd powershell git-bash
node test.js a=1 b=2 c
```

```json
// package.json
"scripts": {
  "start": "node test.js a=1 b=2 c",
},
```

这些命令行传入的参数在 js 文件内是如何被解析到的呢？

这就是利用了 node 的 process.argv 对象会返回一个数组，其中包含当 Node.js 进程被启动时传入的命令行参数。

```js
// argstest.js
process.argv.forEach((val, index) => {
  console.log(`${index}: ${val}`)
})
```

```
node test.js a=1 b=2 c d
```

```js
// 输出
0: D:\nodejs\node.exe
1: E:\develop\test\argstest.js
2: a=1
3: b=2
4: c
5: d
```

其中 ：

- `process.argv[0]` 表示当前 node 可执行文件(node.exe) 所在路径，通常情况下，也可以使用 `process.execPath`和`process.argv0`获取。但注意`process.argv0`稍有差异。
- `process.argv[1]` 表示正被执行的 JavaScript 文件的路径。
- 其余为传入的参数，以空格为边界输出。

`process.argv` 要特别区分`process.execArgv`：
`process.execArgv` 属性返回当 Node.js 进程被启动时，Node.js 特定的命令行选项。 这些特定的选项不会在 `process.argv` 返回的数组中出现。
同样的，`process.execArgv` 也不会包含 Node.js 的可执行脚本名称后面出现的非特定选项。

```
node --harmony script.js --version
```

```js
console.log(process.execArgv) // 输出 ['--harmony']
consoe.log(process.argv) // 输出 ['D:\nodejs\node.exe', 'E:\develop\test\argstest.js', '--version']
```

总结：

- node 命令行输入参数会存入 `process.argv` 数组中，且从数组第三项开始。第一项为node可执行文件路径，第二项为当前被执行文件的路径。
- node 命令行上针对 node 平台的命令参数和自定义执行程序的命令参数区别：`process.execArgv` 和 `process.argv`。

## cross-env

`cross-env`是一个跨平台设置和使用环境变量的脚本。

是为了抹平不同系统对环境变量操作方式的差异，主要是 window 系统平台和 POSIX 系统平台之间的差异。

> 可移植操作系统接口（英语：Portable Operating System Interface，缩写为 POSIX，最后的 X 则表明其对 Unix API 的传承。）是 IEEE 为要在各种 UNIX 操作系统上运行的软件定义 API 的一系列互相关联的标准的总称。Linux 系统基本上实现了 POSIX 标准，windows 部分实现了 POSIX 标准。

在 linux 系统下操作环境变量

> git bash 中操作同 linux 系统。

```
# 查看所有的环境变量
env

# 输出指定环境变量，使用 $ 表示变量名。node中常用的到的环境变量是NODE_ENV，查看是否存在
echo $NODE_ENV

# 如果不存在则添加环境变量，使用 exprot 添加的环境变量是临时的，只在当前 shell 环境下生效，关闭 shell 后将失效。如果需要永久修改需要在配置文件中修改。
export NODE_ENV=production

# 环境变量追加值
export path=$path:/home/download:/usr/local/

# 某些时候需要删除环境变量
unset NODE_ENV
```

在 window 系统的 CMD 中操作环境变量。

同样的，命令行中设置和修改的环境变量只会在当前窗口下有效，设置和修改只是临时缓存，一旦关闭命令窗口，环境变量就会失效。如果要设置真实的持久性的环境变量，可以去我的电脑->属性->更改设置->高级->环境变量，添加和设置环境变量，然后注销/重启。

```
# 查看所有环境变量
set

# 查看单个环境变量
set NODE_ENV

# 添加/更新环境变量
set NODE_ENV=development

# 环境变量追加值 set 变量名=%变量名%;追加的变量内容
set path=%path%;C:\web;C:\Tools

# 删除环境变量
set NODE_ENV=
```

在 window 10 以上系统中使用 powershell 终端上操作环境变量。

```
# 查看所有环境变量
ls env:

# 搜索环境变量
ls env:NODE*

# 查看单个环境变量
$env:NODE_ENV

# 添加/更新环境变量
$env:NODE_ENV=development

# 环境变量追加值
$env:path+=";c:\your_path"

# 删除环境变量
del evn:NODE_ENV
```

正因为存在不同系统平台的差异，当我们需要使用环境变量来执行脚本文件时，可能要为不同环境准备不同的 run-script 命令。

```js
// test.js
console.log(env.NODE_ENV)
```

```json
// package.json
"scripts": {
    "run:windwos": "set NODE_ENV=production && node test.js",
    "run:linux": "export NODE_ENV=production && node test.js",
    // 在 linux 平台下，可以省略 export
    "run": "NODE_ENV=production node test.js",
  },
```

为了避免以上这种问题，因此 cross-env 出现了，我们就可以使用 cross-env 命令，这样我们设置或使用环境变量时就不必担心平台了。也就是说 cross-env 能够提供一个设置环境变量的脚本，使得我们就能够以unix方式设置环境变量，然后在windows上也能够兼容执行。

```json
// package.json
"scripts": {
    "run": "cross-env NODE_ENV=production node test.js",
    // 多个环境变量
    "more": "cross-env FIRST_ENV=one SECOND_ENV=two node ./my-program"
  },
```

### 部分源码解析

基本原理就是 `cross-env` 作为执行命令，`NODE_ENV=production node test.js`为执行该命令的参数，`cross-env`通过解析参数获取环境变量设置和脚本执行。

> [cross-env github](https://github.com/kentcdodds/cross-env/blob/master/src/index.js)

```js
// cross-env 的入口文件 "cross-env": "src/bin/cross-env.js"
#!/usr/bin/env node
const crossEnv = require('..')
crossEnv(process.argv.slice(2)) // process.argv.slice(2) 截取到参数：NODE_ENV=production node test.js
```

```js
// src/index.js
module.exports = crossEnv
function crossEnv(args, options = {}) {
  // args = ['NODE_ENV=production', 'node', 'test.js']
  // 通过 parseCommand 函数解析出预设的环境变量 执行命令 命令参数
  // parseCommand 函数将首次匹配不到 env=value 形式后的参数作为用户需要执行的命令和参数，
  // 所以需要通过 cross-env 设置的环境变量都需要在业务命令之前，之后的作为业务命令自身执行的参数
  const [envSetters, command, commandArgs] = parseCommand(args)
  const env = getEnvVars(envSetters)
  if (command) {
    // 使用解析后的 env 执行业务命令
    const proc = spawn(
      // run `path.normalize` for command(on windows)
      commandConvert(command, env, true),
      // by default normalize is `false`, so not run for cmd args
      commandArgs.map((arg) => commandConvert(arg, env)),
      {
        stdio: "inherit",
        shell: options.shell,
        env,
      },
    )
  }
  return null
}

const envSetterRegex = /(\w+)=('(.*)'|"(.*)"|(.*))/
function parseCommand(args) {
  const envSetters = {}
  let command = null
  let commandArgs = []
  for (let i = 0; i < args.length; i++) {
    const match = envSetterRegex.exec(args[i])
    if (match) {
      let value

      if (typeof match[3] !== "undefined") {
        value = match[3]
      } else if (typeof match[4] === "undefined") {
        value = match[5]
      } else {
        value = match[4]
      }

      envSetters[match[1]] = value
    } else {
      // No more env setters, the rest of the line must be the command and args
      let cStart = []
      cStart = args
        .slice(i)
        // Regex:
        // match "\'" or "'"
        // or match "\" if followed by [$"\] (lookahead)
        .map((a) => {
          const re = /\\\\|(\\)?'|([\\])(?=[$"\\])/g
          // Eliminate all matches except for "\'" => "'"
          return a.replace(re, (m) => {
            if (m === "\\\\") return "\\"
            if (m === "\\'") return "'"
            return ""
          })
        })
      command = cStart[0]
      commandArgs = cStart.slice(1)
      break
    }
  }

  return [envSetters, command, commandArgs]
}

function getEnvVars(envSetters) {
  const envVars = { ...process.env }
  Object.keys(envSetters).forEach((varName) => {
    envVars[varName] = varValueConvert(envSetters[varName], varName)
  })
  return envVars
}
```

## .env 文件

当我们的项目需要声明很多环境变量的时候，命令行声明的形式显然过于繁琐，而且难以管理。.env 文件允许我们将所有项目需要的环境变量放在一个单独的文件中，然后一并加载进process.env。我们可以自己编写脚本去加载.env文件，不过更加简便和推荐的方式是使用 dotenv。当然实际上最简单的也可以直接设置一个不同环境变量的 js 文件来保存，但是这类变量参数往往是具有一定私密性的，一般不会跟随代码库一起保存。

所以 .env 文件是一个用于将环境变量传给应用程序的隐藏文件（.gitignore 一般会设置忽略 .env 文件），它可以用来存储你想保密或者隐藏的数据， 例如，它可以存储第三方服务的 API 密钥或者数据库 URI， 也可以使用它来存储配置选项， 通过设置配置选项，你可以改变应用程序的行为，而无需重写一些代码。

### dotenv

而对 .env 文件的加载，我们可以自己编写脚本通过 fs 读取文件，不过更加简便和推荐的方式是使用 dotenv ，它是一个零依赖模块，可将 .env 文件中的环境变量加载到 process.env 中。

> [dotenv npm](https://www.npmjs.com/package/dotenv)

```sh
pnpm add dotenv
```

#### 使用非常简单

```js
// common.js
require("dotenv").config()

// es module
import "dotenv/config"

// 上述调用之后就可以从 process.env.variable 获取配置的变量值
```

#### 配置选项

```js
import dotenv from "dotenv"
const result = dotenv.config(options)

if (result.error) {
  throw result.error
}

// 此时除了分配到了 process.env 外，也会把解析到所有变量返回 parsed 上。
const config = result.parsed
```

其中 options 配置

```js
path: path.resolve(process.cwd(), '.env') // 默认读取根目录下的 .env 文件
encoding: 'utf8'
debug: false, // 打开日志记录以帮助调试某些键或值未按预期设置的原因。
override: false, // 用.env文件中的值覆盖已经在计算机上设置的任何环境变量。
processEnv: process.env, // 指定要将加载的变量写入到那里，默认为环境变量 process.env 上。

```

#### 解析规则如下：

```
- `BASIC=basic` 变为 `{BASIC： 'basic'}`
- 跳过空行
- 以 `#` 开头的行被视为注释
- 空值变为空字符串`（EMPTY= 变为 {EMPTY： ''}）`
- 对象形式字符串会解析为 json 字符串，保留内部引号，类似 JSON.stringify 的效果，`JSON={“foo”： “bar”} 变为 {JSON：“{\”foo\“： \”bar\“}”`
- 单引号会转成双引号 SINGLE_QUOTE='quoted' 变为 {SINGLE_QUOTE： “quoted”}
- 不带引号的两端会删除空格 FOO= some value 为 {FOO： 'some value'}
- 单引号或双引号内的空格保留 `FOO=" some value "` 为 `{FOO: ' some value '}`
- 支持反引号，比如反引号内同时有单引号和双引号时。
```

#### 加载优先级

默认配置中 override 值是 false，所以只要一个环境变量已经被设置过，dotenv就不会修改它 。也就是说，dotenv始终以先加载到的变量声明为更高优先级。

目前约定成俗的优先级顺序是： .env.local 文件中定义的环境变量获得最高优先级，.env.development 其次，.env 中的通用配置优先级最低。

```js
// 按优先级由高到低的顺序加载.env文件
dotEnv.config({ path: `${pathsDotenv}.local` }) // 加载.env.local
dotEnv.config({ path: `${pathsDotenv}.development` }) // 加载.env.development
dotEnv.config({ path: `${pathsDotenv}` }) // 加载.env
```

### dotenv-expand

另外，可以使用 使用dotenv-expand 开启.env文件的模板字符串语法。比如可以复用已定义的变量赋值等。

比如，有时我们希望将某几个环境变量拼接为一个新的环境变量，可能会考虑如下的写法：

```
NAME = lisa
AGE = 40

NAME_AND_AGE = ${NAME}-is-${AGE}-years-old # 输出的值是：lisa-is-40-years-old
```

使用 dotenv 和 dotenv-expand 加载配置

```js
var dotenv = require("dotenv")
var dotenvExpand = require("dotenv-expand")

var myEnv = dotenv.config()
dotenvExpand.expand(myEnv)

console.log(process.env) // DB_PASS="s1mpl3"
```

#### 扩展规则如下：

- `$KEY` 将扩展为环境中字段 KEY 的值
- `${KEY}` 将扩展为环境中字段 KEY 的值，同 `$KEY` 一样，只是此方式定义还便于扩展默认值，如果没有默认值，推荐 `$KEY` 方式。
- `\$KEY` 忽略`$KEY` 而不是扩展
- `${KEY:-default}` 如果环境中没有对应 KEY 的值，将返回默认值

```js
// dotenv-expand 源中取值顺序
envValue = process.env[KEY] || defaultValue || dotenv.config().parsed[KEY] || ""
```

## 实践

### 安装依赖

```sh
p add dotenv dotenv-expand
p add -D cross-env
```

### 修改 script 命令

```json
"scripts": {
  "dev": "cross-env NODE_ENV=development nodemon ./index.js",
  "build:prod": "cross-env NODE_ENV=production nodemon ./index.js",
  "build:sit": "cross-env NODE_ENV=sit nodemon ./index.js"
},
```

### 配置文件

统一在 config 目录下新建环境配置文件

```javascript
project
├── src
│   ├── index.js
│   └── config
│       ├── index.js
│       ├── .env
│       ├── .env.development
│       ├── .env.production
│       └── .env.local
└── package.json
```

配置 .gitignore 文件，将 .env.local 文件忽略，不提交代码库。所以 .env.local 中可以配置仅本地使用的敏感凭据。

### 设置中间件

在 config/index.js 中编码中间件逻辑，将当前环境中获取的变量注入到应用的全局变量上，如 express 中的 app.local.config 或 koa 中的 ctx.state.config。

并且在中间件加入对环境变量的校验逻辑。

```js
/*
 * @Author       : xut
 * @Description  : 获取本地 .env 文件的配置变量，挂载到 app.locals.config 中。
 *                 本中间件应该在注册在第一位，以保证后续中间件对环境变量的访问。
 *
 * 使用 zod 增加环境变量校验规则：
 * 默认情况下，未知环境变量（其键不存在于模式中的环境变量）是允许的，并且不会触发验证异常。
 * 默认情况下，报告所有验证错误。 你可以通过 forRoot() 选项对象的 validationOptions 键传递一个选项对象来改变这些行为。
 * - allowUnknown: 控制是否允许环境变量中的未知键。 默认为 true
 */
import { resolve } from "node:path"
import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand"
import { z } from "zod"

export const envConfigSchema = z.object({
  BAR: z.string(),
  FOO_BAR: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "staging"])
    .default("development"),
})

export function envParser(options) {
  const envDir = options?.envDir ?? process.cwd()
  const dotenvPath = resolve(envDir, ".env")
  const nodeEnv = process.env.NODE_ENV
  const validationSchema = options?.validationSchema
  const validationOptions = {
    allowUnknown: options?.validationOptions?.allowUnknown ?? false,
  }

  const localResult = dotenv.config({
    path: `${dotenvPath}.local`,
  })

  const envResult = dotenv.config({
    path: `${dotenvPath}.${nodeEnv}`,
  })

  const commonResult = dotenv.config({
    path: dotenvPath,
  })

  const dotenvResult = {
    parsed: {
      ...commonResult.parsed,
      ...envResult.parsed,
      ...localResult.parsed,
    },
  }

  const expandedResult = dotenvExpand.expand(dotenvResult)

  let error =
    localResult.error ||
    envResult.error ||
    commonResult.error ||
    expandedResult.error

  if (!error && validationSchema) {
    const zodSchema = validationOptions.allowUnknown
      ? validationSchema.passthrough()
      : validationSchema
    const result = zodSchema.safeParse({
      ...expandedResult.parsed,
      NODE_ENV: nodeEnv,
    })

    if (!result.success) {
      error = new Error(JSON.stringify(result.error.format()))
    }
  }

  return (req, res, next) => {
    if (error) {
      next(error)
    } else {
      if (req.app) {
        // express 框架会将当前 app 实例赋值到 req.app 上。
        // 中间件是每个请求过来都会执行，所以如果当前应用 app 中已挂载 config 则不需要再赋值了。
        if (!req.app.locals?.config) {
          req.app.locals = {
            ...req.app.locals,
            config: expandedResult.parsed,
          }
        }
      } else {
        // 如果 req.app 不存在，则为每个请求周期内都赋值一遍。
        req.locals = {
          ...req.locals,
          config: expandedResult.parsed,
        }
      }

      next()
    }
  }
}
```

koa 中定义中间件的区别在于赋值对象为 `ctx.state.config`

```js
return (ctx, next) => {
  if (error) {
    next(error)
  } else {
    // 中间件是每个请求过来都会执行，所以如果当前应用 app 中已挂载 config 则不需要再赋值了。
    if (!ctx.state?.config) {
      ctx.state = {
        ...ctx.state,
        config: expandedResult.parsed,
      }
    }

    next()
  }
}
```

### 使用中间件

#### node

```js
import { createServer } from "node:http"
import { resolve } from "node:path"
import { createRouter } from "../src/lib/router.js"
import { envParser, envConfigSchema } from "../src/parser/env-parser.js"

const router = createRouter()

router.use(
  envParser({
    envDir: resolve(process.cwd(), "./09-environment/config"),
    validationSchema: envConfigSchema,
    validationOptions: {
      allowUnknown: true,
    },
  }),
)

router.get("/environment", (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" })
  res.end(
    JSON.stringify({
      NODE_ENV: process.env.NODE_ENV,
      ...req.locals.config,
    }),
  )
})

const app = createServer(router)
app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
```

express 使用

```js
import { resolve } from "node:path"
import express from "express"
import { envParser, envConfigSchema } from "../../node/src/parser/env-parser.js"

const app = express()
app.use(
  envParser({
    envDir: resolve(process.cwd(), "./09-environment/config"),
    validationSchema: envConfigSchema,
    validationOptions: {
      allowUnknown: true,
    },
  }),
)

app.get("/environment", (req, res) => {
  res.json(req.app.locals.config)
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
```

koa 使用

```js
import { resolve } from "node:path"
import Koa from "koa"
import Router from "@koa/router"
import { envParser, envConfigSchema } from "./env.middleware.js"

const router = new Router()

router.get("/environment", (ctx) => {
  ctx.body = ctx.state
})

const app = new Koa()

app
  .use(
    envParser({
      envDir: resolve(process.cwd(), "./09-environment/config"),
      validationSchema: envConfigSchema,
      validationOptions: {
        allowUnknown: true,
      },
    }),
  )
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
```

## nestjs 配置

在 Nestjs 中通过开箱即用的 @nestjs/config 包，内部使用 dotenv 来加载适当的 .env 文件。

使用时通过注册 ConfigModule，并公开一个 ConfigService 来获取环境变量。

```sh
pnpm add @nestjs/config
```

该模块提供的功能包括：

- 默认加载 .env 文件，使用 dotenv 依赖。
- 通过 expandVariables: true，来启用扩展 dotenv-expand 依赖
- 通过 envFilePath 属性配置自定义路径的 .env 文件， 可以是自符串，或数组配置，数组配置从优先级从前到后。
- 通过 load 自定义配置加载逻辑，比如 yaml 配置文件等
- 通过在 appModule 中注册后，开启 isGlobal: true，则全局模块可用。
- 局部注册，加载特定配置文件，可使用 ConfigModule.forFeature(dataConfig)
- 通过 validate 或 validationSchema 配合 validationOptions 来定义配置的验证逻辑

[@nestjs/config 使用](https://nest.nodejs.cn/techniques/configuration)

定义 zod 校验逻辑

```ts
// src/common/config/env.validation.ts
import { SafeParseError, z } from "nestjs-zod/z"

const envConfigSchema = z.object({
  BAR: z.string(),
  FOO_BAR: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "staging"])
    .default("development"),
})

type envConfig = z.infer<typeof envConfigSchema>

export function envConfigValidate(config: Record<string, unknown>) {
  // 默认情况下，Zod 对象的模式在解析过程中会剥离出未被识别的 keys，但为了保持符合 nestjs 默认验证器 joi 的默认行为：
  // 使用.passthrough()，通过未知的 keys。
  // 例用 safeParse，自行处理验证错误，即返回所有验证错误。

  const result = envConfigSchema.passthrough().safeParse(config)

  if (result.success) {
    return result.data
  } else {
    throw new Error(
      JSON.stringify((result as SafeParseError<envConfig>).error.format()),
    )
  }
}
```

app.module.ts 中注册

```ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: [
        "./src/common/config/.env.local",
        `./src/common/config/.env.${process.env.NODE_ENV}`,
        "./src/common/config/.env",
      ],
      validate: envConfigValidate,
    }),
    EnvironmentCaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

使用

```ts
// environmentCaseController.ts
@Controller("environment")
export class EnvironmentCaseController {
  constructor(private readonly envCaseService: EnvironmentCaseService) {}

  @Get()
  getEnvironment() {
    return this.envCaseService.getEnvironment()
  }
}

// environmentCaseService.ts
@Injectable()
export class EnvironmentCaseService {
  constructor(private readonly configService: ConfigService) {}

  getEnvironment() {
    return {
      BAR: this.configService.get<string>("BAR"),
      FOO: this.configService.get<string>("FOO_BAR"),
    }
  }
}
```
