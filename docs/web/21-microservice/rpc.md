# RPC

RPC (Remote Procedure Call) 远程过程调用。

- Remote 远程，通常指网络上两台不同机器上的服务，或者同台机器中跑在不同进程上的服务，通常网络连接
- Procedure 翻译过来有过程、程序、步骤的意思，具体到实际代码逻辑，通常是指处理业务逻辑的函数或叫方法

所以 RPC 协议的主要功能目标是，将调用网络上一个远程服务的方法，就像同一个服务里调用本地方法一样简单。在实现 rpc 协议的 rpc 框架需要对实现逻辑进行封装成黑盒，让使用者不必显式的区分是本地调用和远程调用。

## PRC 历史

大多数人在学习编程时先接触到 http，通过 http 就可以实现服务调用。后来才深入到 rpc 这个东西，所以通常会有这样的疑问：既然有 http 也能够做远程调用，为什么还要有rpc呢？

RPC 在1984年就被人用来做分布式系统的通信，Java 在1.1版本提供了 Java 版本的 RPC 实现 RMI。

而 HTTP 协议在1990年才开始作为主流协议出现，而且 HTTP 发明的场景是用于 B/S 架构的 Web 服务，而 rpc 最初是服务于 C/S 架构的分布式服务之间的通信。而且HTTP 协议中数据交换的格式最早是基于文本格式的 XML，它非常啰嗦。随着前后端分离架构的流行和前端技术的发展，AJAX 技术和 JSON 格式在前端界逐渐成为主流，HTTP 的数据格式才摆脱 XML，开始使用 JSON 这一相对简洁的文档格式，为后面 HTTP 用于分布式服务间调用定下基础。最后随着 RESTful 思潮的兴起，借助 RESTful 的思想并考虑互联网架构的穿透性，越来越多系统服务考虑用 HTTP 来提供服务。B 与 C 的融合，S 需要同时支持B和C，所以 http 和 rpc 的双模式逐渐成为了 S 的标配。

但由于兼容性，在早期的大型分页式系统中 RPC 已经是标配了，所以上述问题真正顺序应该要反过来问，既然有 RPC 了，为什么还要有HTTP请求？

因为现在大部分的系统都是给 web 服务的客户端浏览器使用的，浏览器的统一通信协议是 HTTP。而这部分系统中的绝大部分服务，对于服务间调用的性能都是要求不高的，毕竟走的都是内网，它们更关心的是前端和后端的性能，因此后端系统间调用如果能够采用和前端一样的技术栈，那无疑是维护成本最低的，而这时 HTTP 的技术生态也刚好满足这个条件，所以出现了现在后端服务间的调用也使用 HTTP 实现。那么对于少数的部分系统，他们需要使用 RPC，一可能是老架构，也不敢动这块，二是性能要求可能只有 RPC 可以满足。但是如果只论性能优化，也有基于 HTTP2 协议实现的 HTTP 实现，它相对 HTTP 1.x 协议性能改过很多。

另外 RPC 和 HTTP 不是对待概念，**RPC是一个完整的远程调用方案，它包括了：接口规范 + 序列化反序列化规范 + 通信协议等**。而HTTP只是一个通信协议，工作在 OSI 的第七层，不是一个完整的远程调用方案。拉平为一个对等的概念，应该 Restful规范 + 序列化与反序列化规范 + HTTP 通信协议，构成一个完整的远程调用方案，再和RPC进行比较。这点可以继续往下看。

## RPC 架构

想要构建一套完整的 RPC 架构，就需要明确该架构所要具备的基本结构，而 RPC 架构的基本结构中又存在很多组件。因此接下来，我就通过 RPC 基本结构演进的过程，来一一讲解。

### RPC 架构的演进

1. 阶段一

首先，我们通常把发生调用关系的两个服务分别称为服务的提供者（Provider）和消费者（Consumer）。所以，简单来说，RPC 就是服务的消费者向提供者发起远程调用并获取结果的过程，这是 RPC 最简单的一种表现形式。

```
 +----------+      RPC        +-----------+
 | Consumer +-----------------> Provider  |
 |          <-----------------+           |
 +----------+                 +-----------+
```

1. 阶段二

