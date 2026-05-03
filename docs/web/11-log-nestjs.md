# nestjs log

在 nestjs 中定义了一套 LoggerService 接口和一个通用 Logger 类，可以基于此进行扩展使用。

## 内置的 Logger

基于内置的接口，nestjs 内置实现了文本输出日志到控制台的 ConsoleLogger。

nestjs 应用启动时，控制台打印的引导日志就是用它实现的。如果项目是简单的日志需求，可以直接从 `@nestjs/common` 导出使用。

```js
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger('AppService');

  getHello(): string {
    this.logger.debug('log debug message');
    return 'Hello World By Nestjs integrate vite and swc !!!';
  }
}
```

这三者关系，通过源码来看下：

首先是接口定义 LoggerService

```ts
// nestjs/packages/common/services/logger.service.ts
export type LogLevel = "log" | "error" | "warn" | "debug" | "verbose" | "fatal"

export interface LoggerService {
  log(message: any, ...optionalParams: any[]): any
  error(message: any, ...optionalParams: any[]): any
  warn(message: any, ...optionalParams: any[]): any
  debug?(message: any, ...optionalParams: any[]): any
  verbose?(message: any, ...optionalParams: any[]): any
  fatal?(message: any, ...optionalParams: any[]): any
  setLogLevels?(levels: LogLevel[]): any
}
```

然后是包装的通用 Logger 类

```ts
// nestjs/packages/common/services/logger.service.ts
const DEFAULT_LOGGER = new ConsoleLogger()

@Injectable()
export class Logger implements LoggerService {
  protected static staticInstanceRef?: LoggerService = DEFAULT_LOGGER
  protected localInstanceRef?: LoggerService

  private registerLocalInstanceRef() {
    if (this.localInstanceRef) {
      return this.localInstanceRef
    }
    this.localInstanceRef = new ConsoleLogger(this.context, {
      timestamp: this.options?.timestamp,
      logLevels: Logger.logLevels,
    })
    return this.localInstanceRef
  }

  get localInstance(): LoggerService {
    if (Logger.staticInstanceRef === DEFAULT_LOGGER) {
      return this.registerLocalInstanceRef()
    } else if (Logger.staticInstanceRef instanceof Logger) {
      const prototype = Object.getPrototypeOf(Logger.staticInstanceRef)
      if (prototype.constructor === Logger) {
        return this.registerLocalInstanceRef()
      }
    }
    return Logger.staticInstanceRef
  }

  // 其它 error warn log 等方法类似，这里省略
  debug(message: any, context?: string): void
  debug(message: any, ...optionalParams: [...any, string?]): void
  @Logger.WrapBuffer
  debug(message: any, ...optionalParams: any[]) {
    optionalParams = this.context
      ? optionalParams.concat(this.context)
      : optionalParams
    this.localInstance?.debug?.(message, ...optionalParams)
  }
}
```

可以看到默认的 Logger 实现采用了 Console-logger 实例。

```ts
Injectable()
export class ConsoleLogger implements LoggerService {
  private static lastTimestampAt?: number
  private originalContext?: string

  constructor()
  constructor(context: string)
  constructor(context: string, options: ConsoleLoggerOptions)
  constructor(
    @Optional()
    protected context?: string,
    @Optional()
    protected options: ConsoleLoggerOptions = {}
  ) {
    if (!options.logLevels) {
      options.logLevels = DEFAULT_LOG_LEVELS
    }
    if (context) {
      this.originalContext = context
    }
  }

  error(message: any, stackOrContext?: string): void
  error(message: any, stack?: string, context?: string): void
  error(message: any, ...optionalParams: [...any, string?, string?]): void
  error(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled("error")) {
      return
    }
    const { messages, context, stack } =
      this.getContextAndStackAndMessagesToPrint([message, ...optionalParams])

    this.printMessages(messages, context, "error", "stderr")
    this.printStackTrace(stack)
  }

  protected printMessages(
    messages: unknown[],
    context = "",
    logLevel: LogLevel = "log",
    writeStreamType?: "stdout" | "stderr"
  ) {
    messages.forEach((message) => {
      const pidMessage = this.formatPid(process.pid)
      const contextMessage = this.formatContext(context)
      const timestampDiff = this.updateAndGetTimestampDiff()
      const formattedLogLevel = logLevel.toUpperCase().padStart(7, " ")
      const formattedMessage = this.formatMessage(
        logLevel,
        message,
        pidMessage,
        formattedLogLevel,
        contextMessage,
        timestampDiff
      )

      process[writeStreamType ?? "stdout"].write(formattedMessage)
    })
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string
  ) {
    const output = this.stringifyMessage(message, logLevel)
    pidMessage = this.colorize(pidMessage, logLevel)
    formattedLogLevel = this.colorize(formattedLogLevel, logLevel)
    return `${pidMessage}${this.getTimestamp()} ${formattedLogLevel} ${contextMessage}${output}${timestampDiff}\n`
  }
}
```

