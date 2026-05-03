# 数据持久化存储

“**程序=数据结构+算法**”，由瑞士计算机科学家 尼克劳斯·沃斯（Niklaus Wirth）在其 1976 年出版的经典著作《算法 + 数据结构 = 程序》中提出。

在进行日常软件开发的编码工作中，应该要形成本能地思考：“这块功能要处理什么数据？如何组织这些数据？需要哪些操作？哪种算法最有效？”。 引导自己从 算法 和 数据结构 两个维度切入进行软件设计。

作为最关键的数据以及数据持久化的问题，从计算机科学的演变历程来看，数据存储的本质就是

如何将**内存中的易失性数据（0和1）映射到磁盘上的非易失性介质中**。这个过程经历了从“人读为主为文本类型文件”到“机读为主二进制类型文件”，数据组织从简单 → 结构化 → 高效 → 分布式”进行演变。

在 Node.js 中，处理这些数据的核心在于 fs（文件系统）模块以及各类第三方驱动。Node.js 通过 Buffer 对象来处理底层的二进制数据，通过设置编码（如 utf-8）来将二进制流转为人类可读的字符串。

## 文本数据 Text Data

纯文本文件是人类可读的，底层以字符序列（如 ASCII 或 UTF-8）存储。

纯文本文件的核心优势是通用性和可读性，但往往牺牲了存储空间和解析性能。

### 简单文本文件

纯文本文件，比如 txt、log 这类文件，仅存储纯字符串，无任何结构，适合极简数据。需要注意的是文件编码格式（如 utf-8），写入编码和读取编码不一致会出现乱码。

```js
const fs = require("fs")

// 异步读取简单文本文件
fs.readFile("example.txt", "utf-8", (err, data) => {
  if (err) throw err
  console.log("文本内容:", data)
})
```

### 填充式文本文件

这是早期大型机时代的常见格式（定长记录）。例如，规定姓名占 10 个字符，不足则用空格填充。

Node.js 处理这种文件时，通常按二进制或原始字符串读取，然后通过字符串的 slice 或 substring 方法按固定字节位置截取数据。

```js
// 假设每行 20 字节：前10字节是姓名，后10字节是年龄（带空格填充）
const line = "张三      25        "
const name = line.slice(0, 10).trim() // 提取并去除填充的空格
const age = line.slice(10, 20).trim()
console.log(name, age) // 输出: 张三 25
```

### 结构化文本文件

对于简单或者填充式的文本文件，其唯一的组织层次就是行。有时候，你希望有更多的结构，表达数据的意义。常见的格式约束有：

- 分隔符（separator）或界定符（delimiter）​，比如制表符（'\t'）​、逗号（','）或竖线（'|'）​。典型文件格式就是逗号分隔值的CSV文件（comma-separated value）就是这种格式。
- 标签周围的'<'和'>'，比如XML和HTML。
- 标点符号，比如JSON。
- 缩进，比如YAML（​“YAML Ain't Markup Language”的递归缩写）​。
- 杂项，比如程序配置文件 .ini 文件。

#### CSV

CSV 格式是一种最常用的数据格式，它将数据存储为行和列，行和列之间用逗号分隔。也称为表格文件格式，excel处理软件和数据库可以直接导入导出 CSV 文件。

在 Nodejs 中，简单的数据可以手动解析，或者借助第三方库 `csv-parser` 处理。

内容格式如下：

```
姓名,年龄,城市
张三,25,北京
```

#### xml

XML (Extensive Markup Language 可扩展标记语言) 是早期互联网数据交换标准，结构严谨但冗余。

XML 文件的格式如下：

```xml
<users>
  <user>
    <name>张三</name>
    <age>25</age>
    <city>北京</city>
  </user>
</users>
```

可以安装第三方库 `xml2js` 可以处理 XML 文件。

#### json

JSON (JavaScript Object Notation) 是一种数据格式规范，它基于 JavaScript 语言，与 JS 原生对象结构完美契合，是 Web 开发中最常用的格式。

JSON 是一种数据格式，而不是一种编程语言。JSON 的数据结构非常简单，它基于键值对。是当前Web网络中进行数据交互最主流格式，Python 字典数据结构直接映射，无冗余。

