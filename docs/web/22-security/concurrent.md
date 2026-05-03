# 并发能力

想像一个请求发送到响应必然经过的节点：

1. 客户端发起请求
2. 网络（HTTP / TCP）传输请求
3. 服务端接收和响应请求

那么并发的控制，也可以从这三个节点上来处理。先来看下对于业务开发不可控的网络节点提供的并发控制处理。

## HTTP/1 与 HTTP/2 的并发处理区别

目前在 HTTP/1.x 协议下，各大浏览器对并发请求限制数量 6-8个（同一域名有效），实测谷歌浏览器是同时6个。但在 HTTP/2 协议下，没有限制，多个请求同时发起。

HTTP/1 和 HTTP/2 对并发请求的处理区别原因在于:

- 浏览器限制的不是 HTTP 请求个数，而是 TCP 连接个数。
- 在 HTTP/1.1 的持久连接 keep-alive，多个请求建立一个 TCP 连接，按顺序返回，只能串行执行。所以HTTP/1.1 浏览器（谷歌）为每个域名最多同时维护 6 个 TCP 持久连接；
- 但是 HTTP/2 的多路复用代替 HTTP/1.1 的序列和阻塞机制，一个域名下所有通信都在一个 TCP 连接下完成。单个连接上可以承载任意数量的双向数据流，所以单个连接上可以并行交错的发送多个请求和响应，之间互不干扰。这样解决了浏览器限制同一个域名下的请求数量的问题。

> HTTP/1 采用文本格式传输数据，HTTP/2 采用二进制数据帧格式传输，实现的多路复用功能正是基于二进制数据帧 frame 的传输、流 stream、消息 message，可以做到乱序的传输，通过帧中的标识知道属于哪个请求。通过这个技术，可以避免 HTTP 旧版本中的队头阻塞问题，极大的提高传输性能。

> 1. [前端性能优化之控制并发请求数量的理解](https://juejin.cn/post/7319872428405522451)
> 2. [Http系列(二) Http2中的多路复用](https://juejin.cn/post/6844903935648497678)

## 控制并发的必要性

尽管 HTTP/2 已经允许并发请求，并且服务器和浏览器会在合适的情况下自动进行优化，但前端仍然需要关注并控制并发请求的数量，以确保最佳的性能和用户体验。

- 过多的请求同时进行时，可能会导致网络阻塞和资源竞争，从而降低页面加载速度和性能。通过在前端控制并发请求数量，可以确保页面中的关键资源优先加载，提高用户体验。
- 带宽限制： 尽管 HTTP/2 允许多路复用，但在某些情况下，客户端的带宽可能仍然是有限的。当并发请求过多时，可能会导致带宽过载，导致性能下降，甚至出现请求超时等问题。
- 服务器资源： 虽然 HTTP/2 减少了服务器和客户端之间的连接数量，但服务器仍然需要分配资源来处理请求。在高并发的情况下，服务器可能会面临负载过重的风险。因此，通过控制并发请求，可以避免服务器过载和性能下降。
- 请求优先级： HTTP/2 允许为每个请求设置优先级，以指定请求的重要性。在某些情况下，一些请求可能比其他请求更重要。通过限制并发请求，可以更好地控制请求的优先级，确保重要的请求得到更快的响应。

在实际开发中，可以使用适当的技术和工具来限制并发请求，比如合并请求，批量请求，并发控制等方式，以提高网页的性能和加载速度。

## 客户端并发控制策略

为了实现并发控制，可以使用多种策略，包括：

1. 批处理：将多个请求合并成一个请求，这需要服务端支持，比如说支持传入批量 ids 查询等
2. 节流：在特定时间内限制请求的数量，比如每秒只允许发出一个请求 lodash.throttle，比如懒加载的滚动列表请求
3. 防抖：如果有场景会触发大量连续请求，进行防抖处理，在一定延迟时间内只执行最后一次请求，比如输入框的远程搜索 lodash.debounce
4. 单线程异步 Promise / RxJS：适用网络 IO。
5. 多线种异步：web worker：适用于脚本并发逻辑。

### 单线程异步

最常用的并发手段就是异步，它不会因为资源的消耗而阻塞主线程的执行。在单线程异步的解决方案有：

1. Promise
2. RxJS

Promise 是最通用的方案。一般我们最先想到 `Promise.all`，当然最好是使用新出的 `Promise.allsettled`，两都区别在于对于失败请求的处理，`Promise.all` 中只要有一个请求失败整个Promise会置为 rejected，并且无法获知是哪个请求失败。而 `Promise.allsettled` 可以避免这种情况。

假如多个请求同时发出时，存在失败请求时会有如下处理方式：

- 让整体也失败
- 最终结果是过滤掉失败的请求
- 处理失败的请求，比如将失败原因显示到页面

`Promise.all`只能处理第一种情况。而 `Promise.allsettled` 对三种处理方式都支持。所以对于大部分场景来说，`Promise.allsettled` 更为灵活，是更好的选择。

> RxJS，一个用于处理异步数据流的 JavaScript 库，它通过可观察对象（Observable）来代表随时间推移发出值的数据流。你可以使用一系列操作符（如 map、filter、merge 等）来处理这些数据流，并通过订阅（subscribe）来观察并执行相关操作。RxJS 使得处理复杂的异步逻辑变得简单而优雅，特别适合于实现并发控制等场景。

并发请求根据场景划分：

- 全部并发：适用于可以批量请求，但并发量不大的场景，简单易懂，但可能不是最高效的方法。
- 分批并发：在保持一定并发度的同时，避免同时发出过多的请求。但是由最慢 fulfilled 的请求开启下一批请求。
- 限制并发：持续维护限制数量下的请求，并且由最早 fulfilled 的请求开启下一个请求。

### 全部并发

如果需求有一批量 urls 请求，简单场景下，直接循环请求即可。

这里用一个随机时间的定时器来模拟请求。

```js
// 这个函数是模拟发送请求的，实际中你可能需要替换成真实的请求操作
function request(url) {
  console.log(`request send to ${url}`)
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Response received from ${url}`)
      resolve(`Result from ${url}`)
    }, Math.random() * 2000) // 随机延时以模拟请求处理时间
  })
}

