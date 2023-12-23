# Node 服务端实践指北

分别用原生 node、express、koa、nestjs 实现以下主题：

- [ ] Hello World
- [ ] http server
- [ ] 热更新
- [ ] mvc 逻辑分层
- [ ] router 实现
- [ ] 解析请求参数
  - [ ] 路径参数 params
  - [ ] 查询参数 query
  - [ ] cookie
  - [ ] body
    - [ ] x-www-form-urlencoded
    - [ ] multiPart/form-data 上传文件
    - [ ] application/json
    - [ ] file buffer
  - [ ] 参数验证
- [ ] 响应数据
  - [ ] res.json
  - [ ] res.sendFile 下载文件
  - [ ] res.download
  - [ ] 数据序列化：是在网络响应中返回对象之前发生的过程
- [ ] 视图模板
  - [ ] res.render
  - [ ] 模板组织：layout / partial / helper
- [ ] 静态资源服务
- [ ] 环境变量和配置参数
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
- [ ] 日志
- [ ] 定时任务 crontab
- [ ] 安全
  - [ ] 加密 crypto
  - [ ] cors 跨域
  - [ ] csrf
  - [ ] helmet 安全头字段
  - [ ] limit 限速
  - [ ] gzip 压缩
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