如果想要实现服务提供者和消费者之间的有效交互，那么两者之间就需要确立与网络通信相关的网络协议以及通信通道。同时，服务的提供者需要把自己的服务调用入口暴露出来，并时刻准备接收来自消费者的请求。
这里，我们把通信通道和网络协议分别命名为 RpcChannel 和 RpcProtocol，而把服务提供者接收请求的组件称为 RpcAcceptor，把消费者发起请求的组件称为 RpcConnector。这样，RPC 架构就演变成了这个样子：

```
+-------------+  encode  +--------------+   RpcChannel  +-------------+   encode   +-------------+
| RpcProtocol <----------+ RpcConnector +---------------> RpcAcceptor +------------> RpcProtocol |
+-------------+          |              <---------------+             |            +-------------+
                         +--------------+               +-------------+
```

1. 阶段三

然后，对于服务提供者和消费者而言，为了双方能够正常识别所发送请求的数据和所接收到响应结果数据，需要遵循统一的接口数据格式约定。我们把这种约定称为远程 API（Remote API），以便与本地 API 加以区别。如此一来，基于同一套远程 API 的定义（IDL:Interface Define Language 接口定义语言） ，RPC 架构就具备了根据业务来进行数据交换的能力。

```
                          +-------------+               +-------------+
                          |  Remote API |               |  Remote API |
                          +------+------+               +------+------+
                                 |                             |
                                 |call                         |call
                                 |                             |
+-------------+  encode  +-------v------+   RpcChannel  +------v------+   encode   +-------------+
| RpcProtocol <----------+ RpcConnector +---------------> RpcAcceptor +------------> RpcProtocol |
+-------------+          |              <---------------+             |            +-------------+
                         +--------------+               +-------------+
```

4. 阶段四

为了更好地区分 RPC 架构中的角色，我们把真正提供业务服务的组件称为 RpcServer，而把发起真实客户端请求的组件称为 RpcClient。这样 RpcServer 负责实现远程 API，而 RpcClient 负责调用远程 API。

```
 +-----------+            +-------------+               +-------------+           +------------+
 | RpcClient +------------>  Remote API |               |  Remote API +----------->  RpcServer |
 +-----------+            +------+------+               +------+------+           +------------+
                                 |                             |
                                 |call                         |call
                                 |                             |
+-------------+  encode  +-------v------+   RpcChannel  +------v------+   encode   +-------------+
| RpcProtocol <----------+ RpcConnector +---------------> RpcAcceptor +------------> RpcProtocol |
+-------------+          |              <---------------+             |            +-------------+
                         +--------------+               +-------------+
```

5. 阶段五

当然，对于远程 API 而言，服务提供者和消费者对接口数据的处理方式显然是不一样的。消费者通过 RpcCaller 组件对接口请求数据进行编码之后，发送给服务方并等待结果。提供者需要调 RpcInvoker 根据消费者的请求数据进行解码处理，并将响应的数据遵循同样的编码规则进行响应。

```
+-----------+            +-------------+               +-------------+           +------------+
| RpcClient +------------>  Remote API |               |  Remote API +----------->  RpcServer |
+-----------+            +-------+-----+               +-------+-----+           +------------+
                                 |                             |
                                 |call                         |call
                                 |                             |
                          +------v-----+                 +-----v------+
                          |  RpcCaller |                 | RpcInvoder |
                          +------+-----+                 +-----+------+
                                 |                             |
                                 |call                         |call
                                 |                             |
+-------------+  encode  +-------v------+   RpcChannel  +------v------+   encode   +-------------+
| RpcProtocol <----------+ RpcConnector +---------------> RpcAcceptor +------------> RpcProtocol |
+-------------+          |              <---------------+             |            +-------------+
                         +--------------+               +-------------+
```

6. 阶段六

最后，为了降低开发人员的开发难度，让消费者在远程调用的执行过程看上去就像在执行本地方法一样，主流的 RPC 实现上通常都会在客户端添加代理机制，以此提供远程服务本地化访问的入口，我们把这个代理组件称为 RpcProxy。另外，在服务器端，为了更好地控制业务方法执行过程，通常也会引入具备线程管理、超时控制等机制的 RpcProcessor 组件。

