# GraphQL

## What 它是什么

GraphQL 是一种查询语言和一个服务端的执行引擎。

> GraphQL 是一个用于 API 的查询语言，也是一套语言实现的规范，也 指一个基于该语言规范实现的服务端执行引擎。

> [GraphQL 规范](https://spec.graphql.org/) > [node 端 javascript 语言的执行引擎 GraphQL.js](https://github.com/graphql/graphql-js/)

## Why 为什么是它

GraphQL 是 Meta (Facebook) 公司开发和开源，从客户端角度考虑如何实现数据传输的方式。

它主要解决了目前通用的 RESTful API 架构的问题

- 过度获取数据，例如，有的时候前端为了满足在 web 和移动端的业务需求，但后端只提供了一个接口获取相同的数据，但是有的数据在两端上并不是必须的。
- 获取不足，前端某个业务场景的数据可能要通过多个接口请求去获得。
- 接口缺乏灵活性，如果后端 API 发生了变更，可能会导致另外一个或者多个业务场景奔溃，哪怕是调整一个简单接口的数据结构，对前端页面都是致命的。

相对的，GraphQL 规范架构下的优点：

- 前端调用接口只集中在一个接口中
- 数据响应是按需返回，不多不少
- 数据结构和类型清晰，api 文档清晰。

## How 如何使用它

一个简单的示例，了解在 GraphQL 规范下，如何实现前后端通信。

[以下示例仓库 gitee](https://gitee.com/xut0793/learn-graphql)

### 前端代码

```js
// GraphQL 服务请求统一入口
const url = "http://localhost:4000/graphql"

// 使用字符串模板，构建需要的响应数据
const schema = `query getUser($id: Int!) {
  total
  allUsers {
      id
      name
  }
  user(id: $id) {
      id
      name
  }
}`
// 查询的某个具体用户的id
const variables = { id: 1 }

// 构建一个请求
const options = {
  method: "POST",
  Headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: schema, variables }),
}

fetch(url, options)
  .then((res) => res.json())
  .then(console.log)
  .catch(console.error)

/**
 * {
 *    // 响应的数据结构：
 *    data: {
 *        total: 1,
 *        list: [
 *                { id: 1, name: "Mike Hattrup" },
 *                { id: 2, name: "Glen Plake" },
 *                { id: 3, name: "Scot Schmidt" },
 *              ]
 *        user: { id: 1, name: "Mike Hattrup" },
 *    }
 *    // 如果有错误，响应的错误对象
 *    errors: [
 *        {
 *            message: 'xxx',
 *            locations: [{line: 1, column: 5}]
 *        }
 *    ]
 * }
 */
```

### 服务端代码

```js
import http from "node:http"
import { createHandler } from "graphql-http/lib/use/http"
// 引入 GraphQL 语言规范在 node 端的实现 graphql.js
import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  graphql,
} from "graphql"

// 模拟数据，实现可以从数据库查询
const mockUserList = [
  { id: 1, name: "Mike Hattrup" },
  { id: 2, name: "Glen Plake" },
  { id: 3, name: "Scot Schmidt" },
]

// 定义一个规范 GraphQL 语言规范的数据模型
const UserType = new GraphQLObjectType({
  name: "User",
  description: "用户类型定义",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      total: {
        type: GraphQLInt,
        description: "用户数量",
        resolve() {
          return mockUserList.length
        },
      },
      allUsers: {
        type: new GraphQLList(UserType),
        description: "用户列表",
        resolve(source, args, context, info) {
          return mockUserList
        },
      },
      user: {
        type: UserType,
        description: "根据用户id，查询单个用户",
        args: {
          id: {
            description: "id of the user",
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        resolve: (source, args, context, info) => {
          return users.find((u) => u.id === args.id)
        },
      },
    },
  }),
  types: [UserType],
})

const handler = createHandler({ schema })

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/graphql")) {
    handler(req, res)
  } else {
    res.writeHead(404).end()
  }
})

server.listen(4000)
console.log("Listening to port 4000")
```

所以这里比较关键的代码就是：

- 客户端通过模板字段串的形式定义查询 schema
- 服务端通过实例化对象的方式定义 schema

以上两点就是 GraphQL 语言规范中最核心的一套描述数据结构的**类型系统**

### 延伸：官网示例的巨坑

在 [GraphQL 官网介绍 GraphQL.js](https://graphql.cn/graphql-js/) 实现的简单示例代码

```js
var { graphql, buildSchema } = require("graphql")

// 使用 GraphQL schema language 构建一个 schema
var schema = buildSchema(`
  type Query {
    hello: String
  }
`)

// 根节点为每个 API 入口端点提供一个 resolver 函数
var rootValue = {
  hello: () => {
    return "Hello world!"
  },
}

// 运行 GraphQL query '{ hello }' ，输出响应
graphql(schema, "{ hello }", rootValue).then((response) => {
  console.log(response)
})
```

会让初学者误认为，不管是 buildSchema 还是 rootValue 的定义就是构建 schema 和 resolver 的标准定义了。当你再深入阅读了官网关于类型系统的解析后，你会发现无法在目前的 buildSchema 和 rootValue 中定义次级字段的解析、变量的解析、自定义标题的解析、自定义指令的解析，mutation、subscription 等操作。

比如现在用户类型中增加一个 createTime 时间字段，然后数据库保存的时间戳，在返回给客户端时需要解析成一个可读的 ISO 格式的时间字符串时，按官网的示例，我们可能会定义成下面这样

```js
var schema = buildSchema(`
  type Query {
    hello: String
    user(id: Int!): User
  }
  type User {
    id: String!
    name: String!
    createTime: String!
  }
`);

var rootValue = {
  hello: () => "Hello world",
  user: (args, contentValue, info) => {
    return return users.find((u) => u.id === args.id)
  }
  // createTime 的解析器这样定义有用吗？
  createTime: (args, contentValue, info) => {
    // 如何从 user 身上拿到 createTime 字段的值进行转化？
  }
}
```

但是如果用上面对象实例化的方式，可以像下面这么做

```js
const UserType = new GraphQLObjectType({
  name: "User",
  description: "用户类型定义",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    createTime: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (source, args, context, info) => {
        // 此时 source 代表的就是它的父级 user 对象
        const timestamp = source.createTime
        return new Date(timestamp).toISOString() // '2023-12-15T15:34:21.027Z'
      },
    },
  },
})
```

还可以对比发现 rootValue 中的解析函数和实例对象方式中 resolver 函数的形参是不一样的，缺少第一个父级对象入参。

经过深入 graphql.js 源码探究 buildSchema 和 graphql 函数的形参，会发现：

- buildSchema 函数返回值 schema 是一个没有 resolver 函数的 schema 对象，它在最终执行时会使用一个默认的 `defaultFieldResolver(resource, args, contentValue, info)` 函数来执行。
- rootValue 并不是实际执行字段解析的 resolver 函数，而是仅作为，像其字面意思一样，为 schema 结构中首层对象字段解析提供一个相当于 defaultFieldResolver 函数的第一个父级对象 resource 的实参而已。

但实现上，打开 [GraphQL.js 的 github 主页](https://github.com/graphql/graphql-js) 的 README.md 文档的示例，却是标准的实例对象的方式定义 schema 和 resolver 的。

真正要实现服务端的字段的类型定义和客户端传入字段的类型定义一样的写法，是需要借助其它一些工具函数实现的。

比如 graphql-tools.js 中提供的 makeExecutableSchema 函数 和 @apollo/server 的 ApolloServer 函数的使用方式。

```js
import { makeExecutableSchema } from "@graphql-tools/schema"
import { ApolloServer } from "@apollo/server"
import { startStandaloneServer } from "@apollo/server/standalone"

const typeDefs = `
  type Query {
    hello: String
    user(id: Int!): User
  }
  type User {
    id: String!
    name: String!
    createTime: String!
  }
`

const resolver = {
  Query: {
    hello: () => "Hello World",
    user: (resource, args, contextValue, info) => mockUserList,
  },
  User: {
    createTime: (source, args, context, info) => {
      // 此时 source 代表的就是它的父级 user 对象
      const timestamp = source.createTime
      return new Date(timestamp).toISOString() // '2023-12-15T15:34:21.027Z'
    },
  },
}

// 第一种方式： graphql-tools.js 在服务端生成 schema 和 resolver 的示例
const schema = makeExecutableSchema({ typeDefs, resolvers })
const server = new ApolloServer({ schema })

// 第二种方式： @apollo/server 直接实现的示例
const server = new ApolloServer({ typeDefs, resolvers })

const app = await startStandaloneServer(server, { listen: { port: 4000 } })
console.log(`🚀  Server ready at: ${app.url}`)
```

注意上面参数的命名上叫 typeDefs，并不是 schema。只有对 typeDefs 和 resolvers 处理完成后形成的才是完整的 schema。

扒下源码，实际 new ApolloServer 中对入参 typeDefs 和 resolvers 的处理，内部也是调用 makeExecutableSchema 函数。而在 graphql-tools/schema 包中 makeExecutableSchema 函数的实现上，有两步：

```js
import { buildSchema } from "graphql.js"
import { addResolversToSchema } from "./addResolversToSchema.js"

/**
 * 以下源码摘选，并做了逻辑简化
 */
export function makeExecutableSchema({ typeDefs, resolvers }) {
  // 第一步，仍然是调用 buildSchema 函数生成缺少 resolver 的 schema
  let schema = buildSchema(typeDefs)

  // 第二步：附加上 resolvers
  schema = addResolversToSchema(schema, resolvers)

  return schema
}
```

## Deep 深入理解它

- 三种操作
  - 查询
  - 变更
  - 订阅
- 类型系统 schema
  - 对象类型和字段
  - 标量类型
    - 内置标量类型
    - 自定义标量类型
  - 枚举类型
  - 列表和非空
  - 联合类型
  - 接口类型
  - 输入类型和别名
  - 片段
  - 指令
    - 内置指令
      - 客户侧：@include @skip
      - 服务侧：@deprecated
    - 自定义指令
- resolver 解析器
  - 根解析器
  - 字段解析器
- 参数和变量
- 客户端和服务端 schema 细微区别
- 分页
- 上传文件
- 缓存
- 认证、授权和鉴权
- 安全
  - 设置请求超时时间
  - 限制数据量
  - 限制查询深度
  - 限制查询复杂度
  - schema 开发优先

### 三种操作 Query Mutation Subscription

区别 RESTful 架构中定义 GET POST PUT UPDATE DELETE OPTION 等操作类型，GraphQL 只有两种常用的操作 Query 查询和 Mutation 变更，以及一种基于 webSocket 实现操作 Subscription 订阅。

不管是在客户端定义 schema 还是服务端定义 schema，这三种操作都是 schema 的顶层对象。

```js
/**
 * 客户端定义 schema
 * 注意点：
 * 1. 最佳实践，客户端 schema 单次操作只定义一种操作类型
 * 2. 如果在 schema 中定义了多个操作同时入参查询，会报错误 Must provide operation name if query contains multiple operations，就是要求在请求体组装中指定一个操作
 * const body = JSON.stringify({ query: schema, variables, operationName: 'operateUser' }),
 */
const schema = `
  query getUserList {
    userList {
      id
      name
    }
  }
  mutation operateUser($name: String!) {
    addUser(name: $name) {
      id
      name
    }
  }
  subscription operationListener {
    newUser {
      id
      name
    }
  }
`

// 服务端定义 typeDefs
const typeDefs = `
  type Query {
    userList: [User]!
  }
  type Mutation {
    addUser(name: String!): User!
  }
  type Subscription {
    newUser: User!
  }

  // 然后可以是其它类型定义
  type User {
    id: Int!
    name: String!
  }
`

// 服务端类型对应的解析器
// Query Mutation Subscription 对应的解析器也称为根解析器
// 例子中的上下文对象在后面讲解，暂时可忽略
const resolver = {
  Query: {
    userList: () => mockUserList,
  },
  Mutation: {
    addUser: (source, args, contextValue, info) => {
      const newUser = { id: mockUserList.length, name: args.name }
      mockUserList.push(newUser)
      // 触发添加用户事件
      contextValue.pubsub.publish("user-added", { newUser })
    },
  },
  Subscription: {
    newUser: {
      subscribe: (resource, args, contextValue) => {
        // 订阅添加用户的事件
        contextValue.pubsub.asyncIterator("user-added")
      },
    },
  },
}
```

Query、 Mutation、Subscription 是客户端查询和变更的入口，也是服务端解析的入口，为了方便记忆，可以称为根类型，对应的解析器称为根解析器。

**Query 查询简写形式**
当客户端只有一种查询操作 Query 时，schema 的定义可以简写

```js
// 客户端查询定义
const query = `
query getUserList {
    userList {
      id
      name
    }
  }
`

// 简写
const query = `
{
  userList: {
    id
    name
  }
}
`
```

### 类型系统

[类型系统](./graphql-type-system.md)

### 性能和安全

#### 设置请求超时时间

设置请求超时时间是针对大型或恶意查询的第一道防线。超时时间规定了每个请求的处理时间上限，意味着你的服务请求需要在特定时间内完成。

```js
import { createServer } from "node:http"
import express from "express"

const app = express()
const httpServer = createServer(app)

httpServer.timeout = 5000 // 5s
```

上述方法是为整体设置超时间，此外，也可以为单个解析设置超时时间。通过在请求上下文对象中注入每个请求开始时间，然后请求处理逻辑内再去和自定义的超时时间比较。

```js
const REQUEST_MAX_AGE = 4000
const contextValue = async ({req}) => {
  // 省略其它逻辑
  return {
    startTimestamp = performance.now()
  }
}
```

#### 数据限制

针对大型或恶意的另一个安全措施就是限制每个查询可以返回的数据量。自定义一个最大查询数据量，然后在每一个 resolve 中与查询结果数量比较。

```js
const REQUEST_MAX_NUMBER = 100 // 列表查询最多返回100条数据

const resolvers = {
  allPhotos: (source, args, cxt) => {
    // 如果是分页请求，则比较页码，如果是列表，则比较查询结果的长度 resData.length
    if (args.pageSize > ctx.REQUEST_MAX_NUMBER) {
      throw new GraphQLError(`每次查询列表返回最多${ctx.REQUEST_MAX_NUMBER}条`)
    }
    return fakeList
  },
}
```

#### 限制查询深度

GraphQL 查询的一个优点，就是可以让客户端进行级联查询。但是如果请求大量数据，解析器执行大量工作，查询深度指数增加增加，程序很容易失控，所以需要限制查询深度，以防止程序崩溃。

```graphql
query getPhoto($id: ID!) {
  photo(id: $id) { // 深度1
    name
    postedBy { // 深度2
      name
      postedPhotos { // 深度3
        name
        taggedUsers { // 深度4
          name
        }
      }
    }
  }
}
```

查询深度的限制通常是通过解析查询的 AST 并确定选择集在这些对象中的嵌套程序来实现的。可以使用 `graphql-depth-limit` 这样的 npm 包来完成。

```js
import depthLimit from "graphql-depth-limit"

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5)],
  // 省略代码
})
```

这样我们将限制查询深度为 5，如果超过限制，服务器将阻止查询并返回一个错误。

#### 限制查询复杂度

有些客户端查询可能深度并不高，但查询字段的数量庞大，仍旧会引发程序意外崩溃。查询复杂度为每个字段都分配了复杂度值，然后统计任何查询的总体复杂度。
GraphQL 复杂度验证有一个默认规则：为每个标量字段赋值为 1，字段每嵌套一次列表，那么将值乘以 10.

```graphql
query everything($id: ID!) {
  totalUser           // 复杂度1
  Photo(id: $id) {
    name              // 复杂度1
    url               // 复杂度1
  }
  allUsers {
    id               // 复杂度10
    name             // 复杂度10
    postedPhotos {
      name          // 复杂度100
      url           // 复杂度100
    }
    inPhotos {
      name          // 复杂度100
      url           // 复杂度100
      taggedUsers {
        id          // 复杂度1000
        name        // 复杂度1000
      }
    }
  }
}

//                 总复杂度 2423
```

通过 `graphql-validation-complexity` 包，可设置一个总值来规定查询的最大复杂度，也可以更改分配给标量、对象、列表的复杂度，也可以为我们认为非常复杂或昂贵查询的某个字段设置自定义的复杂度，具体可以查询该包配置参数。

```js
import { createComplexityLimitRule } from "graphql-validation-complexity"

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(5),
    createComplexityLimitRule(1000, {
      // 当计算复杂度超出设置的 1000 时，就调用该回调函数，打印消息，并中止查询。
      onCost: (cost) => console.log("query cost: %s", cost),
    }),
  ],
  // 省略代码
})
```

## 项目结构

对于 schema 和 resolvers 的文件目录划分实践

```
src
├─ typeDefs
| ├─ types.graphql
| ├─ Query.graphql
| ├─ Mutation.graphql
| └─ index.js
├─ resolvers
| ├─ types.js
| ├─ Query.js
| ├─ Mutation.js
| └─ index.js
├─ directives
| ├─ upper.directive.js
| ├─ auth.directive.js
| └─ index.js
└─ server.js

```

## Resource 源码分析

相关依赖库

- graphql.js
- graphql-tag.js
- graphql-tool.js
- graphql-http.js
- @apollo/server
- @apollo/client
- @vue/apollo-composable
- @vue/apollo-components
- @vue/apollo-option

## 参考链接

[GraphQL 规范](https://spec.graphql.org/)
[GraphQL 规范仓库](https://github.com/graphql/graphql-spec)
[js 语言的实现 GraphQL.js](https://github.com/graphql/graphql-js/)
[在 GraphQL 中实现用户认证和授权的 5 种方式](https://github.com/mrdulin/blog/issues/88)
[GraphQL 技术浅析](https://juejin.cn/post/6844903679640731655#heading-1)
[上述代码示例仓库 gitee](https://gitee.com/xut0793/learn-graphql)
