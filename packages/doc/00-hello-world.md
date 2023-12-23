# Hello World

node 实现

```js
import http from "node:http"

const app = http.createServer((req, res) => {
  res.end("Hello World By Node")
})

app.listen(9000, () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
```

express 实现

```js
import express from "express"

const app = express()

app.get("/", (req, res) => {
  res.send("Hello World By Express")
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
```

koa 实现

```js
import koa from "koa"

const app = new koa()

app.use(async (ctx) => {
  ctx.body = "Hello World By koa"
})

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
```

nestjs 实现

```ts
// main.ts
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(9003)
}
bootstrap()

// app.module.ts
import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// app.controller.ts
import { Controller, Get } from "@nestjs/common"
import { AppService } from "./app.service"

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }
}

// app.service.ts
import { Injectable } from "@nestjs/common"

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello World By Nestjs"
  }
}
```

## 架构

从上面的示例，可以看到 node / express / koa 开始一个应用，代码非常简单，这也是他们的优势。而 nestjs 项目结构看似复杂，但却解决了一个企业级项目所需要的基本**架构**。[nestjs 哲学](https://nest.nodejs.cn/#%E5%93%B2%E5%AD%A6)。

为什么说 Express / Koa 等框架没有解决“架构问题”呢? 因为 Express / Koa 是小巧灵活的(unopinionated)，只是一套基于middleware的库，没有规范“代码的结构”。

而 Angular 是严格的(opinionated)，定义了 Template、 Component、 Filter(Pipe)、Service、 Module 这些概念，让代码组织起来更规范。

Nest 受到 Angular 的启发，在服务器端提供开箱即用的应用架构，代码组织规范，就是 Nestjs 文档中说的**架构**问题。只有代码更规范，开发出的应用才可以易测试、可扩展、松耦合、易维护。

Nest 是一个与平台无关的框架，但默认提供了两种框架的适配器 Express 和 Fastify。社区也可以开发其它不同框架的适配器，只要遵循 nestjs 约定的实现规范即可。
