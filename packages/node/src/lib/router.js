/*
 * @Date         : 2022-09-17 18:07:36 星期6
 * @Author       : xut
 * @Description  : 在 node 中实现路由器 router 基本功能。
 * 路由处理
 */
import { STATUS_CODES } from "node:http"
import { urlToHttpOptions } from "node:url"
import { pathToRegexp } from "path-to-regexp"

const METHODS = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]

export function createRouter() {
  // 通过闭包，来实现存储路由映射的规则
  const normalRoutes = []
  const exceptionRoutes = []
  /**
   * 1. 从 req 对象中取得 method、pathname
   * 2. 依据 method、pathname 将请求与routes数组内各个 route 按它们被添加的顺序依次匹配
   * 3. 如果与某个route匹配成功，执行 route.handler，执行完后与下一个 route 匹配或结束流程 （后面详述）
   * 4. 执行完其 handler 之后，是否继续下一个 route 匹配，还是结束流程，由开发者在其 handler 内有没有主动调用 next() 交出控制权。
   */
  async function router(req, res) {
    const protocol = req.socket.encrypted ? "https" : "http"
    const host = req.headers["host"]
    const baseUrl = `${protocol}:${host}`
    const url = new URL(req.url, baseUrl)
    const urlOptions = urlToHttpOptions(url)
    const pathname = urlOptions.pathname
    const method = req.method.toLowerCase()

    let normalIdx = -1
    let exceptionIdx = -1

    const next = async (err) => {
      if (err) {
        const route = exceptionRoutes[++exceptionIdx]

        if (!route) {
          res.writeHead(err.statusCode || 500, { "Content-Type": "text/plain" })
          res.end(err.message || STATUS_CODES[500])
          return
        }

        try {
          await route.handler(err, req, res, next)
        } catch (error) {
          next(error)
        }
      } else {
        const route = normalRoutes[++normalIdx]

        if (!route) {
          const err = new Error(STATUS_CODES[404])
          err.statusCode = 404
          await next(err)
          return
        }

        try {
          // 对应 router.use(fn) 注册的回调，没有 method 和 path
          if (!route.method && !route.path) {
            await route.handler(req, res, next)
          } else {
            /**
             * TODO: 这里可优化
             * 比如 router.get('/path/:id', cb1, cb2, cb3)
             * 那在处理 cb1, cb2, cb3 的时候，不需要每个再重新执行一次路由匹配和params 参数附加了，这部分逻辑应该只执行一次。
             * 所以就是为什么 express.Router 中划分为 router 和 layer ，其中有各自的 next 实现。
             */
            const matched = route.regexp.exec(pathname)

            if (route.method === method && matched) {
              // 将 params 附加到 req 上
              const params = {}

              for (let i = 1; i < matched.length; i++) {
                const key = route.keys[i - 1]
                const prop = key.name
                const value = decodeURIComponent(matched[i])

                // /params/:id/:id 只取第一个
                if (
                  value !== undefined ||
                  !Object.prototype.hasOwnProperty.call(params, prop)
                ) {
                  params[prop] = value
                }
              }

              req.params = params
              await route.handler(req, res, next)
            } else {
              await next()
            }
          }
        } catch (error) {
          next(error)
        }
      }
    }

    await next()
  }

  // JS 函数是一种特殊的对象，能被调用的同时，还可以拥有属性、方法。
  // 默认 use 只注册无路径前缀的中间件和错误中间件
  router.use = (fn) => {
    if (fn.length >= 4) {
      exceptionRoutes.push({
        method: null,
        path: null,
        pattern: null,
        handler: fn,
      })
    } else {
      normalRoutes.push({
        method: null,
        path: null,
        pattern: null,
        handler: fn,
      })
    }
  }

  METHODS.forEach((item) => {
    const method = item.toLowerCase()

    router[method] = (path, ...fns) => {
      const keys = [] // 路由上定义的动态路由参数的 key
      const regexp = pathToRegexp(path, keys)

      // 默认 METHOD 上只注册正常中间件，不能注册错误中间什
      for (const fn of fns) {
        normalRoutes.push({
          method,
          path,
          keys,
          regexp,
          handler: fn,
        })
      }
    }
  })

  return router
}
