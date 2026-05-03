# IP 和 DNS

## IP 地址 (Internet Protocol Address)

IP 地址是互联网协议地址的简称，它是分配给网络上每台设备（如电脑、手机、服务器）的唯一逻辑标识符。

- 作用： 在网络中精确定位设备，确保数据包能够准确送达。没有 IP 地址，设备之间就无法通信。
- 类型：
  - IPv4: 最常见的格式，由 32 位二进制数组成，通常用点分十进制表示，如 `192.168.1.1`。由于地址资源即将耗尽，它正逐渐被 IPv6 取代。
  - IPv6: 由 128 位二进制数组成，用十六进制表示，如 `2001:0db8:85a3::8a2e:0370:7334`。它能提供几乎无限的地址空间。
- 分类：
  - 公网 IP: 在全球互联网上唯一的地址，可以直接被访问。
  - 私有 IP: 在局域网（如家庭、公司网络）内部使用的地址，不能在互联网上直接访问。常见的私有网段有 `192.168.0.0/16`、`10.0.0.0/8` 等。

## DNS (Domain Name System)

> 参考链接 [了解一下 DNS 和 CDN](https://wzp-coding.github.io/blog-press/technology/computer-network/DNS%E4%B8%8ECDN.html#%E4%BB%80%E4%B9%88%E6%98%AF-dns)

DNS 是域名系统的简称，它所提供的服务主要是用来将主机名和域名转换为 IP 地址的工作，比如将人类易于记忆的域名（如 www.example.com）转换为机器路由的 IP 地址（如 `93.184.216.34`），这个过程被称为 DNS 解析。

DNS 它是一个分布式的、层级化的数据库，基于 UDP 协议，使用 `53` 端口通信。

### DNS 解析过程：

- 用户主机上运行着 DNS 的客户端，就是我们的 PC 机或者手机客户端运行着 DNS 客户端，比如 Chrome 浏览器。
- 浏览器输入www.qq.com域名，操作系统会先检查自己本地的hosts文件是否有这个网址映射关系，如果有，就先调用这个 IP 地址映射，完成域名解析。
- 如果 hosts 里没有这个域名的映射，则查找本地 DNS 解析器缓存，是否有这个网址映射关系，如果有，直接返回，完成域名解析。
- 如果 hosts 文件与本地 DNS 解析器缓存都没有相应的网址映射关系，首先会找 TCP/IP 参数中设置的首选 DNS 服务器，，在此我们叫它本地 DNS 服务器，此服务器收到查询时，如果要查询的域名包含在本地配置区域资源中，则返回解析结果给客户机，完成域名解析，此解析具有权威性。
- 如果要查询的域名，不由本地 DNS 服务器区域解析，但该服务器已缓存了此网址映射关系，则调用这个 IP 地址映射，完成域名解析，此解析不具有权威性。
- 如果本地 DNS 服务器本地区域文件与缓存解析都失效，则根据本地 DNS 服务器的设置（是否设置转发器）进行查询，如果未用转发模式（迭代查询），本地 DNS 就把请求发至13 台根 DNS 服务器，根 DNS 服务器收到请求后会判断这个域名（.com）是谁来授权管理，并会返回一个负责该顶级域名服务器的一个 IP，本地 DNS 服务器收到 IP 信息后，将会联系负责.com域的这台服务器。这台负责.com域的服务器收到请求后，如果自己无法解析，它就会找一个管理.com域的下一级 DNS 服务器地址（http://qq.com）给本地 DNS 服务器。当本地 DNS 服务器收到这个地址后，就会找http://qq.com域服务器，重复上面的动作，进行查询，直至找到www.qq.com主机。
- 如果用的是转发模式（递归查询），此 DNS 服务器就会把请求转发至上一级 DNS 服务器，由上一级服务器进行解析，上一级服务器如果不能解析，或找根 DNS 服务器，或把请求转至上上级，以此循环，不管是本地 DNS 服务器用的是转发，还是根提示，最后都是把结果返回给本地 DNS 服务器，由此 DNS 服务器再返回给客户机。
- 从客户端到本地 DNS 服务器是属于递归查询，而DNS 服务器之间的交互查询就是迭代查询(未用转发模式)或者递归查询(转发模式)。

### chrome 获取 DNS 服务器

Chrome 如何获取 DNS 服务器，这里以linux 系统为例：

- Chrome 是调res_ninit (opens new window)这个系统函数(Linux)去获取系统的 DNS 服务器，这个函数是通过读取 `/etc/resolver.conf` 这个文件获取 DNS
- Chrome 在启动的时候根据不同的操作系统去获取 DNS 服务器配置，然后将它放到 DNSConfig 里面的 nameservers(Chrome 还会监听网络变化同步改变配置)，然后用这个 nameservers 列表初始化一个 socket pool(套接字池)
- 套接字是用来发请求的，在需要做域名解析的时候会从套接字池里面取出一个 socket，并传递想要用的 server_index，初始化的时候是 0，即取第一个 DNS 服务 IP 地址，一旦解析请求两次都失败了，则 server_index + 1 使用下一个 DNS 服务
- Chrome 在启动的时候除了会读取 DNS server 之外，还会去取读取和解析 hosts 文件，放到 DNSConfig 的 hosts 属性里面，它是一个哈希 map(hosts 文件在 linux 系统上是在/etc/hosts)
- 这样 DNSConfig 里面就有两个配置了，一个是 hosts，另一个是 nameservers，DNSConfig 是组合到 DNSSession，它们的组合关系如下图所示
- resolver 是负责解析的驱动类，它组合了一个 client，client 创建一个 session，session 层有一个很大的作用是用来管理 server_index 和 socket pool 如分配 socket 等，session 初始化 config，config 用来读取本地绑的 hosts 和 nameservers 两个配置
- resolver 有一个重要的功能，它组合了一个 job，用来创建任务队列。resolver 还组合了一个 Hostcache，它是放解析结果的缓存，如果缓存命中的话，就不用去解析了
- 这个过程是这样的，外部调 rosolver 提供的 HostResolverImpl::Resolve 接口，这个接口会先判断在本地是否能处理，即先调 serveFromCache 去 cache 里面看有没有
  - 如果 cache 命中的话则返回
  - 否则看 hosts 是否命中，如果返回值不等于 CACHE_MISS，则直接返回。如果都不命中则返回 CACHE_MISS 的标志位，接着创建一个 job，并看是否能立刻执行，如果 job 队列太多了，则添加到 job 队列后面，并传递一个成功的回调处理函数
- 所以这里和我们的认知基本上是一样的，先看下 cache 有没有，然后再看 hosts 有没有，如果没有的话再进行查询。在 cache 查询的时候如果这个 cache 已经过时了即 staled，也会返回 null
- 如果域名在本地不能解析的话，Chrome 就会去发请求了。操作系统提供了一个叫 getaddrinfo 的系统函数用来做域名解析，但是 Chrome 并没有使用，而是自己实现了一个 DNS 客户端，包括封装 DNS request 报文以及解析 DNS response 报文。这样可能是因为灵活度会更大一点，例如 Chrome 可以自行决定怎么用 nameservers，顺序以及失败尝试的次数等
- 在 resolver 的 startJob 里面启动解析。取到下一个 queryId，然后构建一个 query，再构建一个 DnsUDPAttempt(因为 DNS 客户端查询使用的是 UDP 报文，辅域名服务器向主域名服务器查询是用的 TCP)，再执行它的 start，然后开始解析，最后解析成功之后，会把结果放到 cache 里面，然后生成一个 addressList，传递给相应的 callback，因为 DNS 解析可能会返回多个结果

## 域名解析

Nodejs 的 `dns` 模块用于处理 IP 地址和 DNS 解析。

它提供了两种截然不同的 API 风格，这是资深开发必须注意的区别：

- 系统底层调用（异步但受系统缓存影响）：如 `dns.lookup()`。
- 直接连接 DNS 服务器（纯网络请求）：如 `dns.resolve()` 系列。

| 方法                                        | 说明                                                                        | 特点                                                                                |
| :------------------------------------------ | :-------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| `dns.lookup(hostname[, options], callback)` | 将域名解析为第一个找到的 A 记录 (IPv4) 或 AAAA 记录 (IPv6)。                | 底层调用：使用操作系统的 `getaddrinfo` 实现，受系统 hosts 文件和本地 DNS 缓存影响。 |
| `dns.resolve(hostname[, rrtype], callback)` | 使用 DNS 协议直接查询域名。`rrtype` 可指定记录类型（如 'A', 'MX', 'TXT'）。 | 纯网络请求：绕过本地 hosts 和缓存，直接查询配置的 DNS 服务器，结果更权威。          |
| `dns.resolve4(hostname, callback)`          | `dns.resolve` 的快捷方式，专门用于查询 IPv4 (A记录)。                       | 返回 IPv4 地址数组。                                                                |
| `dns.resolve6(hostname, callback)`          | `dns.resolve` 的快捷方式，专门用于查询 IPv6 (AAAA记录)。                    | 返回 IPv6 地址数组。                                                                |
| `dns.reverse(ip, callback)`                 | 执行反向 DNS 解析，将 IP 地址解析为域名数组。                               | 常用于日志分析或反垃圾邮件校验。                                                    |
| `dns.setDefaultResultOrder(order)`          | 设置 `dns.lookup()` 返回结果的排序规则（如 `ipv4first` 或 `verbatim`）。    | Node.js 17+ 后默认优先返回 IPv6，可通过此方法改回 IPv4 优先。                       |

```js
const dns = require("dns")
const util = require("util")

// 将回调函数 Promise 化，方便使用 async/await
const lookupPromise = util.promisify(dns.lookup)
const resolve4Promise = util.promisify(dns.resolve4)
const reversePromise = util.promisify(dns.reverse)

async function dnsExample() {
  const domain = "www.baidu.com"

  try {
    // 1. 使用 lookup (受系统 hosts 影响，适合日常网络请求前的解析)
    const lookupRes = await lookupPromise(domain, { family: 4 }) // 强制指定 IPv4
    console.log(`[lookup] ${domain} 解析结果:`, lookupRes)
    // 输出示例: { address: '110.242.68.3', family: 4 }

    // 2. 使用 resolve4 (直接查询 DNS 服务器，获取所有 A 记录)
    const resolveRes = await resolve4Promise(domain)
    console.log(`[resolve4] ${domain} 所有 IPv4 地址:`, resolveRes)
    // 输出示例: [ '110.242.68.3', '110.242.68.4' ]

    // 3. 反向解析 (注意：很多 IP 出于安全考虑未配置 PTR 记录，可能会报错)
    const ipToResolve = resolveRes[0]
    try {
      const reverseRes = await reversePromise(ipToResolve)
      console.log(`[reverse] IP ${ipToResolve} 反向解析域名:`, reverseRes)
    } catch (err) {
      console.log(`[reverse] IP ${ipToResolve} 无法反向解析:`, err.message)
    }
  } catch (error) {
    console.error("DNS 解析出错:", error)
  }
}

dnsExample()
```

注意事项：

- lookup 与 resolve 的选择：如果你在写一个爬虫或网络代理工具，建议使用 dns.resolve 系列方法，因为它能绕过本地被污染的 hosts 文件，获取更真实的 DNS 记录。如果是普通的业务服务器请求，dns.lookup 性能更好且符合系统网络配置习惯。
- IPv6 优先策略：从 Node.js v17 开始，DNS 解析默认优先返回 IPv6 地址。如果你的服务器环境对 IPv6 支持不完善，可能会导致连接超时。建议在项目入口文件加入 dns.setDefaultResultOrder('ipv4first') 来强制 IPv4 优先。
- 错误处理：DNS 解析是极易失败的操作（网络波动、域名不存在等），在生产环境中务必做好 try-catch 兜底，并考虑引入带重试机制的第三方库（如 @serverless/dns 或自行封装重试逻辑）。
