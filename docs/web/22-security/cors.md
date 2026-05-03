# CORS

Cross Origin Resource Sharing (CORS) 跨域资源共享。

它允许浏览器在脚本中通过 AJAX (XMLHttpRequest / Fetch)向跨源服务器发出请求，从而克服浏览器同源策略的限制。

- 浏览器同源策略
- ”简单“请求 simple request 和非”简单“请求 not-so-simple request
- option 预检请求 preflight
- 跨域情况下携带认证凭证
- JSONP
- Nginx

相关代码见 [express/22-security-cors]

## 同源策略

同源策略规定：**不同域的客户端脚本在没有明确授权的情况下，不能读写对方的资源。**

如果 Web 世界里没有同源策略，当你登录 Gmail 邮箱，并打开另一个网页站点，这个站点上的 javascript 脚本可以跨域读取你的 Gmail 邮箱数据，这样整个 Web 世界就再无隐私可言了。少了同源策略，就相当于没有楚河汉界，整个 web 世界就大乱了。

理解同源策略有以下几个关键点：

### 何为同源

同源指的是协议、域名、端口都相同。

```
http://www.foo.com 与 https://www.foo.com      不同源，因为 http 和 https 协议不同
http://www.foo.com 与 http://www.bar.com       不同源，因为域名不同
http://www.foo.com 与 http://foo.com           不同源，因为子域不同
http://www.foo.com 与 http://www.foo.com:8080  不同源，因为端口号不同，默认 80 端口与 8080 端口不同
http://www.foo.com 与 http://www.foo.com/path  同源，满足协议、域名、端口相同定义
```

### 客户端脚本

同源策略限制的是在浏览器层面中，通过 Ajax (XMLHttpRequest / Fetch) 发起跨域资源访问的请求。

在浏览器，通过 HTML 元素，嵌入跨域资源通常是允许的。比如以下常见情形：

- 通过 HTML 元素 `<img src='http://bar.com/static/imgs/test.jpg' />` 或者脚本中 `new Image().src='http://bar.com/static/imgs/test.jpg'` 嵌入图片并不会阻止。
- 使用 `<script src="…"></script>` 标签嵌入的 JavaScript 脚本，比如 CDN 脚本资源。
- 使用 `<link rel="stylesheet" href="…">` 标签嵌入的 CSS。CSS 的跨源需要一个设置正确的 Content-Type 标头。如果样式表是跨源的，且 MIME 类型不正确，或者资源不以有效的 CSS 结构开始，浏览器会阻止它的加载。
- 通过 `<video>` 和 `<audio>` 播放的多媒体资源。
- 通过 `<object>` 和 `<embed>` 嵌入的插件。
- 通过 `@font-face` 引入的字体。一些浏览器允许跨源字体（cross-origin fonts），另一些需要同源字体（same-origin fonts）。
- 通过 `<iframe>` 载入的任何资源。当然目标站点也可以使用 X-Frame-Options 标头来阻止被以 iframe 形式嵌入。

### 资源

资源是一个很广泛的概念，只要是数据，都可以认为是资源。一般情况下，说到资源，往往会想到的是服务端对应的数据。

但是同源策略限制的资源指的是客户端资源（浏览器资源），包括通过 HTTP 请求服务端资源，然后服务端进行了响应给到客户端，此时的数据也可以认为是客户端资源了。这些资源包括 HTTP 消息头，HTTP 响应体，DOM 数据，浏览器本地 Cookie 或者 LocalStorage 存储的数据等。

那浏览器对这些客户端资源开不开放给当前站点的 web 页面显示或脚本操作，就需要进行 CORS 机制授权了。

### 授权

同源策略限制了两个不同域之间的资源访问，但并没有完全限制死，因为同时也开放了 CORS 机制，允许 Web 通过 Ajax 进行跨域的请求。相当于同源策略为 web 世界关起了门，但同时 CORS 机制为 web 世界开了一扇窗。

当使用 Ajax 发起跨域请求时，因为同源策略的影响，默认是不允许的，浏览器端会报 CORS 错误。但如果目标服务站点明确授权，返回相关的 CORS 响应头，比如 Access-Control-Allow-Origin 等，那么经过浏览器验证后，也会放行。

一般情况下，看到这个词，往往会想到服务端对来自客户端的请求访问进行授权的认证。但是同源策略的语镜下，客户端比如浏览器，也存在对跨域数据进行权限认证的场景，只有服务端明确了该部分数据的授权后，浏览器才会放行页面进行显示或脚本进行读取。这部分的授权机制就是 CORS 机制。