```
  +-----------+            +-------------+                     +------------+           +------------+
  | RpcClient +------------>  Remote API |                     | Remote API +----------->  RpcServer |
  +-----------+            +-------+-----+                     +------^-----+           +------------+
                                   |                                  |
                                   |call                              |call
+----------------------------------|--------+                +--------|------------------------------------+
| Client Stub                +-----v----+   |                | +------+-----+                  Server Stub |
|                            | RpcProxy |   |                | | RpcInvoder |                              |
|                            +-----+----+   |                | +------^-----+                              |
|                                  |        |                |        |                                    |
|                                  |call    |                |        |call                                |
|                                  |        |                |        |                                    |
|                            +-----v-----+  |                | +------+-------+                            |
|                            | RpcCaller |  |                | | RpcProcessor |                            |
|                            +-----+-----+  |                | +------^-------+                            |
|                                  |        |                |        |                                    |
|                                  |call    |                |        |call                                |
|                                  |        |                |        |                                    |
| +-------------+  encode  +-------v------+ |   RpcChannel   | +------+------+   encode   +-------------+  |
| | RpcProtocol <----------+ RpcConnector +--------------------> RpcAcceptor +------------> RpcProtocol |  |
| +-------------+          |              <--------------------+             |            +-------------+  |
|                          +--------------+ |                | +-------------+                             |
+-------------------------------------------+                +---------------------------------------------+

```

以上就是整个 RPC 架构的演进过程了。从中你可以发现，RPC 架构中的客户端组件和服务器端组件形成了一种对称结构，它们各司其职，但又共同构成一个整体。各个组件职责说明：

1. 客户端组件与职责包括：
   - RpcClient，负责调用远程 API，这个过程会依赖于 RpcProxy 提供的代理实现
   - RpcProxy，远程 API 的代理实现，提供远程服务本地化访问的入口
   - RpcCaller，负责编码和发送调用请求到服务方并等待结果
   - RpcConnector，负责与服务端建立通信通道并发送请求到服务端
2. 服务端组件与职责包括：
   - RpcServer，负责实现远程 API
   - RpcInvoker，负责调用服务端的具体实现并返回结果
   - RpcProcessor，负责对请求进行处理，高效控制调用过程
   - RpcAcceptor，负责接收客户方请求并返回请求结果
3. 公共的组件包括：
   - RpcProtocol，负责网络传输协议的编码和解码
   - RpcChannel，负责建立和维护网络数据传输通道

### RPC 架构的技术体系

实现上述 RPC 架构的技术体系，需要包括网络通信、序列化、传输协议和远程调用。

> 简单说，RPC 架构的技术实现，使用什么样的通信方式（TCP/HTTP）和什么样的数据格式(JSON/Protobuf) 。

#### 网络通信

网络连接有两种基本方式：长连接和短连接。长连接和短连接的本质区别是连接的创建和关闭策略，长连接可以复用现有连接，而短连接则能够更快地释放资源。这两者本身各有利弊，而在 RPC 框架的实现过程中，考虑到性能和服务治理等因素，我们通常是使用长连接进行通信，

网络 IO 模型就是阻塞式 IO，即 BIO（Blocking IO）。BIO 要求客户端请求数与服务端线程数一一对应，但是显然，由于线程的创建需要消耗系统资源，在分布式系统中，服务端可以创建的线程数将会成为系统的瓶颈。但在 RPC 架构中，通常都会使用非阻塞 IO，即 NIO（Non-blocking IO）技术来提供性能。基于 NIO 模式下的多路复用机制，创建少数的线程就能对大量请求进行高效的响应。

#### 序列化

想要在网络上传输数据，就需要用到数据序列化技术了。目前成熟的序列化工具已经有很多，常见的 XML 和 JSON 就是文本类序列化方式的代表，它们可以让数据以开发人员可读的方式进行传输。还有一种基于二进制实现的方案，包括 Google 的 Protocol Buffer 和 Facebook 的 Thrift。

性能指标主要包括空间复杂度、时间复杂度以及 CPU/ 内存资源占用等。下表是网络上一些主流数据格式序列化对比

|                 | 序列化时间 | 反序列化时间 | 大小 | 压缩后大小 |
| --------------- | ---------- | ------------ | ---- | ---------- |
| protocol buffer | 2964       | 1745         | 239  | 149        |
| thrift          | 3177       | 1949         | 349  | 197        |
| json            | 45788      | 149741       | 485  | 263        |
| fastjson        | 2595       | 1472         | 468  | 251        |

