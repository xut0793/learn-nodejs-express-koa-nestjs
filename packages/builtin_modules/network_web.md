# WEB

web 全称 World Wide Web

## 历史演变

| 时间  | 关键事件                     | 意义                                                   |
| :---- | :--------------------------- | :----------------------------------------------------- |
| 1989  | 蒂姆·伯纳斯-李提出万维网构想 | 奠定了信息互联的理论基础                               |
| 1991  | 第一个网站上线               | Web 正式诞生，向世界展示潜力                           |
| 1993  | CERN 宣布 Web 技术开源免费   | 最关键的决定，引爆了全球创新                           |
| 1994  | 成立 W3C (万维网联盟)        | 制定标准，防止浏览器战争导致分裂                       |
| 2004+ | Web 2.0 概念兴起             | 用户生成内容爆发，社交网络时代到来                     |
| 2014+ | Web 3.0 概念兴起             | 基于区块链技术的去中心化互联网，但尚未普用，仍在演化中 |

### 起源

为了解决“遗忘”的烦恼 (1989-1990)

1989 年的欧洲核子研究中心（CERN），当时的蒂姆·伯纳斯-李是一名软件工程师，他面临着一个很实际的问题：CERN 有很多来自世界各地的科学家，他们使用不同类型的计算机，信息更新频繁且难以追踪。
蒂姆发现，虽然大家都有电脑，但要在不同系统间共享信息非常困难。于是，他向导师提交了一份名为《关于信息管理的建议》的文件。虽然导师当时的评价是“模糊但激动人心”，但蒂姆并没有放弃。他做了一件伟大的事：他不仅发明了概念，还亲手打造了实现这一概念所需的三样基石，这也是我们今天 Web 开发的核心：

- HTTP (hypertext transfer protocol，超文本传输协议)：用于在Web客户端和服务器之间交换请求和响应的协议。
- HTML (hypertext markup language，超文本标记语言)：用来在电脑中显示内容。
- URL (uniform resource locator，统一资源定位符)：唯一标识服务器中资源的方式。

1990 年底，他在 NeXT 电脑上编写了第一个网页浏览器和服务器，并在 1991 年 8 月 6 日上线了世界上第一个网站。这个服务器的功能非常纯粹：接收客户端请求，然后从磁盘上找到对应的 HTML 文件，并将其原封不动地发送回去。

### 关键转折：伟大的“免费”决定

这里有一个必须强调的细节，这也是为什么 Web 能如此繁荣的原因。
上述功能的实现，全部建立在计算机联网基础之上，当时的互联网尚未商业化，只为少数大学和研究机构知道。

1993 年，蒂姆说服了 CERN 将万维网的源代码永久免费向公众开放，并且不申请专利。这是一个极其理想主义的决定。如果他当时选择收费或申请专利，互联网可能就会分裂成几个互不兼容的商业网络，绝不会有今天这种爆炸式的增长。

同年，伊利诺伊大学的一群学生发布了Mosaic浏览器（适用于Windows、Macintosh和Unix）和 NCSA httpd 服务器时，网络意识才真正得到传播。当时全球大概只有500个Web服务器。

等到1994年年底，Web服务器的数量已增长到了10000台。互联网开放了商业用途，Mosaic的作者创办了从事编写商业Web软件的Netscape公司。Netscape作为早期互联网热潮的一部分在纳斯达克上市，Web迎来爆炸式增长。

### Web 1.0：只读的静态时代 (约 1991 - 2003)

- 特征：这是“门户网站”的时代。网页主要是静态的 HTML，由开发者或编辑编写，用户只能被动地浏览信息。
- 体验：就像看一本在线的电子杂志或百科全书。
- 代表：早期的雅虎、新浪等门户网站。用户只是信息的消费者。

### Web 2.0：可读写的交互时代 (约 2004 - 至今)

