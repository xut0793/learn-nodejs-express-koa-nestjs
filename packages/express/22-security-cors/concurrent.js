/*
 * @Date         : 2024-04-15 07:14:20 星期1
 * @Author       : xut
 * @Description  : 并发控制
 */

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

/**
 * 测试代码
 */
const urls = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// concurrentReqByFor(urls)
//   .then((ret) => {
//     console.log("🚀 ~ concurrentReqByFor ~ ret:", ret)
//   })
//   .catch((err) => console.error(err))

// concurrentReqByPromiseAll(urls)
//   .then((ret) => {
//     console.log("🚀 ~ concurrentReqByPromiseAll ~ ret:", ret)
//   })
//   .catch((err) => console.error(err))

// concurrentReqByPromiseAllsettled(urls)
//   .then((ret) => {
//     console.log("🚀 ~ concurrentReqByPromiseAllsettled ~ ret:", ret)
//   })
//   .catch((err) => console.error(err))

// concurrentReqByBatch(urls, 5)
//   .then((ret) => {
//     console.log("🚀 ~ concurrentReqByBatch ~ ret:", ret)
//   })
//   .catch((err) => console.error(err))

// concurrentReqByIterator(urls, 3)
//   .then((ret) => {
//     console.log("🚀 ~ concurrentReqByIterator ~ ret:", ret)
//   })
//   .catch((err) => console.error(err))

// concurrentReqByPromiseRace(urls, 3)
//   .then((ret) => {
//     console.log("🚀 ~ concurrentReqByPromiseRace ~ ret:", ret)
//   })
//   .catch((err) => console.error(err))

concurrentReqByPromiseRaceAndAsync(urls, 3)
  .then((ret) => {
    console.log("🚀 ~ concurrentReqByPromiseRaceAndAsync ~ ret:", ret)
  })
  .catch((err) => console.error(err))
/**************************************************************************
 * 全部并发：适用于可以批量请求，但并发量不大的场景，简单易懂，但可能不是最高效的方法。
 ************************************************************************/

/**
 * 使用 for 循环并发请求
 * @param {array} urls
 * @returns
 */
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

/**************************************************************************
 * 分批并发：在保持一定并发度的同时，避免同时发出过多的请求，适用于并发量大，需要控制资源消耗的场景。
 ************************************************************************/
/**
 * 分批发送的办法，将请求按 limit 数量分成 N 组，每组并行发送，在实现上结合**递归**和 Promise。
 * 按需求可以选择 `Promise.all` 或 `Promise.allsettled`，这里以 all 举例。
 *
 * @param {array} urls 请求路径列表
 * @param {number} limit 并发限制数量
 */
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

/**************************************************************************
 * 限制并发：持续维护限制数量下的请求，并且由最早 fulfilled 的请求开启下一个请求。
 ************************************************************************/
/**
 * 首次进行 limit 限制数量的并发，然后在每个请求的 finally 中追加请求，来保证持续限制在 <= limit 数量下的请求。
 *
 * @param {array} urls 请求路径数组
 * @param {number} limit 限制的并发数量
 */
function concurrentReqByIterator(urls, limit) {
  return new Promise((resolve, reject) => {
    if (!(Array.isArray(urls) && urls.length)) return resolve([])

    const resArr = []
    const len = urls.length
    let i = 0 // 保证 urls 顺序取出 url
    let count = 0 // 已完成数量
    let executing = 0 // 当前正在请求数，debug 时便于观察的变量，实际可无用

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
      executing++
      request(url)
        .then((res) => {
          resArr[cur] = res
        })
        .catch(reject)
        .finally(() => {
          // 当前正在请求数减一
          executing--

          // 完成数加一
          count++
          console.log(
            "🚀 ~ .finally ~ cur: %s, i: %s, executing: %s, count: %s:",
            cur,
            i,
            executing,
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

/**
 * 要拿到并发的 Promise 中最早改变状态的请求，很自然会想到使用 `Promise.race`。
 *
 * @param {array} urls 请求路径数组
 * @param {number} limit 限制的并发数量
 */
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
        request(url)
          .then((res) => {
            // 利用闭包，缓存对象
            resArr[i] = res // 并包缓存变量i，保证返回结果数组对应 Urls 顺序
          })
          .catch(reject)
          .finally(() => {
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
          request(urls[i])
            .then((res) => {
              resArr[i] = res
            })
            .finally(() => {
              pool.delete(p)
            })
        )
        pool.add(p)
      }

      Promise.race(pool).then(execute).catch(reject)
    }
  })
}

/**
 * Promise.race 配合 async / await 极简实现
 * 利用 await 阻塞 for 循环。
 *
 * @param {array} urls 请求 url 数组
 * @param {number} limit 并发数
 */
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

/**
 * 并发可中断、暂停、恢复
 */
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