### 读写操作

通常要发起跨域资源请求的目的，无非就是需要对跨域站点上的数据进行读和写操作。

- 跨域的读操作
  - 通过 HTML 元素来嵌入跨域资源是被允许的。比如上方阐述客户端脚本的内容中常见的可嵌入跨域资源的 HTML 元素来获取跨域数据。
  - 在脚本中通过 Ajax 发起跨域资源的读操作，比如 GET 请求读取跨域数据。
- 跨域的写操作
  - 通过 HTML Form 表单元素发起 POST 请求，通常也是被允许，同样不会触发 CORS 规则。
  - 在脚本中通过 Ajax 发起跨域资源的写操作，比如 POST 请求。

所以同源策略限制的是客户端脚本中通过 Ajax 发起的跨域请求，但为了区分 HTML 表单发起的 HTTP 请求，分为两种：

- ”简单“请求 simple request，不受同源策略影响，也就不会触发 CORS 机制的验证，通常为 Form 表单发起的 GET / POST 请求。
- 非”简单“请求 not-so-simple request，受同源策略影响，浏览器会执行 CORS 机制的验证。

### 简单请求

[MDN CORS 简单请求](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS#%E7%AE%80%E5%8D%95%E8%AF%B7%E6%B1%82)

> 出现简单请求与非简单请求的区分主要在于历史包袱，为了向下兼容。因为在出现跨站的 XMLHttpRequest 和 Fetch 之前，HTML 4.0 中的 Form 元素表单就允许向任何源提交请求。

Ajax 请求同时满足所有下述条件，则该请求可视为简单请求，不受同源策略影响，也就不会触发 CORS 机制的验证。

- 请求方式为 GET / POST / HEAD 之一
- 请求头字段除了浏览器自动设置的部分字段外，允许人为设置的请求头字段仅为 Accept / Accept-Language / Content-Language / Range / Content-Type，其中 Content-Type 的值仅限于以下值。
- Content-Type 请求头的值仅限于以下三者之一：text/plain、 multipart/form-data、 application/x-www-form-urlencoded
- 请求体中没有使用 ReadableStream 对象
- 如果请求使用的是 XMLHttpRequest 对象实例，必须没有调用 `xhr.upload.addEventListener()` 监控请求上传事件。

> 可以从 HTTP 请求的三段式结构来理解简单请求，request method / header / body

```html
<form action="http://localhost:9002/allow" target="iframe-test">
  <button type="submit">请求</button>
</form>

<iframe name="iframe-test" style="opacity: 0"></iframe>
```

> 阻止 form 表单提交后刷新页面的行为。在form表单下定义一个ifame，将 form 的 target 属性指向 iframe 的 name 属性，这样就实现了不刷新页面的form提交。

或者使用脚本动态构造 script 元素。

```js
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
```

服务端代码，此时并不会产生跨域报错。

```js
app.get("/simple", (req, res) => {
  console.log("🚀 ~ app.get", req.url)
  res.send("simple ok")
})
```

### 非简单请求

除以上条件之外的请求，都被视为非简单请求，请求会受到同源策略限制，浏览器会执行 CORS 机制的验证。

根据跨域请求的目的，这些非简单请求同样分为：

- 跨域的读操作，通常只为获取服务器响应的数据。
  - 具体过程表现为：当一个请求在浏览器端发送出去后，服务端是会收到，并且也会进行处理和响应。只不过此时浏览器在解析这个请求的响应之后，发现请求属于跨域访问，打破了浏览器的同源策略，那么就会触发浏览的 CORS 机制验证，直接检查响应中也没有包含正确的 CORS 响应头，如果验证失败，返回结果将被浏览器拦截，脚本无法获取到响应数据，控制台也会报 CORS 错误。
- 跨域的写操作，但写操作通常会对服务器数据产生副作用。
  - CORS 标准规范中也规定：对那些可能对服务器数据产生副作用的 HTTP 请求方法，浏览器必须首先使用 OPTIONS 方法发起一个预检请求（preflight request），将可能会产生副作用的请求方式或头信息通过options请求携带过去，从而获知服务端是否允许这样跨域请求。服务器确认允许之后，才发起实际的 HTTP 请求。好比说，客户端先跟服务器端提前打个招呼：嗨，哥们，我想这样操作，你看下行不行，等你回复我再做。

客户端代码

```js
// xhr
sendBtn.addEventListener("click", () => {
  const xhr = new XMLHttpRequest()
  xhr.open("GET", "http://localhost:9002/allow")

  xhr.onload = function () {
    console.log(
      "🚀 ~ xhrRequest ~ status: %s; statusText: %s",
      xhr.status,
      xhr.statusText,
    )

    if (xhr.status == 200) {
      // 获取响应头
      console.log("getAllResponseHeaders >>>", xhr.getAllResponseHeaders())
      // 获取响应内容
      console.log("response >>>", xhr.response)
    }
  }

  xhr.send()
})

// fetch
sendBtn.addEventListener("click", async () => {
  const res = await fetch("http://localhost:9002/allow")

  const headers = res.headers

  headers.forEach((val, key) => {
    console.log("🚀 ~ fetch headers: %s=%s", key, val)
  })
})
```

服务端代码

```js
app.get("/allow", (req, res) => {
  console.log("🚀 ~ app.get", req.url)

  /**
   * Access-Control-Allow-Origin 的值只能是 * <origin> null
   *
   * 对于不包含凭据的请求，服务器会以“*”作为通配符，从而允许任意来源的请求代码都具有访问资源的权限。尝试使用通配符来响应包含凭据的请求会导致错误。
   * <origin> 指定一个来源,只能指定一个。如果服务器支持多个来源的客户端，其必须以与指定客户端匹配的来源来响应请求。
   * null 不应该被使用。
   *
   */
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.send("allow ok")
})
```

这里有一点，在跨域访问时，XMLHttpRequest 对象的 getResponseHeader() 方法，或者 fetch 中读取 res.headers 只能拿到一些最基本的响应头，如 Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma，如果要访问其他头，则需要服务器设置 Access-Control-Expose-Headers 指定可以暴露的响应头字段。

```js
app.get("/allow", (req, res) => {
  console.log("🚀 ~ app.get", req.url)
  res.setHeader("Access-Control-Allow-Origin", "*")

  res.setHeader(
    "Access-Control-Expose-Headers",
    "Access-Control-Allow-Origin, X-My-Custom-Header",
  )
  res.setHeader("X-My-Custom-Header", "abc")

  res.send("allow ok")
})
```

### 预检请求

CORS标准规范中也规定：对那些可能对服务器数据产生副作用的 HTTP 请求方法，浏览器必须首先使用 OPTIONS 方法发起一个预检请求（preflight request），将可能会产生副作用的请求方式或头信息通过options请求携带过去，从而获知服务端是否允许这样跨域请求。服务器确认允许之后，才发起实际的 HTTP 请求。

好比说，客户端先跟服务器端提前打个招呼，嗨，哥们，我想这样操作，你看下行不行，等你回复我再做。

预检请求通常是浏览器的自主行为，前端开发者不需要自己去发起这样的请求。但是当有跨域请求的场景时，服务端代码逻辑必须要能响应 option 请求，并设置相关 CORS 响应头字段。

客户端代码

这里有个点，如果是 POST + form 表单相关请求头（x-www-form-urlencoded / multiple/form-data）并不会触发 options 预检请求。

```js
// xhr
sendBtn.addEventListener("click", () => {
  const xhr = new XMLHttpRequest()
  xhr.open("POST", "http://localhost:9002/preflight")

  // post x-www.form-urlencoded 并不会触发预检请求，所以这里设置为 json
  // xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = function () {
    console.log(
      "🚀 ~ xhrRequest ~ status: %s; statusText: %s",
      xhr.status,
      xhr.statusText,
    )

    if (xhr.status == 200) {
      // 获取响应内容
      console.log("response >>>", xhr.response)
    }
  }

  xhr.send(JSON.stringify({ a: 1, b: 2 }))
})

// fetch
sendBtn.addEventListener("click", () => {
  fetch("http://localhost:9002/preflight", {
    method: "POST",
    // post x-www.form-urlencoded 并不会触发预检请求
    // headers: { "Content-Type": "application/x-www-form-urlencoded" },
    // body: "a=1&b=2",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ a: 1, b: 2 }),
  })
})
```

此时客户端预请求 options 的结构为

```
OPTIONS /preflight HTTP/1.1
Host: localhost:9002
Access-Control-Request-Headers: content-type
Access-Control-Request-Method: POST
Origin: http://localhost:9001
Referer: http://localhost:9001/
```

可以看到携带了特定的两个请求头 Access-Control-Request-Headers 和 Access-Control-Request-Method。

对应的，服务端响应时需要使用 Access-Control-Allow-Headers 和 Access-Control-Allow-Methods 进行回应。

```js
app.options("/preflight", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization") // 可以字符串，也可以是字符串数组
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS, POST, PUT, PATCH, DELETE",
  )

  /**
   * 多个值表示为字符串，和字符串数组的区别在于：
   * 响应给浏览器端时，如果是字符串，则仅为一个响应头字段。如果是字符中数组，则响应传输过程中会转为单个显示。
   * - 多个字段值组成一个字符串时，浏览器显示作为单个 Access-Control-Allow-Headers:"Content-Type, Authorization"
   * - 如果是字符串数组形式，浏览器会拆为单个值显示。
   *
   * Access-Control-Allow-Headers：["Content-Type", "Authorization"]
   * 显示为为
   * Access-Control-Allow-Headers： Content-Type
   * Access-Control-Allow-Headers： Authorization
   */
  // res.setHeader("Access-Control-Allow-Headers", [
  //   "Content-Type",
  //   "Authorization",
  // ]) // 可以字符串
  // res.setHeader("Access-Control-Allow-Methods", [
  //   "POST",
  //   "PUT",
  //   "PATCH",
  //   "DELETE",
  // ]) // 也可以是字符串数组
  res.setHeader("Access-Control-Max-Age", 600) // 10分钟
  res.status(204).end()
})

app.post("/preflight", (req, res) => {
  console.log("🚀 ~ app.post", req.url)
  console.log("🚀 ~ app.post body", req.body)
  // 如果不加该请求头，即使 options 请求成功，该请求的也会报 CORS 错误
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.send(req.body)
})
```

优化 options 请求，设置 `Access-Control-Max-Age: <delta-seconds>` 单位 秒。 这个响应首部表示 preflight request （预检请求）的返回结果（即 Access-Control-Allow-Methods 和Access-Control-Allow-Headers 提供的信息） 可以被缓存多久。

在Firefox中，可设置的最大上限值是24小时 （即86400秒），而在Chromium 中最大值10分钟（即600秒），同时Chromium 同时规定了一个 5 秒的默认值。如果值为 -1，则表示禁用缓存，每一次请求都需要提供预检请求。

需要注意的是 Access-Control-Max-Age 的设置针对的是完全一样的url，如果url加上路径参数或查询参数，其中一个url的Access-Control-Max-Age设置对另一个url没有效果。

### 跨域请求的认证

如果请求认证是 Cookie 机制的话，对于跨域的 XMLHttpRequest 或 Fetch 请求，浏览器发起请求时不会主动带上当前域中的 Cookie 信息。

比如在 www.foo.com 站点的页面脚本中发起跨域请求 www.bar.com，默认是请求不会带上 www.foo.com 域或者foo.com域下的 Cookie。如果要在跨域请求中发送 Cookie 信息，就要做些设置：

- fetch 请求设置 credentials: "include"
- XMLHttpRequest 请求设置 withCredentials:true

同时，服务器也需要在响应中设置 `Access-Control-Allow-Credentials: true` 进行回应。如果服务器不设置该响应头，浏览器控制台仍会报 CORS 错误，并且指明原因是响应头 Access-Control-Allow-Credentials 未正确设置值。

```
Access to fetch at 'http://localhost:9002' from origin 'http://localhost:9001' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The value of the 'Access-Control-Allow-Credentials' header in the response is '' which must be 'true' when the request's credentials mode is 'include'
```

还有一点需要注意，如果我们在 fetch 请求中设置了 `credentials: "include"` 或者 XHR 请求中设置了 `withCredentials:true`，那么服务端在设置以下 CORS 响应头时就不能为星号，必须设置为明确的值。

- 服务器不能将 Access-Control-Allow-Origin 的值设为通配符“\*”，而应将其设置为特定的域，如：`Access-Control-Allow-Origin: https://example.com`。只能设置单个地址。
- 服务器不能将 Access-Control-Allow-Headers 的值设为通配符“\*”，而应将其设置为标头名称的列表，如：`Access-Control-Allow-Headers: X-PINGOTHER, Content-Type`
- 服务器不能将 Access-Control-Allow-Methods 的值设为通配符“\*”，而应将其设置为特定请求方法名称的列表，如：`Access-Control-Allow-Methods: POST, GET`

> TODO：在 MDN CORS 页面中上有这句话 “Cookie 策略受 SameSite 属性控制。”，但是实践下来似乎没有用。被设置为 sameSite:strict 的cookie 仍会被跨域请求携带上。

客户端代码

xhr 请求

```js
sendBtn.addEventListener("click", () => {
  const xhr = new XMLHttpRequest()
  xhr.open("POST", "http://localhost:9002/credentials")

  xhr.withCredentials = true
  xhr.setRequestHeader("Content-Type", "application/json")

  xhr.onload = function () {
    console.log(
      "🚀 ~ xhrRequest ~ status: %s; statusText: %s",
      xhr.status,
      xhr.statusText,
    )

    if (xhr.status == 200) {
      // 获取响应内容
      console.log("response >>>", xhr.response)
    }
  }

  xhr.send(options.body)
})
```

fetch 请求

```js
/**
 * credentials: omit same-origin(默认值) include
 * omit: 从不发送 cookies.
 * same-origin: 只有当 URL 与响应脚本同源才发送 cookies、HTTP Basic authentication 等验证信息.(浏览器默认值，在旧版本浏览器，例如 safari 11 依旧是 omit，safari 12 已更改)
 * include: 不论是不是跨域的请求，总是发送请求资源域在本地的 cookies、HTTP Basic authentication 等验证信息
 */
sendBtn.addEventListener("click", () => {
  fetch("http://localhost:9002/credentials", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
})
```

服务端代码

```js
app.post("/credentials", cookieParser(), (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:9001")
  res.setHeader("Access-Control-Allow-Credentials", true)
  res.send(req.cookies)
})
```

如果发会起预检请求，则在 options 响应中也同样需要设置对应的响应头 Access-Control-Allow-Credentials。

> 浏览器 options 请求不会携带 cookie 凭证。

```js
app.options("/credentials", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:9001")
  res.setHeader("Access-Control-Allow-Credentials", true)
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS, POST, PUT, PATCH, DELETE",
  )
  res.status(204).end()
})
```

## JSONP

JSONP 的原理，主要就是利用了 script 标签的src没有跨域限制来完成的。

主要步骤：

1. 前端定义一个解析函数，在函数体中处理响应数据，比如: `jsonpCallback = function (res) {console.log(res)}`
2. 构造 script 元素的 url，将解析函数的函数名以查询参数的形式挂载到 url 中。比如 `http://bar.com?id=1&cb=jsonpCallback`
3. 跨域站点的服务端逻辑需要劫持对应的 jsonp 请求，从路径查询参数中获取到执行函数名 jsonpCallback，并以带上参数且调用执行函数的方式拼装成字符串进行响应。
4. 请求成功后，浏览器会执行 script 元素请求的响应数据，相当于执行 jsonpCallback。

```js
// 前端脚本
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
```

跨域站点的服务端代码

```js
app.get("/jsonp", (req, res) => {
  const { id, cb } = req.query

  // 省略相关业务逻辑

  // 把 cb 的值拼装成函数调用的形式，并传入实参 jsonpCallback({id, abc: 123}) 返回给客户端
  res.status(200).send(`${cb}({id: ${id}, abc: 123 })`)
})
```

CORS与JSONP的使用目的相同，但是比JSONP更强大。JSONP只支持GET请求，CORS支持所有类型的HTTP请求。JSONP的优势在于支持老式浏览器，以及可以向不支持CORS的网站请求数据。

## Nginx

另一种跨域方案是使用 Nginx 作为反向代理服务器。

使用 Nginx 代理服务器之后，请求不会直接到达需要跨域访问的服务端站点，请求会先经过 Nginx 服务器，然后在 Nginx 中设置 CORS 相关的响应头字段。

```
server {
  listen          9003;
  server_name     localhost;

  location / {
    if ($request_method = 'OPTIONS') {
      add_header 'Access-Control-Allow-Origin' 'http://127.0.0.1:9002';
      add_header 'Access-Control-Allow-Methods' 'PUT,DELETE';
      add_header 'Access-Control-Allow-Headers' 'Test-CORS, Content-Type';
      add_header 'Access-Control-Max-Age' 1728000;
      add_header 'Access-Control-Allow-Credentials' 'true';
      add_header 'Content-Length' 0;
      return 204;
    }

    add_header 'Access-Control-Allow-Origin' 'http://127.0.0.1:9002';
    add_header 'Access-Control-Allow-Credentials' 'true';

    proxy_pass http://127.0.0.1:9002;
    proxy_set_header Host $host;
  }
}
```

## CORS 依赖包

在实际项目中，通常也不会手动去配置 CORS 相关的响应头，可以直接引用第三方依赖包。

比如 express 中的 cors 包。

`cors(options)`

options 配置项：

- origin: 配置Access-Control-Allow-Origin。
  - boolean：如果设置 true，则仅反应当前请求的域 origin，设为 false 则禁用 cors
  - string: 设置为特定的站点
  - regexp: 正则匹配的站点
  - array: 站点字符串的数组形式
  - function: 自定义函数，第一个入参当前请求源，第二参数为回调函数 `cb(err, isAllow)`。
- method：配置Access-Control-Allow-Methods 。值可以为一个逗号分隔的字符串(ex: 'GET,PUT,POST')或一个数组(ex: ['GET'， 'PUT'， 'POST'])。
- allowedHeaders：配置Access-Control-Allow-Headers CORS报头。值可以为一个逗号分隔的字符串(ex: 'Content-Type,Authorization')或一个数组(ex: ['Content-Type'， 'Authorization'])。如果未指定，则默认反映请求的Access-Control-Request-Headers 中指定的头。
- exposedHeaders：配置Access-Control-Expose-Headers。期望一个逗号分隔的字符串(例如:'Content-Range,X-Content-Range')或一个数组(例如:['Content-Range'， 'X-Content-Range'])。如果未指定，则不公开自定义标头。
- credentials：配置Access-Control-Allow-Credentials。设置为true以传递消息头，否则省略。
- maxAge：配置Access-Control-Max-Age。设置为整数以传递报头，否则省略。
- optionsSuccessStatus：提供一个预检请求 options 的响应状态码，因为一些旧的浏览器(IE11)阻塞在204。
- preflightContinue：将预检请求传递给下一个中间件处理。

使用

```js
import express from "express"
import cors from "cors"

const app = express()

// 全局开启 cors
app.use(cors())

// 针对单个路由开启 cors
app.get("/products/:id", cors(), function (req, res, next) {
  res.json({ msg: "This is CORS-enabled for a Single Route" })
})

// 省略其它代码
```

## iframe 跨域窗口通信

有些场景，在当前网页中通过 iframe 嵌入跨域的站点。那这两个跨域站点可以通过 postMessage 进行通信。

在有嵌入 iframe 的页面中，一个窗口可以获得对另一个窗口的引用（比如 targetWindow = window.opener），然后在窗口上调用 targetWindow.postMessage() 方法分发一个 MessageEvent 消息。

接收消息的窗口可以根据需要自由处理此事件。传递给 window.postMessage() 的参数（比如 message）将通过消息事件对象暴露给接收消息的窗口。

http://foo.com 页面通过 iframe 嵌入 http://bar.com

```js
/*
 * A 窗口的域名是<http://foo.com>，以下是 A 窗口的 script 标签下的代码：
 */
const contentWindow = window.frames[0].contentWindow

// 这行语句的消息不会发送，因为第二个参数不是当前 iframe 嵌入窗口的域。（因为 targetOrigin 设置不对）
contentWindow.postMessage(
  "The user is 'bob' and the password is 'secret'",
  "https://secure.example.net",
)

// 这条语句会成功添加 message 到发送队列中去（targetOrigin 设置对了）
contentWindow.postMessage("hello there!", "http://bar.com")

/**
 * 监听 iframe 发送过来的消息
 */
function receiveMessage(event) {
  // 我们能相信信息的发送者吗？(也许这个发送者和我们最初打开的不是同一个页面).
  if (event.origin !== "http://bar.com") return

  // event.source 是iframe中嵌入窗口的 window 对象。等于iframe.contentWindow
  // event.data 是接收的消息 "hi there yourself!  the secret response is: rheeeeet!"
}
window.addEventListener("message", receiveMessage, false)
```

iframe 嵌入页面 http://bar.com 中的脚本

```js
/*
 * iframe 嵌入页面域名是 http://bar.com，以下是 script 标签中的代码：
 */

//当 A 页面 postMessage 被调用后，这个 function 被 addEventListener 调用
function receiveMessage(event) {
  // 我们能信任信息来源吗？
  if (event.origin !== "http://foo.com") return

  // event.source 是当前 iframe 所在的宿主窗口，即 foo.com 页面的 window 对象。
  // event.data 是 "hello there!"

  // 假设你已经验证了所受到信息的 origin (任何时候你都应该这样做), 一个很方便的方式就是把 event.source
  // 作为回信的对象，并且把 event.origin 作为 targetOrigin
  event.source.postMessage(
    "hi there yourself!  the secret response " + "is: rheeeeet!",
    event.origin,
  )
}

window.addEventListener("message", receiveMessage, false)
```