JSON 文件的格式如下：

```json
{
  "name": "张三",
  "age": 25,
  "city": "北京"
}
```

Js 语言中内置的 `JSON` 可以处理 JSON 文件。

```js
// 处理 JSON (Node.js 可直接解析)
const jsonData = '{"name": "Node", "version": 18}'
const obj = JSON.parse(jsonData)
console.log(obj.name) // 输出: Node
```

#### yaml

YAML（YAML Ain’t a Markup Language）是一种可读性极高的数据序列化格式，常用于配置文件和数据交换。它通过缩进表示层级关系，支持对象、数组和纯量三种数据结构，语法简洁且易于手工编辑。

YAML 文件的格式如下：

```yaml
server:
  host: 127.0.0.1
  port: 8080
users:
  - name: Tom
    role: admin
  - name: Jerry
    role: user
features:
  logging: true
  cache_size: 256
```

可以安装第三方库 `js-yaml` 可以处理 YAML 文件。

#### toml

TOML（Tom’s Obvious, Minimal Language）是一种简洁、可读性强的配置文件格式，由 GitHub 前 CEO Tom Preston-Werner 于 2013 年创建，设计目标是语义清晰且能无歧义映射为哈希表结构。它常被用于替代 JSON、YAML 和 INI，广泛应用于 Rust Cargo、Python Poetry、Hugo 等项目。

Toml 文件的格式如下：

```toml
# 应用配置
[app]
name = "我的应用"
version = "1.0.0"
debug = false
# 数据库配置
[database]
url = "postgresql://user:pass@localhost:5432/db"
pool_size = 10
# 嵌套表格
[servers.alpha]
ip = "10.0.0.1"
dc = "east"
# 表格数组
[[products]]
name = "Hammer"
price = 29.99
[[products]]
name = "Nail"
price = 2.99"
```

可以安装第三方库 `toml` 可以处理 TOML 文件。

## 二进制数据 Binary Data

二进制文件直接以字节流的形式存储计算机内存中的原始数据，读写速度快，且没有字符编码转换的损耗，人类无法直接阅读，但对机器极其高效。

Node.js 通过 Buffer 对象来处理底层的二进制数据，通过设置编码（如 utf-8）来将二进制流转为人类可读的字符串。

### 简单的二进制文件

直接存储原始的字节数据，速度最快，适合图片、音频、原始数据。

```js
// 读取二进制文件（如图片），不传 'utf-8' 编码
fs.readFile("image.png", (err, data) => {
  if (err) throw err
  // data 是一个 Buffer 对象
  console.log(`文件大小: ${data.length} bytes`)
})
```

### 填充式二进制文件

数据按照特定的字节长度和内存对齐方式进行填充。

Node.js 通过 Buffer 的 `readInt32BE`、`readFloatLE` 等方法，按照约定的偏移量（Offset）来精确读取特定位置的二进制数值

```js
const buf = Buffer.from([0x01, 0x02, 0x03, 0x04])
// 读取前4个字节作为一个大端序的无符号32位整数
const value = buf.readUInt32BE(0)
console.log(value)
```

### 结构化二进制文件

复杂的结构化数据，比较 JS 的数据结构字段、对象、函数等存储。通常涉及到数据序列化和反序列化：

- 序列化（Serialization）是将数据结构或对象状态转换为一个可以存储或传输的格式的过程。这意味着我们可以将复杂的数据结构转换为简单的字节流或字符串，以便于存储或传输。
- 反序列化（Deserialization）则是将这些数据恢复为其原始形式的过程。

在 Node.js 中，`ArrayBuffer`/`SharedArrayBuffer` 和 `TextEncoder`/`TextDecoder` 是处理底层二进制数据以及字符串与二进制流之间相互转换的核心工具。它们通常被用于高性能的网络通信、文件处理等场景。

1. 字符串与二进制的编解码：TextEncoder 与 TextDecoder

在现代 Node.js（v11.0.0+）中，`TextEncoder` 和 `TextDecoder` 已经是全局对象，无需额外引入模块。它们的主要作用是处理字符串（UTF-8）与二进制数据（`Uint8Array`）之间的转换。