// 测试数据
const urls = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

for 循环全部并发

```js
function concurrentReqByFor(urls) {
  return new Promise((resolve, reject) => {
    if (!(Array.isArray(urls) && urls.length)) return resolve([])

    const resArr = []
    const len = urls.length
    let i = 0

    for (const url of urls) {
      request(url)
        .then((data) => {
          resArr.push(data)
        })
        .catch(reject)
        .finally(() => {
          i++
          if (i === len) {
            return resolve(resArr)
          }
        })
    }
  })
}
```

如果在意整体请求的成功，有一个错误并中断，则可以使用 Promise.all 改造。

```js
/**
 * 使用 Promise.all 并发，可以按 urls 的顺序获取 **全部成功** 请求的结果。
 * 一旦有一个请求失败，将 reject
 *
 * @param {array} urls
 * @returns
 */
function concurrentReqByPromiseAll(urls) {
  return new Promise((resolve, reject) => {
    if (!(Array.isArray(urls) && urls.length)) return resolve([])

    const promiseArr = urls.map((url) => request(url))
    Promise.all(promiseArr).then(resolve).catch(reject)
  })
}
```

如果需要所有请求成功和失败的令牌，则可以替换成 Promise.allsettled 改造，并自动通过 res.status 过滤成功和失败的请求结果。

```js
/**
 * 使用 Promise.allsettled 并发，可以按 urls 的顺序获取每个请求的结果
 * res.status = fulfilled / rejected
 * res.value 仅当 status 为 "fulfilled"，promise 兑现的值。
 * res.reason 仅当 status 为 "rejected"，，promise 拒绝的原因。
 *
 * @param {array} urls
 * @returns
 */
function concurrentReqByPromiseAllsettled(urls) {
  return new Promise((resolve, reject) => {
    if (!(Array.isArray(urls) && urls.length)) return resolve([])

    const promiseArr = urls.map((url) => request(url))
    Promise.allSettled(promiseArr).then(resolve).catch(reject)
  })
}
```

