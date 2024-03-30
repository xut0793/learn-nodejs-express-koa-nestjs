# Cron Jobs 定时任务

定时任务是经常被用到的，比如数据备份、日志清理等。在 node 中实现定时任务有以下方式：

- setTimeout
- setInterval
- 第三方依赖包，如 cron

使用 setTimeout 或 setInterval 可以实现简单的定时任务，而使用第三方库如 cron 可以实现更复杂的定时任务。

```js
// 1s 后执行
setTimeout(function () {
  console.log("Hello, World!")
}, 1000)

// 每隔 1s 执行一次
setTimeout(function () {
  console.log("Hello, World!")
}, 1000)
```

## Cron 表达式

在使用第三方库来定时调试任务的时候，通常使用 Cron 表达式来指定任务在某个时间点或者周期性的执行。

cron表达式是一个字符串，由5或6或7个字段组成，用空格分隔。其中秒和年字段是可选的。

每个字段的含义如图所示：

```
 * * * * * * *
 | | | | | | |
 | | | | | | year (optional)
 | | | | | day of week 0-7，但是0和7都是指周日
 | | | | month 1-12 (or names)
 | | | day of month 1-31
 | | hour 0-23
 | minute 0-59
 second(optional) 0-59
```

从左到右，依次对每个字段指定相应的值，就可以确定一个任务的执行时间点和周期了。值可以由数字配合字符来组合。

99%的情况下会用到的字符，在大部分使用cron的场景下， `* - / ?` 这几个常用字符就可以满足我们的需求了。

```
* ：每的意思。在不同的字段上，就代表每秒，每分，每小时等。
- ：指定值的范围。比如[1-10]，在秒字段里就是每分钟的第1到10秒，在分就是每小时的第1到10分钟，以此类推。
, ：指定某几个值。比如[2,4,5]，在秒字段里就是每分钟的第2，第4，第5秒，以此类推。
/ ：指定值的起始和增加幅度。比如[3/5]，在秒字段就是每分钟的第3秒开始，每隔5秒生效一次，也就是第3秒、8秒、13秒，以此类推。
? ：仅用于【日】和【周】字段。因为在指定某日和周几的时候，日期和星期这两个字段是互斥冲突的，应该通过设置一个问号来表明不想设置哪个字段，所以需要用【?】标识不生效的字段。比如【0 1 * * * ?】就代表每年每月每日每小时的1分0秒触发任务。这里的周就没有效果了。
```

极少能用到的字符

```
SUN ：仅用于【周】字段，表示星期日。也可以用数字0或都数字7设置。周日到周六分别为 SUN，MON，TUE，WED，THU，FRI和SAT，对应数字 (0/7) 1，2，3，4，5，6，注意0和7都表示周日，但是0更通用，大小写无关。
JAN : 仅用于【月】字段，表示1月份。也可以用数字1设置，1月到12月分别为 Jan、Feb、Mar、Apr 、May、Jun、Jul、Aug、Sept、Oct、Nov、Dec，对应数字 1 到 12，大小写无关。
L   ：即 Last，用于【日】【周】字段。这里需要注意的是，在不同的字段的不同使用方式，其含义有所差别。
      用于日字段：直接使用L代表每个月的最后一天。也支持偏移量的方式，配置[L-1]则代表每月的倒数第二天。
      用于周字段：直接使用L代表每周的最后一天，也就是等效于[7]或[SAT]，但是如果配合上数字，比如[7L]，则代表每个月最后一个周六，等效于[SATL]。目前Quartz支持。
W   : 仅用于【周】字段，表示最近的工作日。不是普遍支持该字符表示。
#   : 仅用于【周】字段，每月的第几个星期几，比如 6#3 表示每月的第三个周六。不是普遍支持该字符表示。
```

常见的表达式

```
0/2 * * * * ? 每2秒 执行
0 0/2 * * * ? 每2分钟 执行
0 0 2 1 * ? 每月1号的凌晨2点 执行
0 15 10 ? * 1-5 周一到周五，每天上午10:15 执行
0 15 10 ? 6L 2002-2006 2002-2006年的每个月的最后一个星期五上午10:15 执行
0 0 10,14,16 * * ? 每天上午10点，下午2点，下午4点 执行
0 * 14 * * ? 每天下午2点到下午2:59期间的每1分钟 执行
0 15 10 ? * 6#3 每月的第三个星期六上午10:15触发
0 0/5 14,18 * * ? 在每天下午2点到2:55期间和下午6点到6:55期间的每5分钟触发
0 10,44 14 ? 3 WED 每年三月的星期三的下午2:10和2:44触发
```

