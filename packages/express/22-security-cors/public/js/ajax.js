/*
 * @Date         : 2024-04-12 10:28:50 星期5
 * @Author       : xut
 * @Description  :
 */
const URL = "http://localhost:9002"
const xhrRequest = (url, options = { method: "GET" }) => {
  const xhr = new XMLHttpRequest()
  xhr.open(options.method, url)

  xhr.withCredentials = !!options.withCredentials

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })
  }

  xhr.onload = function () {
    console.log(
      "🚀 ~ xhrRequest ~ status: %s; statusText: %s",
      xhr.status,
      xhr.statusText
    )

    if (xhr.status == 200) {
      // 获取响应头
      console.log("getAllResponseHeaders >>>", xhr.getAllResponseHeaders())
      // 获取响应内容
      console.log("response >>>", xhr.response)
    }
  }

  xhr.send(options.body)
}

function bindClickListener(dom, handler) {
  dom.addEventListener("click", handler)
}

/*****************************************************
 * 情景一：前端什么都不做，服务端也什么都不做，浏览器报错 CORS
 ****************************************************/
const sendXhrNothing = document.querySelector("#send-xhr-nothing")
const sendFetchNothing = document.querySelector("#send-fetch-nothing")

const urlNothing = URL + "/nothing"
bindClickListener(sendXhrNothing, () => xhrRequest(urlNothing))
bindClickListener(sendFetchNothing, () => fetch(urlNothing))

/*****************************************************
 * 情景二：简单请求，基本只能利用 form 表单行为发起，如何用 xhr 或 fetch 自己构造请求，也会报 CORS
 ****************************************************/
const sendXhrSimple = document.querySelector("#send-xhr-simple")
const sendFetchSimple = document.querySelector("#send-fetch-simple")

const urlSimple = URL + "/simple"
bindClickListener(sendXhrSimple, () =>
  // xhrRequest(urlSimple, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //   body: "a=1&b=2",
  // })

  {
    /**
     * 阻止 form 表单提交后跳转行为：
     * 1. form.onsubmit = (evt) => {evt.evt.preventDefault(), // 然后自己构造请求}
     * 2. form.onsubmit = (evt) => {// 然后自己构造请求后，return false}
     * 2. 在form表单下定义一个ifame，将 form 的 target 属性指向 iframe 的 name 属性，这样就实现了不刷新页面的form提交。
     */
    const iframe = document.createElement("iframe")
    iframe.style.opacity = 0
    iframe.name = "iframe-test"
    const form = document.createElement("form")
    form.action = urlSimple
    form.method = "get"
    form.style.opacity = 0
    form.target = "iframe-test"
    const btn = document.createElement("button")
    btn.type = "submit"
    form.appendChild(btn)
    document.body.appendChild(form)
    document.body.appendChild(iframe)
    btn.click()
  }
)

bindClickListener(sendFetchSimple, () => fetch(urlSimple))

/*****************************************************
 * 情景三：设置 CORS: Access-Control-Allow-Origin="*"
 *
 * 跨域访问时，默认只能拿到一些最基本的响应头，Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma
 * 如果要获取其他头，则需要服务器设置本响应头 Access-Control-Expose-Headers: <header-name>[, <header-name>]，来指定可以暴露的响应头字段
 ****************************************************/
const sendXhrAllow = document.querySelector("#send-xhr-allow")
const sendFetchAllow = document.querySelector("#send-fetch-allow")

const urlAllow = URL + "/allow"
bindClickListener(sendXhrAllow, () => xhrRequest(urlAllow))

bindClickListener(sendFetchAllow, async () => {
  const res = await fetch(urlAllow)

  const headers = res.headers

  headers.forEach((val, key) => {
    console.log("🚀 ~ fetch headers: %s=%s", key, val)
  })
})