- TextEncoder\*\*：将字符串编码为 UTF-8 字节流（返回 `Uint8Array`）。
- TextDecoder\*\*：将包含 UTF-8 字节流的 `Buffer` 或 `TypedArray` 解码为字符串。

```javascript
// 1. 编码：字符串 -> 二进制 (Uint8Array)
const encoder = new TextEncoder()
const text = JSON.stringify({ message: "你好，Node.js！" })
const uint8Array = encoder.encode(text)

console.log("编码后的二进制数据:", uint8Array)
// 输出类似：Uint8Array(16) [ 228, 189, 160, 229, 165, 189, ... ]

// 2. 解码：二进制 (Uint8Array / Buffer) -> 字符串
const decoder = new TextDecoder("utf-8")
const decodedText = decoder.decode(uint8Array)
const data = JSON.parse(decodedText)
console.log("解码后的字符串:", data)
```

2. 原始二进制内存块：ArrayBuffer

`ArrayBuffer` 代表了一块通用的、固定长度的原始二进制数据缓冲区。你不能直接操作 `ArrayBuffer`，而是需要通过**视图（View）**（如 `TypedArray` 或 `DataView`）来读写其中的内容。

`ArrayBuffer` 是 Web 中处理二进制数据的 WEB API，通常与 TypedArray / DataView 一起使用。

`Buffer` 是 Nodejs 为高性能二进制处理量身定制的，后期兼容 ArrayBuffer 实现时，作为 `Uint8Array` 的一种子类，因此可以无缝对接。

```javascript
// 1. 创建一个 16 字节的 ArrayBuffer
const buffer = new ArrayBuffer(16)

// 2. 使用 DataView 视图来操作这段内存（DataView 适合处理不同字节序和多种数据类型）
const view = new DataView(buffer)

// 在偏移量 0 的位置写入一个 32 位的无符号整数
view.setUint32(0, 255, false) // false 表示使用大端字节序 (Big-Endian)
// 在偏移量 4 的位置写入一个 16 位的有符号整数
view.setInt16(4, -100, false)

console.log("读取的整数:", view.getUint32(0, false)) // 输出: 255

// 3. 与 Node.js Buffer 的交互
// Node.js 的 Buffer 可以包装现有的 ArrayBuffer
const nodeBuffer = Buffer.from(buffer)
console.log("Node.js Buffer:", nodeBuffer)
// 输出类似：<Buffer 00 00 00 ff ff 9c ... >
```

3. 跨线程共享内存：SharedArrayBuffer

`SharedArrayBuffer` 用于表示一个通用的、固定长度的原始二进制数据缓冲区，类似于 `ArrayBuffer`，但它们可以用来在共享内存上创建视图。它的最大特点是**可以在不同的线程（如 Node.js 的 `worker_threads`）之间共享**，而无需复制数据，非常适合高性能的并行计算场景。

```javascript
// 创建一个 1024 字节的共享内存块
const sharedBuffer = new SharedArrayBuffer(1024)

// 在主线程中创建一个 Int32Array 视图，并写入数据
const sharedArray = new Int32Array(sharedBuffer)
sharedArray[0] = 12345

// 在实际开发中，你可以将 sharedBuffer 传递给 Worker 线程
// const { Worker } = require('worker_threads');
// new Worker('./worker.js', { workerData: sharedBuffer });

console.log("共享内存中的数据:", sharedArray[0]) // 输出: 12345
```

4. 进阶：Node.js 内置的 V8 序列化器

如果你需要对包含 `ArrayBuffer`、`TypedArray` 或 `DataView` 等复杂二进制对象的 JavaScript 值进行深度序列化和反序列化，Node.js 内置的 `v8` 模块提供了比 `JSON.stringify` 更强大的能力（`JSON.stringify` 无法正确处理二进制数据，通常会返回 `{}`）。

```javascript
const v8 = require("v8")

const originalData = {
  message: "二进制序列化测试",
  binaryData: new Uint8Array([1, 2, 3, 4, 5]),
  buffer: new ArrayBuffer(8),
}

// 使用 v8 进行序列化（返回 Node.js Buffer）
const serialized = v8.serialize(originalData)
console.log("序列化后的 Buffer:", serialized)

// 使用 v8 进行反序列化
const deserializedData = v8.deserialize(serialized)
console.log("反序列化后的对象:", deserializedData)
// 输出：{ message: '二进制序列化测试', binaryData: Uint8Array(5) [ 1, 2, 3, 4, 5 ], ... }
```

