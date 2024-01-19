# Node 学习指北

## 认识 node

1. What: 介绍
2. Why: 优势
3. How: 安装与 Hello World

## 内置模块

脚手架

- [ ] cli
- [ ] repl
- [ ] readline
- [ ] console
- [ ] package
- [ ] module
  - [ ] commonjs
  - [ ] es module
- [ ] corepack
      全局
- [ ] global
- [ ] os
- [ ] v8
- [ ] vm
- [ ] tty
      工具
- [ ] util
- [ ] zlib
- [ ] crypto
- [ ] crypto/webcrypto
- [ ] timer
      事件
- [ ] events
- [ ] diagnostis_channel
      文件
- [ ] fs
- [ ] path
- [ ] url
- [ ] querystring
      二进制和流
- [ ] buffer
- [ ] stream
- [ ] stream/web
- [ ] string_decoder
      网络
- [ ] http
- [ ] http2
- [ ] https
- [ ] tls
- [ ] net
- [ ] dgram
- [ ] dns
      进程和线程
- [ ] process
- [ ] child_process
- [ ] cluster
- [ ] worker_threads
- [ ] async_hooks/context
      测试
- [ ] test
- [ ] assert
      调试
- [ ] error
- [ ] debugger
- [ ] inspector
      性能
- [ ] perf_hooks
- [ ] report
      其它
- [ ] intl
- [ ] wasi
- [ ] c++
- [ ] node-api
      废弃
- [ ] async_hooks
- [ ] domain
- [ ] punycode

## web 开发

分别用原生 node、express、koa、nestjs 实现以下主题：

- [x] Hello World
- [x] 热更新 nodemon
- [x] 请求 request
  - [x] 查询参数 query
  - [x] 路径参数 params
  - [x] 请求体 body
    - [x] application/json
    - [x] x-www-form-urlencoded
    - [x] multiPart/form-data 文件上传
    - [x] stream 流文件接收
  - [x] 请求头 headers
    - [x] authorization
    - [x] cookies
  - [x] 请求参数验证 zod
- [x] 响应 response
  - [x] 响应状态码
  - [x] 响应头
    - [x] Set-Cookie
  - [x] 响应体
    - [x] text/plain text/html application/json
    - [x] 文件下载 Content-Disposition
    - [x] 流文件 application/octet-stream
  - [x] 重定向 location
  - [x] 响应数据序列化：是在网络响应中返回对象之前发生的过程
- [x] router 实现
- [x] middleware 中间件
- [x] mvc 逻辑分层
- [x] 视图模板
  - [x] res.render
  - [x] 模板组织：layout / partial / helper
- [x] 静态资源服务
- [x] 环境变量和配置参数 cross-env dotenv dotenv-expand
- [x] 错误处理 error http-errors
- [ ] 日志 log
- [ ] 调试 debugger
- [ ] 测试 test
- [ ] openApi swagger 文档
- [ ] 数据持久化
  - [ ] mysql
  - [ ] mongoDB
  - [ ] redis
- [ ] 访问控制
  - [ ] cookie
  - [ ] session
  - [ ] authorization
    - [ ] basic
    - [ ] digest
    - [ ] bearer
    - [ ] jwt
    - [ ] oauth2
- [ ] 安全 security
  - [ ] 加密 crypto
  - [ ] cors 跨域
  - [ ] csrf
  - [ ] helmet 安全头字段
  - [ ] limit 限速
  - [ ] gzip 压缩
- [ ] 邮件 nodemailer
- [ ] 定时任务 crontab
- [ ] SSE server-send event
- [ ] Websocket
- [ ] GraphQL
- [ ] 微服务 microservices
  - [ ] Request-response 请求响应模式 @MessagePattern： gRPC
  - [ ] Event-based 基于事件模式 @EventPattern：Redis MQTT NATS Kafka RabbitMQ

## node 深入

- node 架构
- node 事件循环
- node 异步编程
- 工程运维：性能监控、弹性扩容、日志分析、负载均衡、缓存、docker/k8s

## 入门后端学习

- 数据库设计（可扩展、高性能），SQL 语言（不要因为有 orm 就不学 sql）
- 基础组件（注意这里说的不是前端的组件）的应用和原理，比如 MySQL、Redis、Kafka 等
- 服务运维意识和手段的培养（监控、报警、日志、流量治理等）
- 架构设计（微服务架构、分布式架构、分布式事务、高可用高性能设计等）
- 算法&数据结构（后端开发可能不会直接手写算法，但要了解这些算法和数据结构，比如 LRU、LFU、LSM-Tree、RingBuffer）