全部并发实现相对简单，适用于并发量不大的场景，简单易懂，但可能不是最高效的方法。

### 分批并发

分批发送的办法，将请求按 limit 数量分成 N 组，每组并行发送，在实现上结合**递归**和 Promise。按需求可以选择 `Promise.all` 或 `Promise.allsettled`，这里以 all 举例。

```js
function concurrentReqByBatch(urls, limit) {
  return new Promise((resolve, reject) => {
    if (!(Array.isArray(urls) && urls.length)) return resolve([])

    const resArr = []
    const len = urls.length
    let i = 0

    const nextBatch = () => {
      const batch = urls.slice(i, i + limit)
      i += limit

      return Promise.all(batch.map(request))
        .then((res) => {
          resArr.push(...res)
        })
        .catch(reject)
        .finally(() => {
          if (i < len) {
            console.log(`---------batch---------`)
            return nextBatch()
          }
          return resolve(resArr)
        })
    }
    return nextBatch()
  })
}
```

实现相对简单，但是它的缺点是，每一批请求中的最慢的请求会决定整个批次的完成时间，这可能会导致一些批次的其他请求早早完成后，还需要等待，从而降低整体的并发效率。

### 限制并发

更高效的思路是使用异步并发控制，而不是简单的批处理。这种方法可以在任何时刻都保持最大数量的并发请求，并且由批处理中最早 fulfilled 的请求开启下一个请求，而不需要等待整个批次完成，效率更高。

#### 实现一，首次并发，之后逐个迭代

首次进行 limit 限制数量的并发，然后在每个请求的 finally 中迭代剩下的请求，来保证持续限制在 <= limit 数量下的请求。

```js
function concurrentReqByIterator(urls, limit) {
  return new Promise((resolve, reject) => {
    if (!(Array.isArray(urls) && urls.length)) return resolve([])

    const resArr = []
    const len = urls.length
    let i = 0 // 保证 urls 顺序取出 url
    let count = 0 // 已完成数量
    let running = 0 // 当前正在请求数，debug 时便于观察的变量，实际可无用

    // 首次并发限制数量的请求
    const max = Math.min(limit, len)
    for (let index = 0; index < max; index++) {
      run()
    }

    function run() {
      // 结果递归的条件
      if (i === len) return

      //闭包用于保存结果下标，便于在resolve时把结果按 urls 对应顺序放到合适的位置
      let cur = i++
      let url = urls[cur]
      running++
      request(url)
        .then((res) => {
          resArr[cur] = res
        })
        .catch(reject)
        .finally(() => {
          // 当前正在请求数减一
          running--

          // 完成数加一
          count++
          console.log(
            "🚀 ~ .finally ~ cur: %s, i: %s, running: %s, count: %s:",
            cur,
            i,
            running,
            count
          )
          if (count === len) {
            return resolve(resArr)
          } else {
            run()
          }
        })
    }
  })
}
```

上述迭代的方法，需要在每个请求的 finally 中进行判断。需要拿到并发的 Promise 中最早改变状态的请求，很自然会想到使用 `Promise.race`。

#### 实现二： Promise.race

使用 Promise.race 实现限制数量的并发

```js
function concurrentReqByPromiseRace(urls, limit) {
  return new Promise((resolve, reject) => {
    if (!(Array.isArray(urls) && urls.length)) return resolve([])

    const resArr = []
    const len = urls.length
    let count = 0 // 已完成数量
    let cur = 0 // 保证 urls 顺序取出 url
    let pool = new Set() // 并发池

    // 首次并发限制数量的请求
    const max = Math.min(limit, len)

    for (let i = 0; i < max; i++) {
      const url = urls[i]
      cur = i

      const p = Promise.resolve().then(() =>
        request(url).then((res) => {
          // 利用闭包，缓存对象
          resArr[i] = res // 并包缓存变量i，保证返回结果数组对应 Urls 顺序
          pool.delete(p)
        })
      )

      pool.add(p)
    }

    Promise.race(pool).then(execute).catch(reject)

    function execute() {
      count++
      cur++
      let i = cur // 并包缓存变量i，保证返回结果数组对应 Urls 顺序

      if (count >= len) {
        resolve(resArr)
      } else if (cur < len) {
        const p = Promise.resolve().then(() =>
          request(urls[i]).then((res) => {
            resArr[i] = res
            pool.delete(p)
          })
        )
        pool.add(p)
      }

      Promise.race(pool).then(execute).catch(reject)
    }
  })
}
```