## nest-winston

nestjs 内置的 logger 只是在控制台的文本输出，实际项目中，日志需要更多功能，比如输出到文件，格式化等。所以需要集成社区中第三方日志库，广泛使用的是 winston。社区中封装的 nest-winston 来集成 winston。

nest-winston 在 nestjs 中使用有三种方式：

1. 兼容 nestjs 的哲学，使用 WinstonModule 模块，由 nestjs 采用依赖注入的方式。
2. 替换内置 logger 实例。
3. 自行创建 WinstonLogger 实例，替换内置的 logger 实例。

### 方案1

1. 注册 WinstonModule 模块

```js
import { Module } from "@nestjs/common"
import { WinstonModule } from "nest-winston"
import * as winston from "winston"

@Module({
  imports: [
    WinstonModule.forRoot({
      // 这里的配置同 winston.createLogger 一样，可参考 11-log-winston
      transports: [new transports.Console()],
    }),
    // 也可以用异步方式
    // WinstonModule.forRootAsync({
    //    useFactory: () => ({
    //     // options
    //   }),
    // })
  ],
})
@Global()
export class AppModule {}
```

2. 使用

由于 appModule 使用了 `@Global` 注册为全局模块。所以在其它模块可以使用 `WINSTON_MODULE_PROVIDER` 注入。

```js
import { Controller, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Controller('cats')
export class CatsController {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) { }

  @Get()
  findAll() {
    this.logger.debug('log debug msg')
  }
}
```

注意此时， Logger 类型是从 winston 导出，并不是nestjs 内置的 Logger 类。也就是说此时应用内有两种 Logger 可以使用。

### 方案2

为了同一应用内的 Logger 只使用一种，在保持上面模块注册的同时，在 main.js 中使用 `app.useLogger` 替换内置记录器。

```ts
// main.ts
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
  await app.listen(3000)
}
bootstrap()
```

之后在使用时，需要同样使用 WINSTON_MODULE_NEST_PROVIDER 标识符引入 logger 实例使用。注意区别于方案1中使用的标识符 WINSTON_MODULE_PROVIDER。

```js
import { Controller, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Controller('cats')
export class CatsController {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) { }
}
```

方案1的缺点是应用内有两套 Logger。
方案2的缺点是，虽然了统一了 logger，但因为是在主模块中注册，并且是由 nestjs 的自动依赖注入功能实现实例化。所以从 Nestjs 程序启动，到 Logger 实例化之前，这段引层逻辑中打印的日志仍然是内置的 logger。如果不在意这点差异，也就没必要折腾了。如果觉得不纯粹，要完全一致时，那可以使用方案3的方式，在 nestjs 应用创建时就传入提前实例化好的 logger。

### 方案3

使用此方案，区别于方案1和方案2，也就不需要在 appModule 中注册 WinstonModule 了。

```ts
import { createLogger } from "winston"
import { WinstonModule } from "nest-winston"

async function bootstrap() {
  // 提前基于 winston 的 createLogger 创建好 logger 实例
  const instance = createLogger(winstonOptions)
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance,
    }),
  })
  await app.listen(3000)
}
bootstrap()
```

然后需要在主模块中将内置的 Logger 作为提供者导出。注意此时虽然 Logger 类还是从 @nestjs/common 中导出，但实际上已经是替换后的 nest-winston 提供的 WinstonLogger 了。

```js
import { Logger, Module } from "@nestjs/common"

@Module({
  providers: [Logger],
})
export class AppModule {}
```

这里主模块进行导出，是方便在其它地方使用时，在依赖注入时能找到对应的类声明。

```js
import { Controller, Logger } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  // 使用方式一：直接声明 Logger 类
  constructor(private readonly logger: Logger) {}

  // 使用方式二：Inject 声明注入
  constructor(@Inject(Logger) private readonly logger: LoggerService) {}
}
```

另外，因为 winston 默认的日志格式是 json。如果需要在开发时，输出控制台的日志形式保持跟内置 Logger 类似。nest-winston 提供了一个工具格式。

```ts
transports: [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      nestWinstonModuleUtilities.format.nestLike('YourAppName', {
        // colors 和 prettyPrint 默认值也都是 true，可以省略
        colors: true,
        prettyPrint: true,
      }),
    ),
  }),
  // other transports...
],
```

