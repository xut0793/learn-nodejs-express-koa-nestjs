# Nodejs 学习指北

## 认识 nodejs

1. What: 介绍
2. Why: 优势
3. How: 应用

## 内置模块 API

- 脚手架
  - [x] cli 命令行
  - [x] repl Read-Eval-Print-Loop 交互式解释器
  - [x] corepack 统一包管理器
  - [ ] module 模块
  - [ ] package.json 项目描述文件
  - [ ] commonjs
  - [ ] es module
- 全局
  - [x] global/globalThis
  - [x] os 系统信息
  - [x] v8 内存堆栈信息、promise hook、数据序列化和反序列化
  - [x] vm 沙箱内执行代码字符、函数、模块
  - [x] tty 命令行终端输入和输出
- 工具
  - [x] util callbackify 和 promisify，格式化输出 format / inspect，解析 MIME type，数据编码和解码 TextEncoder / TextDecoder
  - [x] timer 定时器
  - [x] zlib 压缩和解压 gzip / gunzip, deflate / inflate, brotliCompress / brotliDecompress
  - [x] crypto 哈希、加密解密、签名验证
  - [x] web crypto 遵循 web crypto 接口设计
- 事件
  - [x] events 事件触发器
    - [x] EventEmitter
    - [x] EventTarget
  - [x] diagnostis_channel 发布/订阅
- I/O
  - [x] console 输出：打印到终端
  - [x] readline 输入：从终端逐行读取
- 文件和路径
  - [x] path
  - [x] fs
- 二进制和流
  - [x] buffer
    - [x] ArrayBuffer / TypedArray / DataView
    - [x] TextEncoder / TextDecoder 将字符串与 buffer 之间互转
    - [x] string_decoder 将 buffer 解码为字符串，省略任何不完整的多字节
    - [x] Blob
    - [x] File
  - [x] stream
  - [x] stream/web
- 进程和线程
  - [x] 概念：程序、进程、线程、协程、阻塞I/O、非阻塞I/O、同步、异步、并发、单核、多核
  - [x] process 进程
  - [x] child_process 子进程 spawn / exec / execFile / fork
  - [x] worker_threads 线程
  - [x] web worker
  - [ ] service worker
  - [x] cluster 集群
- 网络
  - [x] Internet 历史
  - [x] IP/dns
  - [x] datagram UDP
  - [x] net TCP
  - [x] Web 历史
  - [x] url / URL
  - [x] querystring / URLSearchParams
  - [x] http
  - [x] https
  - [x] http2
  - [x] http3 QUIC
- 数据持久化存储
  - [x] 文本数据：简单文本文件、填充式文本文件、结构化文本文件（csv xml json yaml toml）
  - [x] 二进进制数据：简单二进制文件、填充式二进制文件、结构化二进制文件（excel word pdf ）
  - [x] 数据库：关系数据库、非关系数据库
  - [x] 数据库：jdbc、ORM、JPA
- 测试
  - [ ] test
  - [ ] assert
- 错误和调试
  - [ ] error
  - [ ] debugger
  - [ ] inspector
- 性能和报告
  - [ ] perf_hooks
  - [ ] report
  - [ ] trace_events
- 扩展
  - [ ] intl
  - [ ] wasi
  - [ ] c++
  - [ ] node-api
- 废弃
  - async_hooks
  - domain
  - punycode

## node 原理

> [Node.js 源码剖析](https://theanarkh.github.io/understand-nodejs)

- node 架构 [Nodejs 架构体系](https://www.jianshu.com/p/a8f5a8cdc6ab)
- node 事件循环
- node 异步编程