可以看到，在时间维度上，Alibaba 的 fastjson 具有一定优势；而从空间维度上看，相较其他技术，你可以优先选择 Protocol Buffer。

#### 传输协议

但凡涉及通过网络来传输数据，就一定要采用某种传输协议。在 ISO/OSI 的 7 层网络模型中，RPC 架构的设计和实现通常会涉及传输层及以上层次的相关协议，我们所熟悉的 TCP 协议就属于传输层，而 HTTP 协议则位于应用层。

无论 RPC 实现上采用 7 层网络模型中的哪一层，在网络请求过程中，数据都是以消息的形式进行传递。而消息的组成是有一定结构的，消息头和消息体构成了所传输消息的主体，其中消息体表示需要传输的业务数据，而消息头用于进行传输控制。每个层都从上层取得数据，加上本层约定的消息头信息形成新的消息体，并将新的消息传递给下一层次。

通过对消息头和消息体进行扩展，我们就可以实现私有化的传输协议。也是大部分 RPC 框架内部所采用的实现方式，通过对公有协议进行精简，实现私有化协议来提升性能。另外，出于扩展性的考虑，具备高度定制化的私有协议也比公共协议更加容易实现扩展。这方面的典型示例还是 Dubbo 框架，它提供了完全自定义的 Dubbo 协议。

#### 远程调用

明确了网络通信的基本方式、序列化手段以及所采用的传输协议之后，我们就可以发起真正的远程调用了。RPC 本质也是一种服务调用，而服务调用存在两种基本方式，即单向（One Way）模式和请求应答（Request-Response）模式，前者体现为异步操作，后者一般执行同步操作。同步调用会造成业务线程阻塞，但开发和管理会相对简单，而使用异步调用不需要等待，从而获得更高的 IO 性能。

除了同步和异步调用之外，还存在并行（Parallel）调用和泛化（Generic）调用等调用方法，虽然也有其特定的应用场景，但对于 RPC 架构而言并不是主流的调用方式。

## RPC 框架

> 架构是一种设计思想和方法，通常约定了它的基本结构和组成，以及实现的规范。架构之后，需要进一步梳理架构中各个组成部分可实现的技术体系，最后使用技术进行实现。

- Thrift：最初是由 Facebook 开发的内部系统跨语言的 RPC 框架，2007 年贡献给了 Apache 基金，成为Apache 开源项目之一，支持多种语言
- Dubbo：国内最早开源的 RPC 框架，由阿里巴巴公司开发并于 2011 年末对外开源，仅支持 Java 语言。
- Spring Cloud：国外 Pivotal 公司 2014 年对外开源的微服务框架，提供了搭建分布式系统及微服务常用的工具，包括网关、服务配置中心、服务发现、服务通信、熔断器等基础组件。
- gRPC：Google 于 2015 年对外开源的跨语言 RPC 框架，支持多种语言。
- Motan：微博内部使用的 RPC 框架，于 2016 年对外开源，仅支持 Java 语言。
- Tars：腾讯内部使用的 RPC 框架，于 2017 年对外开源，仅支持 C++ 语言。

### gRPC

gRPC 是一个高性能，通用的开源 RPC 框架，其由 Google 在2015年主要面向移动应用开发的，它的通信协议基于 HTTP/2 协议标准设计，接口规范和序列化规范基于 ProtoBuf。

gRPC 支持四种服务类型：Unary（一对一，或者称为一元流）、Server Streaming（服务器流）、Client Streaming（客户端流）和 Bidirectional Streaming（双向流）。并且提供了认证、流控、拦截器等常用功能。