/*****************************************************
 * 情景四：触发预检请求 preflight option
 *
 * 对那些可能对服务器数据产生副作用的 HTTP 请求方法，浏览器会自动使用 OPTIONS 方法发起一个预检请求（preflight request），
 * 将可能会产生副作用的请求方式或头信息通过options请求携带过去，从而获知服务端是否允许这样跨域请求。
 * 服务器确认允许之后，才发起实际的 HTTP 请求。
 *
 * 好比说，客户端先跟服务器端提前打个招呼：嗨，哥们，我想这样操作，你看下行不行，等你回复我再做。
 * 如果预检查通过，后续的跨域请求基本就不会产生 CORS 报错了。
 *
 * 优化 options：
 * Access-Control-Max-Age: <delta-seconds> 单位 秒。 这个响应首部表示 preflight request  （预检请求）的返回结果（即 Access-Control-Allow-Methods 和Access-Control-Allow-Headers 提供的信息） 可以被缓存多久。
 * 在Firefox中，可设置的最大值是24小时 （即86400秒），而在Chromium 中最大值10分钟（即600秒），同时Chromium 同时规定了一个 5 秒的默认值。
 * 如果值为 -1，则表示禁用缓存，每一次请求都需要提供预检请求。
 * 需要注意的是 Access-Control-Max-Age 的设置针对完全一样的url，如果url加上路径参数或查询参数，其中一个url的Access-Control-Max-Age设置对另一个url没有效果！！！
 ****************************************************/
const sendXhrPreflight = document.querySelector("#send-xhr-preflight")
const sendFetchPreflight = document.querySelector("#send-fetch-preflight")

const urlPreflight = URL + "/preflight"
bindClickListener(sendXhrPreflight, () =>
  xhrRequest(urlPreflight, {
    method: "POST",
    // post x-www.form-urlencoded 并不会触发预检请求
    // headers: { "Content-Type": "application/x-www-form-urlencoded" },
    // body: "a=1&b=2",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ a: 1, b: 2 }),
  })
)
bindClickListener(sendFetchPreflight, () =>
  fetch(urlPreflight, {
    method: "POST",
    // post x-www.form-urlencoded 并不会触发预检请求
    // headers: { "Content-Type": "application/x-www-form-urlencoded" },
    // body: "a=1&b=2",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ a: 1, b: 2 }),
  })
)

/*****************************************************
 * 情景五：携带认证凭证的跨域请求 credentials
 ****************************************************/
const cookieBtn = document.querySelector("#cookie")
const sendXhrCredentials = document.querySelector("#send-xhr-withCredentials")
const sendFetchCredentials = document.querySelector("#send-fetch-credentials")

bindClickListener(cookieBtn, () => {
  fetch("/cookie")
})

const urlCredentials = URL + "/credentials"

/**
 * withCredentials 属性是一个布尔值，默认值 false, 表示跨站点访问时是否带上 Cookie 凭证。
 * 设置 withCredentials 只针对跨域请求，对同源请求是无效的，永远不会影响到同源请求。
 */
bindClickListener(sendXhrCredentials, () =>
  xhrRequest(urlCredentials, {
    method: "POST",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  })
)

/**
 * credentials: omit same-origin(默认值) include
 * omit: 从不发送 cookies.
 * same-origin: 只有当 URL 与响应脚本同源才发送 cookies、HTTP Basic authentication 等验证信息.(浏览器默认值，在旧版本浏览器，例如 safari 11 依旧是 omit，safari 12 已更改)
 * include: 不论是不是跨域的请求，总是发送请求资源域在本地的 cookies、HTTP Basic authentication 等验证信息
 */
bindClickListener(sendFetchCredentials, () =>
  fetch(urlCredentials, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
)

/*****************************************************
 * 情景六：JSONP
 * 原理：利用了 script 标签的src没有跨域限制来完成的。实现上利用动态生成 script 元素发起跨域请求
 * 参考：https://www.jianshu.com/p/88bb82718517
 ****************************************************/
window.jsonpCallback = function (res) {
  console.log("jsonpCallback response data >>>", res)
}
const jsonpBtn = document.querySelector("#jsonp")
bindClickListener(jsonpBtn, () => {
  // 构造 url
  const url = `${URL + "/jsonp"}?id=1&cb=jsonpCallback` // cb 应该是当前脚本中可获取到的处理函数的函数名
  // 创建 script 标签
  const script = document.createElement("script")
  script.setAttribute("src", url)
  document.body.appendChild(script)
})
