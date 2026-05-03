# 数据库

“All problems in computer science can be solved by another level of indirection（计算机科学中的所有问题都可以通过增加一个间接层来解决）” -- David Wheeler（剑桥大学计算机科学教授）

## 数据库驱动

原生数据库驱动（如 mysql2、mongodb 的官方驱动）是 Node.js 应用程序与数据库服务器之间最直接的沟通桥梁。它们的核心任务和功能主要包含以下几个方面：

- 网络通信与协议实现：这是驱动最底层的功能。它们负责建立与数据库的 TCP 连接，并严格按照数据库官方的通信协议（如 MySQL 协议、MongoDB Wire Protocol）进行二进制数据的打包（发送请求）和拆包（解析响应）。
- 连接池管理：频繁地创建和销毁 TCP 连接非常消耗性能。原生驱动内部都内置了高效的连接池，负责管理一批已经建立的数据库连接，在请求时分配，使用完后回收，从而极大提升高并发场景下的吞吐量。
- SQL/命令执行与参数化：提供执行原生 SQL 语句或数据库命令的接口。更重要的是，它们强制或支持参数化查询（如使用 ? 占位符），将 SQL 结构与用户输入的数据严格分离，从根本上杜绝 SQL 注入攻击。
- 结果集解析与类型映射：将从数据库返回的底层二进制数据流，解析并转换为 JavaScript 能够直接理解的对象、数组、Buffer 等数据类型。
- 高级特性支持：现代驱动通常还支持预处理语句（Prepared Statements）、流式查询（处理海量数据不撑爆内存）、SSL/TLS 加密通信、事务控制等高级功能。

```js
// 以 mysql2 驱动为例
const mysql = require("mysql2")
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "test",
})
connection.query("SELECT * FROM users WHERE id = ?", [1], (err, results) => {
  console.log(results)
})
```

这是最基础的方式，相当于直接操作数据库。你需要安装对应数据库的第三方驱动包（如 MySQL 的 mysql2，MongoDB 的 mongodb）。

- 优势：你写出最高效的 SQL，对数据库有极致的控制力。
- 劣势：
  - 需要手动处理连接池、防 SQL 注入等安全问题。
  - 代码中充斥着数据库特有的方言（比如分页查询，MySQL 和 Oracle 的写法就不一样）

## 查询构建器

这是一种折中方案，代表库是 Knex.js。它提供了链式调用的 API 来拼接 SQL 语句，既保留了 SQL 的灵活性，又比原生字符串拼接更安全、易读，并且支持多种数据库的语法兼容。

```js
// 以 Knex.js 为例
knex("users")
  .select("*")
  .where("id", 1)
  .then((rows) => {
    console.log(rows)
  })
```

## ORM

> Why：为了解决“手写 SQL 的痛苦”与“对象-关系阻抗失配”）

有了数据库驱动，我们虽然能连数据库了，但还是得像个“SQL 搬运工”一样，把SQL语句手动拼成 SQL 字符串。

比如，你要存一个用户，你得写 `INSERT INTO users (name, age) VALUES ('Alice', 18)`。

这就产生了一个矛盾：JavaScript 是面向对象的（操作的是类/对象），而数据库是关系型的（操作的是表/行）。 这两者之间存在“阻抗失配”。

另外，不同的数据库方言的 SQL 语法也不一样。比如 MySQL 的 INSERT 语句是 `INSERT INTO`，而 Oracle 的 INSERT 语句是 `INSERT ALL` 等等问题。

ORM (Object-Relational Mapping，对象关系映射) 是一种编程思想。它的核心目标是：让你像操作对象一样操作数据库，彻底告别手写 SQL。

作用：

- 映射： 它建立了一座桥梁，把数据库的表，以及行记录映射为对象操作。
- 自动化： 当你执行 `user.save()` 时，ORM 会在后台自动帮你生成并执行 `INSERT` 语句，并且抹平不同数据库方言的 SQL 差异，自动处理参数转义，杜绝 SQL 注入。

ORM 是一种编程理论，一个抽象的概念，你可以用 Python 实现 ORM，也可以用 Java 实现（如 Hibernate）。它不是特指某一个库。

在 Nodejs 生态中代表库有 Sequelize (关系型)、TypeORM、Prisma、Drizzle orm 以及 MongoDB 的 Mongoose。

```
+---------------------------------+
|        应用代码        |
|  (操作 User 对象: user.name = "Bob") |
+------------------+--------------+
                   |
+------------------v--------------+
|        ORM 层                  |
| (将 User 对象操作翻译成 SQL 语句)  |
+------------------+--------------+
                   |
+------------------v--------------+
|         驱动层                  |
| (如: mysql2, mongodb)           |
+------------------+--------------+
                   |
+------------------v--------------+
|        关系型数据库              |
| (如: PostgreSQL, MySQL)          |
+---------------------------------+
```