- 特征：这是“社交媒体”的时代。AJAX(Asynchronous JavaScript and XML) 等技术的出现让网页不再需要频繁刷新，体验更流畅。更重要的是，用户开始成为内容的创造者。
- 体验：我们可以发博客、上传视频、在维基百科修改词条、在社交网络互动。
- 代表：Facebook、YouTube、Twitter、以及现在的各种 SaaS 应用。
- 代价：数据开始集中在少数科技巨头手中（也就是现在的“平台孤岛”现象），隐私问题日益严重。

### Web 3.0：价值与智能的未来 (正在发生)

蒂姆的初衷：早在 2006 年，蒂姆就提出了“语义网”的概念，希望机器能像人一样理解数据的含义，实现更智能的自动化服务。

现在的定义：如今大家口中的 Web3 更多指基于区块链的去中心化网络。它试图解决 Web 2.0 中数据被巨头垄断的问题，主张用户应该拥有自己的数据所有权（比如通过 Pod 个人数据仓）。

## web 网关协议

早期的 Web（1990 年代初，包括web创建和web1.0门户时代）只能提供静态 HTML 文件，服务器只做一件事：接收 HTTP 请求 → 返回静态 HTML / 图片文件。

随着互联网的发展，用户需要动态交互（如表单提交、数据库查询），于是 CGI（Common Gateway Interface） 应运而生。

### CGI

CGI（Common Gateway Interface） 的核心思想：Web 服务器收到请求后，因为是动态内容，需要启动一个外部程序（如 Shell/python），通过环境变量和标准输入传递请求过来数据进行处理，处理完成后通过标准输出返回 HTTP 响应，然后进程销毁。

但是这样处理流程存在的问题是：

- 每次请求都要 fork 一个新进程，因为应用程序启动至少需要在一个进程上运行，开销巨大，特别是在高并发场景下性能差，响应缓慢
- 无法复用资源（如数据库连接）
- 缺乏统一接口，不同语言、框架实现混乱

CGI 实现了“Web 服务器”与“应用程序”的初步分离，但性能差、无标准，没有分层，无法扩展。

### fastcgi

为了解决 CGI 的性能问题，出现了 FastCGI。

FastCGI 引入了“常驻进程”的概念，响应动态内容的应用程序不再随请求启动，而是预先启动一组进程（进程池），避免程序频繁创建和销毁进程，显著提升了性能。

不管是 CGI 还是 FastCGI 的实现，Web 服务器通过 Socket（通常是 Unix Domain Socket）与这些常驻进程通信，分发请求。

虽然 fastcgi 引入常驻进程，提升了一定性能，但是应用程序无法复用和扩展的痛点还是没有解决：比如写的业务代码（登录、订单），不想绑定死在某一个服务器（Apache）上，希望能快速移植到另一种服务器(Lighttpd)上也能运行。

于是行业达成共识：定义一套标准接口，让任意 Web 应用和任意 Web 服务器能无缝对接。

- 服务器专注做 HTTP 协议解析、网络连接、并发管理等处理
- 应用程序专注业务逻辑处理

这样的标准化协议就是 WSGI（Python）、Servlet（Java）、 Rack（Ruby）、PSGI（Perl）。

### Java 的 Servlet

Java 的出现彻底改变了服务端开发的格局，解决了 CGI 的性能瓶颈，并建立了企业级开发的标准。

Servlet 通常包含三部分内容：Servlet 规范、Servlet 容器、Servlet 程序。

- Servlet 规范：1997年，Sun 公司推出了 Servlet 技术。它本质上是 Java 版的 CGI，但更加聪明。Servlet 运行在 Java 虚拟机（JVM）上，采用多线程而非多进程来处理请求，极大地节省了系统资源。
- Servlet 容器（如 Tomcat）：Servlet 不能独立运行，必须依赖“Servlet 容器”（也称 Web 容器）。容器负责管理 Servlet 的生命周期（加载、初始化 init、服务 service、销毁 destroy）、处理 HTTP 请求与响应、以及管理线程池等底层杂务。
- Servlet 程序： Servlet 程序是一个实现业务逻辑的 Java 类，继承了 `javax.servlet.Servlet` 接口，并实现 `javax.servlet.Servlet` 接口的方法。

企业级开发标准还包装 JSP和JDBC规范：