#### 实现三：Promise.race 配合 async / await 极简实现

利用 await 阻塞 for 循环。

> 注意：await 可以阻塞 for / for-of 等循环，但不能阻塞 forEach

```js
function concurrentReqByPromiseRaceAndAsync(urls, limit) {
  return new Promise(async (resolve, reject) => {
    if (!(Array.isArray(urls) && urls.length)) return resolve([])

    const resArr = []
    const pool = new Set()

    for (let i = 0; i < urls.length; i++) {
      // 对请求包裹一层 Promise，在每个 Promise 完成时，利用闭包函数存在响应结果和在请求池中删除
      const p = Promise.resolve().then(() =>
        request(urls[i])
          .then((res) => {
            // 利用闭包固定 i，使用 resArr 结果顺序和 urls 顺序一致
            resArr[i] = res
          })
          .catch(reject)
          .finally(() => {
            pool.delete(p)

            // 如果并发池已经空了，则返回结果
            if (pool.size === 0) {
              return resolve(resArr)
            }
          })
      )

      pool.add(p)

      if (pool.size >= limit) {
        await Promise.race(pool)
      }
    }
  })
}
```

#### 中断并发

如果需要中断并发，比如分片上传时，中途取消上传。要实现，可以设置一个标识位 isStop，在 for 循环中增加判断，如果已中断，直接 return。

更进一步实现，可以将 axios 或 Fetch 结合 AbortController 实现，让中断并发时将正在进行中的 HTTP 请求也中断掉。然后停止的标识位可以通过 `signal.aborted`

```js
/**
 * 并发可中断
 */
class ConcurrentPool {
  urls = []
  limit = 0
  result = []
  pool = new Set()
  controller = new AbortController()
  signal = this.controller.signal

  constructor(urls, limit) {
    this.urls = Array.isArray(urls) && urls.length ? urls : []
    this.limit = limit
  }

  execute() {
    return new Promise(async (resolve, reject) => {
      if (!this.urls.length) return []

      for (let i = 0; i < this.urls.length; i++) {
        // 如果并发请求已中断，停止执行，直接 rejected
        if (this.signal.aborted) return reject(this.signal.reason)

        const p = Promise.resolve().then(() =>
          // ajax 请求携带中断信息 signal
          fetch(this.urls[i], { signal: this.signal })
            .then((res) => {
              this.result[i] = res
            })
            .catch(reject)
            .finally(() => {
              this.pool.delete(p)

              if (this.pool.size === 0) {
                return resolve(resArr)
              }
            })
        )

        this.pool.add(p)

        if (this.pool.size >= this.limit) {
          await Promise.race(this.pool)
        }
      }
    })
  }

  abort() {
    this.controller.abort("手动中止并发")
  }
}
```

#### 并发暂停和继续

让并发请求可暂停和继续，通过 `While(paused)` 的无限循环阻塞 for 循环实现暂停。