[gRPC 官网](https://grpc.io/)

### protocol buffer

[Protocol Buffer 官网](https://protobuf.dev/)
[protobuf3 官方文档翻译](https://zhuanlan.zhihu.com/p/400088101)

protocol buffer，简写 protobuf，是一种 google 定义的一种更加灵活和高效的结构化数据格式，与 JSON / XML 功能相似。

protobuf 在 gRPC 框架中主要有三个作用：

- 定义数据结构
- 定义服务接口
- 序列化和反序列化，提升传输效率
  - 序列化：将数据结构或对象转换成二进制串的过程；
  - 反序列化：将在序列化过程中所生成的二进制串转换成数据结构或者对象的过程。

protobuf 的特点是解析速度快（即序列化反序列化速度快），占用空间小（以二进制数据传输），以及兼容性好（带有编译器），很适合做数据存储或网络通讯间的数据传输。其中 prototbuf 兼容多平台和多语言，主要得益于它带有一个编译器。通过编译器将 .proto 文件转成二进制数据进行传输。

> 在移动互联网时代，手机流量、电量是最为有限的资源，而移动端的即时通讯应用无疑必须得直面这两点。解决流量过大的基本方法就是使用高度压缩的数据传输协议，而数据压缩后流量减小带来的自然结果也就是省电：因为大数据量的传输必然需要更久的网络操作、数据序列化及反序列化操作，这些都是电量消耗过快的根源。当前即时通讯应用中最热门的数据传输协议无疑就是 Google 的 Protobuf了，基于它的优秀表现，微信和手机QQ这样的主流IM应用也早已在使用它。

ProtoBuf 目前有两个版本，分别是 proto2 和 proto3，虽然 proto3 看上去比 proto2 新，但是，在一些处理上其实被很多人所诟病，例如默认值和未定义的字段的处理上，proto3 不如 proto2；但是 proto3 确实也修正了 proto2 的很多问题和做了精简。目前广泛使用的还是 proto3。

### node 示例

下面从 node.js 开始上手，体验下 gRPC 开发和使用上是什么感觉。

> 在 node.js 中有两个版本的 grpc，一个是 c++ 版本，一个是纯 js 实现的版本，对应的 npm 包分别是 grpc 和 @grpc/grpc-js 。两者在接口和功能上基本上没什么差别，显而易见，当然是 c++ 版本的性能更好，但 c++ 版本的在 2021 年就不维护了，另一方面 js 版本的好处则是更方便调试。

1. 首先定义接口

```proto
syntax = "proto3";

package helloworld;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {};
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

2. 编译 proto 文件

@grpc/proto-loader 提供了一个动态编译 protobuf 文件的功能。它会将一个 protobuf 文件内的 server 转化成一个实例对象返回。如下我们就获取了一个 routeguide 对象，然后我们就可以使用这个对象去做接口访问或者创建一个server。

```js
// helloworld.proto.js
import { resolve } from "node:path"
import grpc from "@grpc/grpc-js"
import protoLoader from "@grpc/proto-loader"

const PROTO_PATH = resolve(process.cwd(), "./helloworld.proto")

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
const helloProto = protoDescriptor.helloworld // helloworld 为 proto 中 package 字段定义的包名

export default helloProto
```

1. 实现 gRPC server

```js
import grpc from "@grpc/grpc-js"
import helloProto from "./helloworld.proto.js"

function sayHello(call, cb) {
  const response = { message: "Hello " + call.request.name }
  cb(null, response)
}

function main() {
  const server = new grpc.Server()
  server.addService(helloProto.Greeter.service, { sayHello: sayHello })
  server.bindAsync(
    "localhost:50051",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err !== null) {
        return console.error(err)
      }

      console.log("gRPC listening on localhost:" + port)
    }
  )
}
main()
```

启动 server，`node server.js`，接下来我们就可以开始用工具测试接口是否正常，比如 apifox。

1. 实现 gRPC client

```js
import grpc from "@grpc/grpc-js"
import helloProto from "./helloworld.proto.js"
import { promisify } from "node:util"

async function main() {
  const client = new helloProto.Greeter(
    "localhost:50051",
    grpc.credentials.createInsecure()
  )

  // 方式一：回调形式
  client.sayHello({ name: "tom" }, function (err, res) {
    console.log("Greeting: ", res.message)
  })

  // 方式二：await 暂不支持，见 https://github.com/grpc/grpc-node/issues/54
  // const response = await client.sayHello({ name: "tom" })

  // 方式三： 临时方案：可以使用 utils/promisify 包一下
  const sayHello = promisify(client.sayHello).bind(client)
  const res = await sayHello({ name: "tom promise" })
  console.log("Greeting: ", res.message)
}

main()
```

## 参考链接

- [10分钟带你彻底搞懂 RPC 架构](https://juejin.cn/post/7199456238191116345)
- [既然有 HTTP 请求，为什么还要用 RPC 调用？](https://www.zhihu.com/question/41609070) ---往后看多个精彩回答
- [深入浅出：如何正确使用 protobuf](https://zhuanlan.zhihu.com/p/406832315) --- protobuf 封包原理