## 代码示例

从 Node.js 24 开始，官方正式内置了 node:sqlite 模块。这意味着你现在操作 SQLite 数据库不再需要安装任何第三方库（如 sqlite3 或 better-sqlite3），真正实现了零依赖。

```js
import { DatabaseSync } from "node:sqlite"
const database = new DatabaseSync(":memory:")

// Execute SQL statements from strings.
database.exec(`
  CREATE TABLE data(
    key INTEGER PRIMARY KEY,
    value TEXT
  ) STRICT
`)
// Create a prepared statement to insert data into the database.
const insert = database.prepare("INSERT INTO data (key, value) VALUES (?, ?)")
// Execute the prepared statement with bound values.
insert.run(1, "hello")
insert.run(2, "world")
// Create a prepared statement to read data from the database.
const query = database.prepare("SELECT * FROM data ORDER BY key")
// Execute the prepared statement and log the result set.
console.log(query.all())
// Prints: [ { key: 1, value: 'hello' }, { key: 2, value: 'world' } ]
```

这里以创建一个 User 类，并使用 drizzle ORM 层操作数据库，实现 CURD 功能。

1. 安装依赖

在项目中安装 Drizzle ORM 以及 MySQL 的官方驱动 mysql2。

```bash
npm install drizzle-orm mysql2
npm install -D @types/node typescript
```

然后确保 MySQL 已经启动，并创建一个数据库：

```sql
CREATE DATABASE IF NOT EXISTS test_db DEFAULT CHARSET utf8mb4;
```

2. 定义 User 表结构（Schema）

创建一个 schema.ts 文件，在这里我们使用 Drizzle 提供的 mysqlTable 来定义 users 表的结构，并导出对应的 TypeScript 类型。

```ts
// schema.ts
import { mysqlTable, serial, varchar, int } from "drizzle-orm/mysql-core"

// 定义 users 表结构
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(), // 自增主键
  username: varchar("username", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  age: int("age"),
})

// 导出插入和查询时的 TS 类型（Drizzle 会自动推导）
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

3. 连接数据库

创建一个 db.ts 文件，用于建立与 MySQL 数据库的连接并导出 db 实例。

```ts
// db.ts
import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import * as schema from "./schema"

// 创建 MySQL 连接池（请替换为你自己的数据库连接信息）
const poolConnection = mysql.createPool(
  "mysql://root:password@localhost:3306/my_database",
)

// 初始化 drizzle 实例，并传入 schema 以便获得完整的类型提示
export const db = drizzle(poolConnection, { schema, mode: "default" })
```

4. 实现 User 模块的 CURD 功能

创建一个 user.service.ts，在这里封装具体的增删改查业务逻辑。Drizzle 的 API 链式调用非常符合直觉：

```ts
// user.service.ts
import { eq } from "drizzle-orm"
import { db } from "./db"
import { users, NewUser } from "./schema"

// 1. 新增用户 (Create)
export const createUser = async (newUser: NewUser) => {
  const [result] = await db.insert(users).values(newUser)
  return result // 返回插入结果（包含 insertId 等）
}

// 2. 查询所有用户 (Read All)
export const getAllUsers = async () => {
  return await db.select().from(users)
}

// 3. 根据 ID 查询单个用户 (Read One)
export const getUserById = async (id: number) => {
  const [user] = await db.select().from(users).where(eq(users.id, id))
  return user
}

// 4. 更新用户信息 (Update)
export const updateUser = async (id: number, updateData: Partial<NewUser>) => {
  const [result] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
  return result
}

// 5. 删除用户 (Delete)
export const deleteUser = async (id: number) => {
  const [result] = await db.delete(users).where(eq(users.id, id))
  return result
}
```

5. 使用 User 模块

你可以在主入口文件中这样调用这些方法。

```ts
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "./user.service"

async function test() {
  // 新增
  const insertRes = await createUser({
    username: "张三",
    email: "zhangsan@example.com",
    age: 25,
  })
  console.log("新增结果:", insertRes)

  // 查询所有
  const allUsers = await getAllUsers()
  console.log("所有用户:", allUsers)

  // 假设刚才插入的 ID 为 1，进行查询和更新
  const user = await getUserById(1)
  console.log("查询到的用户:", user)

  await updateUser(1, { age: 26, username: "张三丰" })

  // 删除
  await deleteUser(1)
}

test().catch(console.error)
```

在实际项目开发中，表结构通常不会手动在数据库里创建。Drizzle 提供了强大的 drizzle-kit 工具，可以根据你的 schema.ts 自动生成 SQL 迁移文件并同步到数据库，极大地提升了开发效率。
