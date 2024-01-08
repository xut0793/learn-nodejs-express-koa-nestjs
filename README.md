# Node 学习指北

## 认识 node

1. What: 介绍
2. Why: 优势
3. How: 安装与 Hello World

## 内置模块

- [ ] cli
- [ ] repl
- [ ] readline
- [ ] console
- [ ] package
- [ ] module
  - [ ] commonjs
  - [ ] es module
- [ ] corepack
- [ ] global
- [ ] os
- [ ] v8
- [ ] vm
- [ ] tty
- [ ] util
- [ ] zlib
- [ ] crypto
- [ ] crypto/webcrypto
- [ ] timer
- [ ] events
- [ ] diagnostis_channel
- [ ] fs
- [ ] path
- [ ] url
- [ ] querystring
- [ ] buffer
- [ ] stream
- [ ] stream/web
- [ ] string_decoder
- [ ] http
- [ ] http2
- [ ] https
- [ ] tls
- [ ] net
- [ ] dgram
- [ ] dns
- [ ] process
- [ ] child_process
- [ ] cluster
- [ ] worker_threads
- [ ] async_hooks/context
- [ ] test
- [ ] assert
- [ ] error
- [ ] debugger
- [ ] inspector
- [ ] perf_hooks
- [ ] report
- [ ] intl
- [ ] wasi
- [ ] c++
- [ ] node-api
- [ ] 废弃：async_hooks domain punycode

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
- [ ] 环境变量和配置参数
- [ ] 错误处理 error 上传文件错误处理 MulterError nestjs-zod 错误 format
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
- [ ] openApi swagger 文档
- [ ] 日志 log
- [ ] 安全 security
  - [ ] 加密 crypto
  - [ ] cors 跨域
  - [ ] csrf
  - [ ] helmet 安全头字段
  - [ ] limit 限速
  - [ ] gzip 压缩
- [ ] 邮件 mail
- [ ] 定时任务 crontab
- [ ] SSE server-send event
- [ ] Websocket
- [ ] GraphQL
- [ ] 微服务 microservices
  - [ ] Request-response 请求响应模式 @MessagePattern： gRPC
  - [ ] Event-based 基于事件模式 @EventPattern：Redis MQTT NATS Kafka RabbitMQ

## 入门后端学习

- 数据库设计（可扩展、高性能），SQL 语言（不要因为有 orm 就不学 sql）
- 基础组件（注意这里说的不是前端的组件）的应用和原理，比如 MySQL、Redis、Kafka 等
- 服务运维意识和手段的培养（监控、报警、日志、流量治理等）
- 架构设计（微服务架构、分布式架构、分布式事务、高可用高性能设计等）
- 算法&数据结构（后端开发可能不会直接手写算法，但要了解这些算法和数据结构，比如 LRU、LFU、LSM-Tree、RingBuffer）