```js
class ConcurrentPool {
  urls = []
  limit = 0
  result = []
  pool = new Set()
  controller = new AbortController()
  signal = this.controller.signal
  paused = false

  constructor(urls, limit) {
    this.urls = Array.isArray(urls) && urls.length ? urls : []
    this.limit = limit
  }

  execute() {
    return new Promise(async (resolve, reject) => {
      if (!this.urls.length) return []

      for (let i = 0; i < this.urls.length; i++) {
        // 如果并发请求已中断，停止执行，直接 rejected
        if (this.signal.aborted) return reject(this.signal.reason)

        // 实现暂停和继续
        await this.pauseIfNeeded()

        const p = Promise.resolve().then(() =>
          // ajax 请求携带中断信息 signal
          fetch(this.urls[i], { signal: this.signal })
            .then((res) => {
              this.result[i] = res
            })
            .catch(reject)
            .finally(() => {
              this.pool.delete(p)

              if (this.pool.size === 0) {
                return resolve(resArr)
              }
            })
        )

        this.pool.add(p)

        if (this.pool.size >= this.limit) {
          await Promise.race(this.pool)
        }
      }
    })
  }

  abort() {
    this.controller.abort("手动中止并发")
  }

  /**
   * 实现并发的暂停恢复
   */
  async pauseIfNeeded() {
    while (this.paused) {
      // 当暂停状态为 true 时，等待恢复
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  suspend() {
    this.paused = true
  }

  unsuspend() {
    this.paused = false
  }
}
```

#### 增加重试机制

主要思路，增加重试次数的限制 MaxRetryCount，在 catch 中将失败的请求再次推入并发池中重试即可。

### 其它并发实现

视需求场景，可以选择合适方案，具体使用可以查看对应资源。

- p-limit 第三库
- RxJS
- web worker

### 客户端请求层思考问题

这里引申下请求层的概念，在实际项目中，请求层的设计和实现对整个应用的性能和稳定性至关重要。

一个健壮的请求层不仅能够处理基本的数据请求和响应，还能够应对各种复杂的网络环境和业务需求。

以下是请求层可以处理的一些常见问题：

- 分页：在前端进行数据分页，减轻后端压力。
- 超时：为每个请求设置超时时间，防止长时间等待。
- 失败和错误处理：优雅地处理请求失败和服务器返回的错误，提升用户体验。
- 失败重试：在请求失败时自动重试，但限制重试次数，增加请求的成功率。
- 请求中断：允许用户主动中断请求。
- 避免重复请求：重复请求避免发起，可以直接复用已请求的缓存数据
- 接口降级：在服务不可用时，提供备选方案，保证应用的基本功能。
- 模拟接口：在后端服务尚未开发完成时，模拟接口响应、包括分页、排序等基本功能，加速前端开发。
- 接口聚合和竞态：将多个资源的创建和更新等操作聚合成一个请求，简化前端逻辑，也减少网络开销。处理接口请求的竞态问题，确保数据的一致性。
- 并发控制：限制同时进行的请求数量，避免过度消耗资源。
- 缓存控制：对请求结果进行缓存，后续相同请求直接使用缓存数据。但要仔细考虑缓存数据的新鲜度和过期时间后释放的平衡。
- 无感刷新：如果支持 access_token 和 refresh_token，实现凭证无感刷新。

## 服务端并发控制

服务端处理并发需求，除了提高机器性能外，可以增开多进程和多线程来处理并发逻辑。

- 当计算不是瓶颈，在单个进程或线程中，灵活的单线程异步的实现更好；
- 如果作为 Web 服务，提高并发数，选择 Cluster 更好；
- 作为脚本逻辑，希望提高并发，选择 Worker Threads 更好，比如批量文件读写等；

### 应用限流

服务端限流主要是控制API服务的入站流量，在实现上可以：

- 使用第三方依赖包来实现限流，比如 express 应用的 express-rate-limit，nestjs 的 @nestjs/throttler 包
- 在客户端和后端应用服务之间，架构 Nginx 服务。Nginx 提供了两种限流手段，一是控制速率，二是控制并发连接数

### 多进程 cluster

Node.js 使用 Cluster 模块来完成多进程。

### 多线程 worker_threads

## 参考链接

- [异步难题：前端并发控制全解析](https://juejin.cn/post/7345423793210802186)
- [Promise 推荐实践 - 进阶篇：并发控制](https://cloud.tencent.com/developer/article/2332733)
- [前端性能优化之控制并发请求数量的理解](https://juejin.cn/post/7319872428405522451)
- [Node.js 并发能力总结](https://mp.weixin.qq.com/s/6LsPMIHdIOw3KO6F2sgRXg)
- [深入p-limit源码，如何使用p-limit来限制并发数](https://juejin.cn/post/7127831645167550471)
