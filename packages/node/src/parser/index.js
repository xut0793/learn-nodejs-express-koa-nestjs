import { urlToHttpOptions, URL } from "node:url"
import querystring from "node:querystring"
import { pathToRegexp } from "path-to-regexp"

/**
 * 解析请求url，利用 URL 和 Url 和 URLSearchParams 对象
 *
 * @param {request} req
 * @return
 * {
 *     "protocol": "http:",
 *     "hostname": "127.0.0.1",
 *     "hash": "",
 *     "search": "?q=tiel",
 *     "pathname": "/params/12",
 *     "path": "/params/12?q=tiel",
 *     "href": "http://127.0.0.1:9000/params/12?q=tiel",
 *     "port": 9000,
 *     "baseUrl": "http://127.0.0.1:9000",
 *     "method": "GET",
 *     "searchParams": URLSearchParams
 * }
 */
export function urlParser(req, res, next) {
  /**************************************************
   * 一、获取 server 信息
   ************************************************/
  const protocol = req.socket.encrypted ? "https" : "http"
  /**
   * socket.address() 的返回值跟 server.listen() 中传入的实参形式有很大关系，不同的入参，会返回不同的值
   * 对于开启 TCP 服务的调用方式：server.listen([port[, host[, backlog]]][, callback])
   * 如果省略 host，服务器将在 IPv6 可用时接受未指定的 IPv6 地址 (::) 上的连接，此时，address() 方法返回值为：{ port, family: 'IPv6', address: '::1' }
   * 如果省略host,且 IPv6 不可用时，将接受未指定的 IPv4 地址 (0.0.0.0) 上的连接，此时 address() 方法返回值为：{ port, family: 'IPv4', address: '127.0.0.1' }
   * 在大多数操作系统中，监听 未指定的 IPv6 地址 (::) 可能会导致 net.Server 也监听 未指定的 IPv4 地址 (0.0.0.0)。
   */
  // const address = req.socket.address()
  // const port = address.port
  // const hostname = address.address
  // const baseUrl = `${protocol}://${hostname}:${port}`
  const host = req.headers["host"]
  const baseUrl = `${protocol}:${host}`

  /**************************************************
   * 一、获取路径信息, 利用 URL 和 Url 和 URLSearchParams 对象
   ************************************************/
  // url 会返回完整路径信息。比如客户请求 http://localhost:9000/some-path/12?q=abc#hash
  // 则 req.url = /some-path/12?q=abc，所以在 URL 中需要提供一个 baseURl = http://localhost:9000
  const url = new URL(req.url, baseUrl)
  const urlOptions = urlToHttpOptions(url)

  req.protocol = protocol
  req.port = urlOptions.port
  req.pathname = urlOptions.pathname
  req.search = urlOptions.search
  req.originalUrl = urlOptions.href

  if (next) {
    return next()
  }
  return {
    ...urlOptions,
    host,
    method: req.method.toLowerCase(),
  }
}

/**
 * 查询参数解析，依赖内置模块 queryString ，传入 urlParser 解析结果中的 search
 *
 * @param {request} req
 * @param {string} search ?q=title&name=12
 * @returns
 */
export function queryParser(req, res, next) {
  const search = req.search

  if (typeof search !== "string") {
    return next ? next() : {}
  }

  if (search[0] === "?") {
    search = search.slice(1)
  }
  const query = querystring.parse(search) // 空字符串返回 {}
  req.query = query

  if (next) {
    return next()
  }

  return query
}

/**
 * 从请求路径上匹配到动态路由定义的值，使用 path-to-regex 来匹配
 *
 * @param {request} req
 * @param {string} pathname 请求路径，eg: /user/12
 * @param {string} routePath 定义的路由，eg: /user/:id
 * @return {object} 返回对象，eg: {id: 12}
 *
 * path-to-regex 的作用是把字符串路径转为正则表达式
 * eg: pathToRegexp('/foo/:bar') =>  /^\/foo(?:\/([^\/#\?]+?))[\/#\?]?$/i
 * eg: pathToRegexp('/foo/:bar', keys) => /^\/foo(?:\/([^\/#\?]+?))[\/#\?]?$/i，然后 keys = [{ name: 'bar', prefix: '/', suffix: '', pattern: '[^\\/#\\?]+?', modifier: '' }]
 *
 * regexp.exec('/foo/a') 匹配失败返回 null，匹配成功返回数组（数组也是对象，所以可以挂载属性，如input index groups）
 * [ 0: "/foo/a"  1: "a"  groups: undefined  index: 0  input: "/foo/a"]
 *
 */