## 自定义 logger

使用 nest-winston 创建的 logger 实例，由于没有继承 winston 的 child 方法，所以无法何通过 `logger.child` 创建子记录器来传递 traceId 的问题暂时没看到解决方案。

这里尝试通过 winston 来手动实现 LoggerService 接口创建自定义的 Logger 实例。

```ts
import { Injectable, LoggerService } from "@nestjs/common"
import { winstonLogger } from "./winston-logger"

export type LogLevel = "log" | "error" | "warn" | "info" | "debug" | "silly"

@Injectable()
export class CustomLogger implements LoggerService {
  private readonly logger = winstonLogger

  // 扩展 child 方法，以便在 interceptor 中为每个请求创建 childLogger
  child(options: object) {
    return this.logger.child(options)
  }

  log(message: string, level: LogLevel, meta?: any) {
    this.logger.log(level, message, meta)
  }
  error(message: string, meta?: any) {
    this.logger.error(message, meta)
  }
  warn(message: string, meta?: any) {
    this.logger.error(message, meta)
  }
  info(message: string, meta?: any) {
    this.logger.error(message, meta)
  }
  debug(message: string, meta?: any) {
    this.logger.error(message, meta)
  }
  silly(message: string, meta?: any) {
    this.logger.error(message, meta)
  }
}
```

在 main.ts 中传入实例。

```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  logger: new CustomLogger(),
})
```

定义一个拦截器，在里面为每个请求定义 childLogger，并注入 traceId

```ts
@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> | Promise<Observable<any>> {
    const ctx = context.switchToHttp()
    const req = ctx.getRequest<Request>()
    const res = ctx.getResponse<Response>()

    const requestIdHeaderName = "X-Request-Id"
    const requestIdHeader = req.get(requestIdHeaderName)
    const reqId = requestIdHeader ? requestIdHeader : randomUUID() // 生成一个链接ID
    const startTimestamp = Date.now()

    // 每个请求生成一个子记录器
    const _logger = this.logger.localInstance as CustomLogger
    const childLogger = _logger.child({
      reqId,
      uid: req["user"]?.["id"],
      req: {
        ip: req.ip,
        ua: req.headers["user-agent"],
        method: req.method.toLowerCase(),
        path: req.url,
        headers: JSON.stringify(req.headers),
        query: JSON.stringify(req.query),
        cookies: JSON.stringify(req.cookies),
        body: req.is("json") ? JSON.stringify(req.body) : null,
      },
    })

    childLogger.info("client-req", { stage: "client-req" })

    // 在业务 controller service 中需要使用此 childLogger 输出日志
    req["logger"] = childLogger
    req["reqId"] = reqId
    // 将链路 id 进行响应
    res.append(requestIdHeaderName, reqId)

    return next.handle().pipe(
      map((data) => {
        const endTimestamp = Date.now()
        childLogger.info("client-res", {
          stage: "client-res",
          cost: endTimestamp - startTimestamp,
          res: {
            statusCode: res.statusCode,
            headers: JSON.stringify(res.getHeaders()),
            body: res.get("Content-Type")?.includes?.("json")
              ? JSON.stringify(data)
              : null,
          },
        })
        return data
      })
    )
  }
}
```

在 AppModule 中注册为全局拦截器

```ts
providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor,
  },
]
```

在业务逻辑中使用

```ts
import { Inject, Injectable } from "@nestjs/common"
import { REQUEST } from "@nestjs/core"
import { CustomLogger } from "../common/utils/custom-logger"
import type { Request } from "express"

@Injectable()
export class LogCaseService {
  constructor(
    @Inject(REQUEST)
    private readonly request: Request & { logger: CustomLogger }
  ) {}

  logMsg() {
    this.request.logger.info("log msg >>>", { stage: "LogCaseService" })

    return {
      method: this.request.method,
      url: this.request.url,
      reqId: this.request["reqId"],
    }
  }
}
```

缺点是使用上比较麻烦，需要先构造函数中引入 request，然后在调用 `this.request.logger`。

> TODO: 在 Service 中，类的方法不能使用参数装饰器，如何方便从 request 对象，从中拿到定义的 childLogger，而不需要这么多模板代码 ？？

上述内容是通过 winston 的 child 方法创建子记录器实现 traceId 透传。下面这篇文章的方法是把 traceId 挂载到 req 对象上，在自己封装的方法中再从 req 拿出来输出日志中。

[基于nestjs 的一种log traceId 的实现方案](https://juejin.cn/post/7287038145035927609#heading-7)