- JSP (Java Server Pages)：由于直接用 Servlet 拼接 HTML 字符串非常痛苦，Sun 推出了 JSP。它允许开发者在 HTML 中嵌入 Java 代码。但需要注意的是，JSP 的本质依然是 Servlet——它在第一次被访问时，会被容器翻译成 Servlet 源码并编译成字节码执行。
- JDBC (Java Database Connectivity)：作为 Java 连接数据库的标准接口，JDBC 让 Java Web 应用能够轻松地与 MySQL 等关系型数据库进行交互，完成了动态网站“数据持久化”的关键一环。

JDK 内置的 HttpServer 定位非常明确：它是一个轻量级、用于测试或嵌入式场景的工具。

- 教学与演示：非常适合用来向学生或初学者演示 HTTP 协议底层的请求与响应是如何工作的，代码量极少，没有复杂的框架配置。
- 轻量级测试桩（Mock Server）：在写单元测试时，如果你需要一个临时的 HTTP 服务来模拟第三方接口返回数据，用它可以几行代码快速启动一个，测试完即停，非常方便。
- 嵌入式/工具类应用：比如你写了一个本地的 Java 桌面小工具，想通过浏览器访问 localhost:8080 来查看一些本地状态或进行简单控制，引入一个庞大的 Tomcat 显然太重了，内置的 HttpServer 就刚刚好。

用于生产环境的企业级web服务器需要干的事：

- TCP
- HTTP
- SSL
- 高并发
- 长连接
- 线程池 / 进程池
- 优雅重启
- 负载均衡、限流
- 安全处理
- 反向代理
- 工业级稳定性
- 实现 WSGI 接口
- 协议兼容：HTTP/HTTPS/HTTP2/HTTP3，应用代码不需要适配新的 HTTP 协议，只需要服务器升级，应用无感兼容。

### python 的 WSGI

WSGI(Web Server Gateway Interface) 定义了 Python 语言中 Web 服务器和 Python 应用之间的通用接口。它将 Web 开发分为了两个明确的角色：

- WSGI Server：负责处理网络 I/O（TCP/Socket）、HTTP 协议解析、并发控制（多进程/多线程）、心跳、超时、端口监听等，并将请求封装成 Python 对象。
- WSGI Application：负责业务逻辑，接收请求，返回响应。

WSGI 相较于其它web网关协议（Servlet），协议内容非常简单，只规定两件事：

- Web 应用程序入口必须是一个**可调用对象（函数 / 类**），这个对象必须接收 2 个参数：
  - environ：请求环境字典（请求头、路径、方法等）
  - start_response：服务器提供的回调函数
- 应用必须返回**可迭代的字节串（bytes）** 作为响应体

就这么简单！根本不是复杂框架，它只是一个**函数约定**。

```python
# 就是符合 WSGI 标准的应用，它能跑在任何 WSGI 兼容的 Web 服务器中，比如 Gunicorn / uWSGI / Apache(mod_wsgi) / Nginx
def app(environ, start_response):
    # 告诉服务器：状态码 + 响应头
    start_response('200 OK', [('Content-Type', 'text/plain; charset=utf-8')])
    # 返回 可迭代的 bytes 数据
    return [b"Hello, I am a real WSGI APP!"]
```

当然，服务器也必须遵守 WSGI 规范。它需要调用 app 函数，并传入 environ 和 start_response 两个参数。

```python
# 极简 WSGI 服务器（遵守协议）
def wsgi_server(application):
    # 1. 构造请求环境
    environ = {}
    # 2. 定义响应回调
    def start_response(status, headers):
        print(f"状态: {status}")
    # 3. 调用 WSGI 应用！！！
    response = application(environ, start_response)
    # 4. 返回给客户端
    return response

# 运行
wsgi_server(app)
```

一句话总结 WSGI 就是一个函数签名。

### Python 的 ASGI

WSGI 是同步的，如果一个请求需要查询数据库（耗时 2秒），处理该请求的线程/进程就会被阻塞，无法处理其他请求。为了解决这个问题，ASGI 诞生了。