- 处理**文本与二进制互转**（如网络请求、文件读写）时，使用 `TextEncoder` 和 `TextDecoder`。
- 需要**底层精确控制内存**（如解析自定义二进制协议、处理音视频流）时，使用 `ArrayBuffer` 配合 `DataView` 或 `TypedArray`。
- 涉及**多线程（Worker Threads）高性能数据共享**时，使用 `SharedArrayBuffer`。
- 需要**完整保存包含二进制数据的 JS 对象**时，使用 Node.js 内置的 `v8.serialize`。

其它结构化二进制数据，比如 excel 文件（.xlsx）、word 文件（.docx）、pdf 文件（.pdf）等等，这类文件内部有极其复杂的二进制协议和索引结构。这类文件通常使用第三模块来处理，比如：

- Excel (.xlsx)：现代 Excel 文件本质上是遵循特定规范的 XML 压缩二进制包。在 Node.js 中通常使用 xlsx 等库来读写。
- Word (.docx)：Word 文件内部结构遵循 XML 压缩包，Node.js 中通常使用 docx 等库来读写。
- PDF (.pdf)：PDF 文件内部结构遵循 XML 压缩包，Node.js 中通常使用 pdf-parse 等库来读写。

## 数据库系统 Database System

当数据量超越单机文件处理能力，且需要并发访问、事务安全和复杂查询时，数据库成为必然选择。

### 关系型数据库 (RDBMS)

关系型数据库：数据以高度优化的二进制格式存储在磁盘上，通过 SQL 语言进行检索。Node.js 使用驱动（如 mysql2, pg）通过 TCP 协议与数据库通信。

- 代表: SQLite, MySQL, PostgreSQL。
- 特点: 结构化查询语言 (SQL)，强一致性，表与表之间有关联。
- 处理: sqlite3 (内置), mysql2。

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

### 非关系型数据库 (NoSQL)

非关系型数据库，无固定表结构，数据结构灵活，适合需要高并发读写的大数据、分布式场景。

- MongoDB 使用 BSON（Binary JSON）格式存储，支持嵌套和高效遍历。
- Redis 通常将数据保持在内存中，并以二进制安全的机制持久化到磁盘（RDB/AOF）。

```js
const { MongoClient } = require("mongodb")

async function run() {
  const client = new MongoClient("mongodb://localhost:27017")
  await client.connect()
  const db = client.db("mydb")
  const user = await db.collection("users").findOne({ id: 1 })
  console.log("MongoDB查询结果:", user)
  await client.close()
}
run()
```

## 总结

| 数据层级 | 格式类型              | Python 核心库/工具                | 适用场景                     | 优点                  | 缺点                        |
| :------- | :-------------------- | :-------------------------------- | :--------------------------- | :-------------------- | :-------------------------- |
| 文本     | 简单/Padding          | `open()`, `struct`                | 日志、配置、老式数据交换     | 极简、人可读          | 解析繁琐、无结构            |
| 文本     | 结构化 (CSV/JSON/XML) | `csv`, `json`, `pandas`, `pyyaml` | Web API、数据交换、报表      | 通用性强、跨语言      | 体积大、解析慢于二进制      |
| 二进制   | 简单/Struct           | `open()`, `struct`                | 图片、音频、底层协议         | 紧凑、极速            | 人不可读、依赖格式定义      |
| 二进制   | 序列化 (Pickle/Excel) | `pickle`, `pandas`                | Python 内部缓存、办公文档    | 保存复杂对象 (Pickle) | 安全风险 (Pickle)、依赖库多 |
| 数据库   | 关系型 (SQL)          | `sqlite3`, `SQLAlchemy`           | 核心业务数据、金融系统       | 强一致性、复杂查询    | 扩展性受限、部署较重        |
| 数据库   | 非关系型 (NoSQL)      | `pymongo`, `redis`                | 缓存、海量日志、非结构化数据 | 高性能、灵活扩展      | 事务支持较弱 (部分)         |
