# MVC 架构

开发一个简单 web 服务的项目，大致流程：

- 路由器接收请求，进行路由分发
- 执行一些鉴权和数据验证的通用逻辑
- 具体的业务逻辑
- 与服务器进行数据交互
- 对服务器响应的数据进行序列化加工
- 进行响应。
- 错误处理

这些代码逻辑，不可能都写在一个 app.js 文件中。肯定会利用 node 模块化的能力抽象到独自的业务模块中。对业务逻辑模块化如何进行拆分就是项目架构需要考虑的问题。

而 MVC 架构就是一种经典的普适的项目构架方案。MVC 分别指的是：

1. M: Model 数据，组织与数据库交互的逻辑
2. V: View 视图，在以前，前后端不分离时，用于响应页面视图的逻辑
3. C: Controller 控制器，核心的业务逻辑

在 Node 中，MVC 架构下处理请求的过程如下：

1. 请求抵达服务端
2. 服务端将请求交由路由器处理
3. 路由通过路径匹配，将请求导向对应的 controller
4. controller 收到请求，处理业务逻辑，有需要向 model 中进行数据交互
5. model 与数据库实体进行交互，给 controller 返回其所需数据
6. controller 可能需要对收到的数据做一些序列化
7. controller 处理好数据，如果需要返回页面，则将数据交给 view 模板渲染，否则直接进行响应
8. view 根据数据和模板通过模板引擎生成响应的 html 内容，返回给 controller 进行响应

```javascript
    +---------------------------------+
    |           Browser               |
    +------+----------------------^---+
           |                      |
    +------v----------------------+---+
    |           Router                |
    +------+----------------------^---+
           |                      |
    +------v----------------------+----+
    |           Controller             |
    +------------+----------+----------+
                 |          |
+----------------v-+     +--v-----------------+
|      Model       |     |       view         |
|              ORM |     |                    |
+------------------+     +--------------------+
             MySQL

```

## 基础 MVC

以此为依据，我们需要准备以下模块：

1. server：HTTP 服务启动、监听和响应，即入口文件 index.js
2. router：将请求交由正确的 controller 处理
3. controllers：执行业务逻辑，从 model 中取出数据，传递给 view
4. model：提供数据
5. view：提供 html

```javascript
project
├── index.js
├── src
│   ├── middleware
│   ├── router
│   │   ├── index.js
│   ├── controller
│   │   └── user.controller.js
│   ├── view
│   │   └── user.view.hbs
│   ├── model
│   │   └── user.model.js
│   └── db
│       └── index.js
└── package.json
```

## nestjs

nestjs 的出现本身就是为了解决这个架构的问题。[nestjs 哲学](https://nest.nodejs.cn/#%E5%93%B2%E5%AD%A6)。

为什么说 Express / Koa 等框架没有解决“架构问题”呢? 因为 Express / Koa 是小巧灵活的(unopinionated)，只是一套基于中间件(middleware)的“库”，没有规范“代码的结构”。

而 Angular 是严格的(opinionated)，定义了 Template、 Component、 Filter(Pipe)、Service、 Module 这些概念，让代码组织起来更规范。

Nest 受到 Angular 的启发，在 node 服务器端项目中提供开箱即用的项目架构，有严格的代码组织规范，就是 Nestjs 文档中说的**架构**问题。只有代码更规范，开发出的应用才可以易测试、可扩展、松耦合、易维护。

Nest 在这些常见的 Node.js 框架（Express / Fastify）之上提供了一个抽象级别，提出了一些新的概念：

- 代码组织上：模块 Module、控制器 controller、提供商 provider。
- 中间件抽象上：守卫 Guard、管道 Pipe、拦截器 Interceptor、异常过滤器 Filter。

一个基本 nestjs 项目结构，包含一个基本业务模块 user：

```javascript
project
├── src
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── common
│   └── user
│       ├── middleware
│       ├── guard
│       ├── pipe
│       ├── interceptor
│       ├── filter
│       ├── decorator
│       ├── entity
│       ├── dto
│       ├── enum
│       ├── user.module.ts
│       ├── user.controller.ts
│       ├── user.service.ts
│       └── user.service.ts
└── package.json
```