ASGI 将“请求-响应”模型升级为“连接-事件”模型。

核心变化：

- 异步：应用是 async def 协程，支持 await。
- 全双工：支持 WebSocket，服务器和客户端可以随时互相发消息，而不需要等待请求完成。
- 生命周期：引入了 lifespan 概念，用于处理应用启动和关闭事件。

### 与 Servlet 的对比

WSGI 是 Python 社区轻量约定，只是一个**函数签名规范**。

Servlet 是 Java JSR 官方强制工业标准，是一套完整接口、生命周期、容器规范。

两者的初衷一致，实现业务代码 和 HTTP 服务器 彻底解耦。

WSGI 约定了函数签名必须有两个参数 `(environ, start_response)`，同样，Servlet 也有类似的概念 `ServletRequest, ServletResponse`：

- HttpServletRequest 对应 WSGI environ，封装了：请求头、请求参数、URL、Method、Cookie、Body
- HttpServletResponse 对应 WSGI start_response，封装了：设置状态码、响应头、输出响应体、Cookie

web 服务器 Tomcat (Java Servlet 容器) 对比 Gunicorn (Python WSGI 容器)，其它类似还是 Jetty、Undertow 等。

但是区别在于 Tomcat / Jetty / Undertow 主体 99% 纯 Java 编写，基于 Java 原生 `java.net.Socket / java.nio / NIO2 / Java 标准 IO、线程池、网络 API`，没有依赖 C 写的底层网络框架，纯 Java 网络栈。

为什么 Java 容器不用 C 写？Java 核心卖点：跨平台、JVM 隔离、企业级安全规范，如果用 C 写底层，会丧失跨平台、JVM 管控、统一规范。Java 生态设计哲学：一切皆 JVM 内标准化。

| 维度     | Python WSGI                        | Java Servlet                                  |
| -------- | ---------------------------------- | --------------------------------------------- |
| 规范形式 | 轻量函数约定、弱类型               | 官方 JSR 接口规范、强类型                     |
| 核心入参 | environ 字典 + start_response 回调 | HttpServletRequest + HttpServletResponse 对象 |
| 生命周期 | 无                                 | 完整 init/service/destroy                     |
| 容器     | Gunicorn、uWSGI                    | Tomcat、Jetty、Undertow                       |
| 框架底层 | Flask/Django 实现 WSGI callable    | SpringMVC 基于 DispatcherServlet              |
| 设计风格 | 极简、灵活、脚本化                 | 严谨、重型、企业级                            |

### 为什么 Node.js 没有类似 WSGI/Servlet 的强制规范？

这是最容易误解的点：Node.js 不是没有规范，而是规范内置在语言运行时（runtime） 中，从底层原生就支持 web 服务器的功能需求。

1. Node.js 的诞生初衷：专为 Web/I/O 设计，Java/Python 是先有语言，后补 Web 规范；Node.js 从第一天就是为了写高性能 Web 服务而生，所以Node.js 内置了基于 C++ 实现的原生 HTTP 模块，该模块的不像 python 内置标准库中 http 模块的简单功能，而是完全满足 web 服务器的需求。
2. Node.js 不是没有标准，内置的 `Request/Response` 对象、`Stream` 流模型已经是事实上的标准。
3. 架构设计：单线程异步模型，无需重型规范。Java/Python 是多线程 / 多进程同步模型，需要web服务器实现管理进程池、线程池、请求上下文，必须靠 WSGI/Servlet 做请求转发、生命周期管理；Node.js 是单线程异步非阻塞模型，天生高并发，不需要复杂的进程 / 线程管理，原生 HTTP 模块已经处理了所有底层逻辑，应用直接对接。
4. 生态风格：轻量灵活，反对重型约束。Node.js 属于前端全栈生态，追求极简、灵活、快速开发；Java/Python 属于企业级生态，追求严谨、标准、兼容、安全。强制规范（Servlet/WSGI）是重型架构的必需品，但不符合 Node.js 的设计哲学。

### 总结

Python 体系（WSGI 规范）