## node cron

nodejs 中用于定时任务的第三方常见的有 cron node-cron node-schedule，从npm 下载量看，cron 是目前使用较为广泛的一个。

```js
import { CronJob } from "cron"

// 两种初始化方式
const job = new CronJob(
  cronTime,
  onTick,
  onComplete,
  start,
  timeZone,
  context,
  runOnInit,
  utcOffset,
  unrefTimeout
)
const job = CronJob.from(options)
```

options 配置项：

- cronTime: 必填项，cron 表达式
- onTick: 必填项，执行的任务
- onComplete: 可选项，任务完成时的回调
- start: 可选项，默认值 false, 是否马上开发执行计时，如果为 false 时，需要手动调用 `job.start()` 方法开始调度
- timeZone: 可选项，设置执行的时区，默认值本地时区
- context: 可选项，
- runOnInit: 可选项，默认值 false，决定onTick是否在定时任务初始化阶段执行一次
- utcOffset: 可选项，以分钟为单位指定时区偏移量。不能与timeZone共存。
- unrefTimeout: 可选项，用于控制事件循环行为。

实例对象可用的方法：

- from(options): 创建一个新的 CronJob 实例对象，以对象形式入参
- start: 启动作业
- stop: 停止作业
- setTime: 重新设置 cronTime 时间
- lastDate: 提供最后执行日期
- nextDate: 指示将激活onTick的后续日期
- fireOnTick：允许修改onTick调用行为。
- addCallback: 允许添加onTick回调。

示例：

```js
import { CronJob } from "cron"

const job = new CronJob(
  "* * * * * *", // cronTime
  function () {
    console.log("You will see this message every second")
  }, // onTick
  null, // onComplete
  true, // start
  "America/Los_Angeles" // timeZone
)

job.start() // is optional here because of the fourth parameter set to true

const job = CronJob.from({
  cronTime: "* * * * * *",
  onTick: function () {
    console.log("You will see this message every second")
  },
  start: true,
  timeZone: "America/Los_Angeles",
})
```

另外，cron 还提供两个独立的方法 sendAt 和 timeout

- sendAt: 指示CronTime 何时执行。
- timeout: 指示CronTime在未来执行的毫秒数(返回一个数字)。

```js
import * as cron from "cron"

const dt = cron.sendAt("0 0 * * *")
console.log(`The job would run at: ${dt.toISO()}`)

const timeout = cron.timeout("0 0 * * *")
console.log(`The job would run in ${timeout}ms`)
```

## node 示例

```js
/*
 * @Description  : 定时任务，每日0点0分拆分访问日志，进行备份
 */
import { cb } from "node:fs"
import { resolve } from "node:path"
import { CronJob } from "cron"
import { formatYYYYMMDDHHMMSS } from "../utils/helper.js"

const cronTime = "0 0 * * *" // 每天0点0分执行

function backupLogTask() {
  const YYYYMMDD = formatYYYYMMDDHHMMSS(new Date()).slice(0, 10)
  const sourceFile = resolve(process.cwd(), "./logs/access.log.txt")
  const targetFile = resolve(process.cwd(), `./logs/${YYYYMMDD}.access.log.txt`)

  cp(sourceFile, targetFile, (err) => {
    if (err) {
      console.error(err)
    } else {
      fs.writeFile(sourceFile, "", (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log("清空")
        }
      })
    }
  })
}

export const backupLogCronJob = CronJob.from({
  cronTime,
  onTick: backupLogTask,
  start: false,
})
```

```js
import { backupLogCronJob } from "./cron-job/index.js"
// main.js
app.listen(PORT, HOST_NAME, () => {
  backupLogCronJob.start()
  console.log(`Server running at http://${HOST_NAME}:${PORT}/`)
})
```

## nestjs 示例

nestjs 使用 基于 cron 包的封装包 `@nestjs/schedule` 提供的装饰器实现。具体使用方式见 [nestjs 任务调度](https://nest.nodejs.cn/techniques/task-scheduling#google_vignette)