export function paramsParser(req, pathname, routePath) {
  const keys = []
  const regexp = pathToRegexp(routePath, keys)
  regexp.fast_star = routePath === "*"
  regexp.fast_slash = routePath === "/"

  let result = {}

  if (regexp.fast_star) {
    result = {
      route: routePath,
      regexp,
      params: {
        0: decodeURIComponent(pathname),
      },
    }
  } else if (regexp.fast_slash) {
    result = {
      route: routePath,
      regexp,
      params: {},
    }
  } else {
    const match = regexp.exec(pathname)
    const params = {}

    if (!match) {
      result = {
        route: routePath,
        regexp,
        params: {},
      }
    } else {
      for (let i = 1; i < match.length; i++) {
        const key = keys[i - 1]
        const prop = key.name
        const value = decodeURIComponent(match[i])

        // /params/:id/:id 只取第一个
        if (
          value !== undefined ||
          !Object.prototype.hasOwnProperty.call(params, prop)
        ) {
          params[prop] = value
        }
      }

      result = {
        route: routePath,
        regexp,
        params,
      }
    }
  }

  req.params = result.params
  req.routePath = result.route
  req.routeRegexp = result.regexp

  return result.params
}

/**
 * 服务器设置 cookie 时，通过响应头 Set-Cookie 设置，如果同时设置多个，即响应多个 Set-Cookie 响应头字段
 *
 * Set-Cookie: custom_11=1111; Max-Age=5; Path=/; Expires=Wed, 27 Dec 2023 09:49:58 GMT、
 * Set-Cookie: custom_22=222; Path=/; Expires=Wed, 27 Dec 2023 09:54:53 GMT; HttpOnly
 *
 * 然后客户端发送请求时，请求头格式 name=value，不带其它附加属性。多个 cookie时，以分号分隔。
 * 即使客户通过 document.cookie 本地读取时也是 name=value 格式。
 *
 * Cookie: custom_11=1111; custom_22=222
 *
 * @param {request} req
 */
export function cookieParser(req, res, next) {
  let cookieStr = req.headers.cookie
  let cookies = {}

  // 方法一：两次 split
  // let cookieArr = req.headers.cookie ? req.headers.cookie.split(";") : [];

  // req.cookie = cookieArr.reduce((ret, cur) => {
  //   let [k, v] = cur.split("=");
  //   k = k.trim();
  //   v = v.trim();

  //   if (v) {
  //     v = decodeURIComponent(v);
  //   } else {
  //     v = undefined;
  //   }

  //   ret[k] = v;

  //   return ret;
  // }, {});

  // 方法二：正则匹配
  // 示例
  // if (cookieStr) {
  //   const regex = /\s*(?<name>[^=]+)\s*=\s*(?<value>[^;]+);?\s*/g
  //   const match = cookieStr.matchAll(regex)
  //   const result = Array.from(match).reduce((ret, cur) => {
  //     ret[cur.groups.name] = decodeURIComponent(cur.groups.value)
  //     return ret
  //   }, {})
  //   return result
  // } else {
  //   return {}
  // }
  // console.log([...result]);
  // 输出
  // [
  //   [
  //     'custom_11=1111; ',
  //     'custom_11',
  //     '1111',
  //     index: 0,
  //     input: 'custom_11=1111; custom_22=222',
  //     groups: {name: 'custom_11', value: '1111'}
  //   ],
  //   [
  //     'custom_22=222',
  //     'custom_22',
  //     '222',
  //     index: 16,
  //     input: 'custom_11=1111; custom_22=222',
  //     groups: {name: 'custom_22', value: '222'}
  //   ]
  // ]
  // 正则解析
  // 1. 命名捕获分组的语法是 (?<name>...)
  // 2. [^=] 不包含 = 的所有字符，[^;] 不包含分号 ; 的所有字符
  // 3. \s* 零个或多个空白字符
  // 4. ;? 零或一个分号
  // 5. g 全局匹配

  // 方法三：queryString
  // querySTring.parser(cookieStr, ";")

  if (cookieStr) {
    // 要处理下分号后紧跟的空格 userId=123; token=abc
    cookieStr = cookieStr.replace(/;\s*/, ";")
    cookies = querystring.parse(cookieStr, ";")
  }

  req.cookies = cookies

  if (next) {
    return next()
  }

  return cookies
}