```txt
客户端HTTP请求
        ↓
OS内核TCP/IP
        ↓
【Gunicorn / uWSGI】
✅ 核心C语言 + 少量Python
✅ 自研高性能网络层，不使用 http.server / SocketServer
✅ 实现：WSGI 服务端规范
        ↓
封装 → environ字典 + start_response回调
        ↓
【Flask / Django】
✅ 业务层，遵守 WSGI 应用端规范
❌ 不碰底层网络
```

Java 体系（Servlet 规范）

```txt
客户端HTTP请求
        ↓
OS内核TCP/IP
        ↓
【Tomcat / Jetty / Undertow】
✅ 纯Java实现、基于JDK Socket/NIO
✅ 自己解析HTTP协议、线程池、连接管理
✅ 实现：Servlet 容器规范
        ↓
封装 → HttpServletRequest / HttpServletResponse
        ↓
【SpringMVC/DispatcherServlet / 原生Servlet】
✅ 业务层，只处理路由、业务、数据库
❌ 不碰Socket、不碰HTTP解析
```

Node.js 体系（无外置规范）

```txt
客户端HTTP请求
        ↓
OS内核TCP/IP
        ↓
Node.js 内置【C++实现的http模块 + 事件循环】
✅ 运行时原生自带HTTP服务、TCP库、事件IO
✅ 天然统一 req/res 对象（事实标准）
        ↓
【Express/Koa/Nest】
✅ 直接复用原生http模块对象
✅ 不需要 WSGI/Servlet 这种中间规范
```

### Web 框架

随着web发展，业务逻辑越来越复杂，一个生产可用的 web 应用程序，还需要处理很多事情，比如：

- 处理与业务相关 HTTP 数据，比如查询参数、路径参数、头字段和不同 content-type 类型的请求体数据等。
- 认证：authenticate(authn) 你是谁的问题
- 授权：authorize(authz) 你能做什么的问题
- 建立会议：设置和解析 session 和 cookie
- 静态文件处理：比如 CSS、JS、图片、视频等
- 视图模板
- 路由：匹配 URL 到具体处理函数
- 动态数据持久化：连接数据库、缓存、第三方服务
- 错误处理
- 日志处理
- 测试
- 监控
- 文档

上述事情基本都是一个 web 应用程序通用能力，所以会再抽象一层，有些程序会把这些能力进行封装，而我们使用时只需要书写实际业务逻辑代码就可以了，这样的程序我们称为 web 框架。

> 架构分层，MVC 设计模式：MVC（Model-View-Controller）将应用拆分为模型（数据与业务）、视图（界面展示）和控制器（请求调度）。这种“关注点分离”的思想让代码变得清晰、可维护。

在 JavaScript 语言领域，基于 Node.js 构建的 web 框架出现了很多，Express 框架，Koa 框架，Nestjs 框架等等。

进入移动互联网和云原生时代，开发效率、轻量化和分布式能力成为了新的追求。

在 web 应用架构方面，基于 RESTful 架构风格的前后端分离成为主流，后端不再负责渲染页面（比如 ejs 等视图模板库逐渐被淘汰），而是通过 HTTP 协议提供标准的 JSON 格式数据接口（RESTful API），供前端（Vue/React）或移动端调用。

在云原生时代，web 应用架构演化到了“微服务"架构，通常 Web 服务端应用会被拆分为一个个独立的、细粒度的微服务，实现了服务发现、配置中心、熔断降级等分布式能力。

## 总结

上述内容，不管是 web 网关协议，还是 web 框架，都在践行计算机世界的一条格言：

“All problems in computer science can be solved by another level of indirection（计算机科学中的所有问题都可以通过增加一个间接层来解决）”

这名话出自 David Wheeler（剑桥大学计算机科学教授），这个思想影响非常深远。不管是软件领域从设计模式到架构设计，还是硬件领域中从网络分层模型，存储系统层次结构等设计都可以见识到这句话的影响。当你遇到任何计算机相关问题感觉没法解决时，或者没想明白时，首先想到的应该是这句话！
