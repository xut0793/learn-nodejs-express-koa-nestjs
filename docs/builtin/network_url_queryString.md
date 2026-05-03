# URL

## URI / URL / URN

URI = Uniform Resource Identifier 统一资源标志符
URL = Uniform Resource Locator 统一资源定位符
URN = Uniform Resource Name 统一资源名称

看了全称大概也不好理解三者的区别。

在互联网上，一个文件，一张图片、一段语音都可以被称为一种资源，那服务器上海量的资源，如何快速找到它呢？不管用什么方法表示，只要能唯一标识一个资源，这个标识符 Identifier 就叫URI。

通常会有两种方法来实现定位，一种是用 URL 地址定位；另一种是用 URN 名称定位。

举个例子：去村子找个具体的人（URI），如果用地址：某村多少号房子第几间房的主人就是URL， 如果用身份证号+名字 去找就是URN了。

所以这三者概念上的关系是 uri 包括 url 和 urn。URI 只是一个抽象的定义，URL 和 RNN 是具体实现。

```
+------------------------------------------------+
|                                                |
|  URI(Uniform Resource Identifier)              |
|                                                |
|   +--------------------------------------+     |
|   |                                      |     |
|   | URL(Uniform Resource Locator)        |     |
|   | eg:ftp://192.168.0.111/index.html    |     |
|   | eg:https://blog.csdn.net/index.html  |     |
|   |                                      |     |
|   +--------------------------------------+     |
|                                                |
|   +---------------------------------------+    |
|   | URN(Uniform Resource Name)            |    |
|   | eg:isbn:7-5387-1705-6                 |    |
|   |                                       |    |
|   +---------------------------------------+    |
|                                                |
+------------------------------------------------+

```

只是在互联网上 urn 没流行起来，导致几乎目前所有的 uri 都是以 url 形式表示，比如定位服务器上的一个文件，如果是在本地环境下，可以使用 `ftp://192.168.0.111/index.html`，如果是在 web 环境下，可以使用 `https://blog.csdn.net/index.html`。

在现实场景中，urn 却被广泛使用，比如图书的 ISBN 编码就是 urn 的例子 `isbn:7-5387-1705-6`。

> 国际标准书号（International Standard Book Number），简称ISBN，是专门为识别图书等文献而设计的国际编号.2007年1月1日之前，ISBN由10位数字组成，分四个部分：组号（国家、地区、语言的代号），出版者号，书序号和检验码。中国的组号为7.

## URL 格式

通常情况下，一个 URL 是一个特定格式的字符串，它包含多个部分。基本格式如下：

```
scheme:[//[user:password@]host[:port]][/]path[?query][#fragment]

```

每一部分表示的名称如下：

```
nodejs 旧版 API
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              href                                              │
├──────────┬──┬─────────────────────┬────────────────────────┬───────────────────────────┬───────┤
│ protocol │  │        auth         │          host          │           path            │ hash  │
│          │  │                     ├─────────────────┬──────┼──────────┬────────────────┤       │
│          │  │                     │    hostname     │ port │ pathname │     search     │       │
│          │  │                     │                 │      │          ├─┬──────────────┤       │
│          │  │                     │                 │      │          │ │    query     │       │
"  https:   //    user   :   pass   @ sub.example.com : 8080   /p/a/t/h  ?  query=string   #hash "
│          │  │          │          │    hostname     │ port │          │                │       │
│          │  │          │          ├─────────────────┴──────┤          │                │       │
│ protocol │  │ username │ password │          host          │          │                │       │
├──────────┴──┼──────────┴──────────┼────────────────────────┤          │                │       │
│   origin    │                     │         origin         │ pathname │     search     │ hash  │
├─────────────┴─────────────────────┴────────────────────────┴──────────┴────────────────┴───────┤
│                                              href                                              │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
nodejs 新版的 URL 对象属性，实现 WHATWG 标准
```

## API

node:url 模块提供了两个用于处理 URL 的 API：一个特定于 Node.js 的旧版 API，以及一个实现 Web 浏览器使用的相同 WHATWG URL 标准 的较新 API。

目前建议采用最新的 API，增加了 origin 字段，并且对查询参数部分实现了 URLSearchParams 类，实现了对查询参数的获取、追加、设置、删除的接口方法，特别是动态追加参数更加方便。

> WHATWG (Web Hypertext Application Technology Working Group): 是一个负责开发 Web 标准的工作组，包括 HTML 和 URL 标准。

URL 是一个全局对象，可以直接使用。也可以从包中导出 `import {URL} from 'node:url'`。

```js
const newURL = new URL(
  "https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash",
)
console.log(newURL)
// 输出
// {
//     href: 'https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash',
//     origin: 'https://sub.host.com:8080',
//     protocol: 'https:',
//     username: 'user',
//     password: 'pass',
//     host: 'sub.host.com:8080',
//     hostname: 'sub.host.com',
//     port: '8080',
//     pathname: '/p/a/t/h',
//     search: '?query=string',
//     searchParams: URLSearchParams { 'query' => 'string' },
//     hash: '#hash'
// }
```

旧版接口通过 `url.parse(str)` 返回已解析的对象。

```js
const oldURL = url.parse(
  "https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash",
  true,
)
console.log(oldURL)
// 输出
// {
//     href:'https://user:pass@sub.host.com:8080/p/a/t/h?query=string#hash'
//     protocol: 'https:',
//     auth: 'user:pass',
//     host: 'sub.host.com:8080',
//     hostname: 'sub.host.com',
//     port: '8080',
//     pathname: '/p/a/t/h',
//     search: '?query=string',
//     query: { query: 'string' },
//     path: '/p/a/t/h?query=string',
//     hash: '#hash',
//     slashes: true,
// }
```

对比可以看到，新 API 增加 origin, 将原来的 auth 字段拆成 username 和 password，以及增加 searchParams 对象可以追加修改等操作查询参数，旧版本做不到。

一旦有了 URL 对象，就可以很容易地访问和设置对应属性了。

```js
console.log(myUrl.href) // "https://www.example.com/p/a/t/h?query=123#hash"
console.log(myUrl.protocol) // "https:"
console.log(myUrl.hostname) // "www.example.com"
console.log(myUrl.pathname) // "/p/a/t/h"
console.log(myUrl.search) // "?query=123"
console.log(myUrl.hash) // "#hash"
const params = myUrl.searchParams
console.log(params.get("newQuery")) // "456"

// 添加新的查询参数
params.append("key", "value")
console.log(myUrl.href) // "https://www.example.com/p/a/t/h?newQuery=456&key=value#hash"

// 删除查询参数
params.delete("newQuery")
console.log(myUrl.href) // "https://www.example.com/p/a/t/h?key=value#hash"
```

### `new URL(input[,baseurl])`

- 如果 input 是相对路径，则需要 base。 如果 input 是绝对路径，则忽略 base。
- 如果 input 是相对路径，又没有提供 base，则视为无效 URL，则将会抛出 TypeError。

即一句话，new URL()解析的必须是绝对 URL。

如果不确定 url 是否正确，又想避免报错，可以采用以下两种方式：

- `URL.canParse(input[, base]): boolean` 先判断下是否合法，返回布尔值。
- `URL.parse(input[, base]): URL | null` 返回 URL 或者 null。如果提供了 base，它将被用作基本 URL，用于解析非绝对 input URL。如果 input 无效，则返回 null。

URL 实例对象是一个 WHATWG URL 对象实例，并不是一个普通的 Object 对象。如果要转成一个普通的对象，可以使用 `urlToHttpOptions(myURL)`。

```js
import { urlToHttpOptions } from "node:url"
const myURL = new URL("https://a:b@測試?abc#foo")

console.log(urlToHttpOptions(myURL))
/*
{
  protocol: 'https:',
  hostname: 'xn--g6w251d',
  hash: '#foo',
  search: '?abc',
  pathname: '/',
  path: '/?abc',
  href: 'https://a:b@xn--g6w251d/?abc#foo',
  auth: 'a:b'
}
*/
```

### `fileURLToPath(url[, options])` 和 `pathToFileURL(path[, options])`

`fileURLToPath(url[, options])` 将一个合法的本地 file 协议的 url 地址转成平台系统内的资源路径。确保正确解码百分比编码字符，并确保跨平台有效的绝对路径字符串。

```js
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)

new URL("file:///C:/path/").pathname // Incorrect: /C:/path/
fileURLToPath("file:///C:/path/") // Correct:   C:\path\ (Windows)

new URL("file://nas/foo.txt").pathname // Incorrect: /foo.txt
fileURLToPath("file://nas/foo.txt") // Correct:   \\nas\foo.txt (Windows)

new URL("file:///你好.txt").pathname // Incorrect: /%E4%BD%A0%E5%A5%BD.txt
fileURLToPath("file:///你好.txt") // Correct:   /你好.txt (POSIX)

new URL("file:///hello world").pathname // Incorrect: /hello%20world
fileURLToPath("file:///hello world") // Correct:   /hello world (POSIX)
```

相对应的，`pathToFileURL(path[, options])` 可以将平台内的 path 路径转化一个本地 file 协议的 url 地址。

```js
import { pathToFileURL } from "node:url"

new URL("/foo#1", "file:") // Incorrect: file:///foo#1
pathToFileURL("/foo#1") // Correct:   file:///foo%231 (POSIX)

new URL("/some/path%.c", "file:") // Incorrect: file:///some/path%.c
pathToFileURL("/some/path%.c") // Correct:   file:///some/path%25.c (POSIX)
```

## 百分比编码 Percent-encoding

百分比编码，也被称为 URL 编码，是一种编码机制，用于在 URL 中表示特殊含义或者无法直接表示的字符。

在 URL 中，某些字符具有特殊含义。例如，斜杠/表示分隔，问号?用来分隔 URL 和查询参数，井号#用来指示 URL 的片段标识符，等号=分隔查询参数的键和值。如果你希望在 URL 的某部分包含这样的特殊字符，而不是它们所代表的特殊含义，你就需要使用百分比编码。

在百分比编码中，这些特殊或不可显示的字符被替换成一个百分号（%）后跟两个十六进制数，这两个十六进制数表示原始字符的 ASCII 码值。例如，空格在 URL 中通常会被编码为%20。

```js
// 这是不正确的，因为空格没有被编码。
http://example.com/search?q=Node.js 教程
// 经过编码后的 URL 看起来应该是这样，这样经过编码的 URL 中，空格被替换为了%20，使得整个 URL 有效，可以被 Web 服务器正确理解。
http://example.com/search?q=Node.js%20教程
```

在 Node.js 中，你可以使用 `encodeURI()` 或`encodeURIComponent()`函数来进行百分比编码。

- `encodeURI()` 用于编码完整的 URI，但它不会对已经属于 URI 一部分的特殊字符进行编码，如冒号:、正斜杠/、问号?或井号#。
- `encodeURIComponent()` 更加严格，它会编码用于分隔 URI 各个部分的特殊字符，因此它适用于编码一个完整 URL 字符串。

```js
const url = "http://example.com/search?q=Node.js 教程"
console.log(encodeURI(url)) // http://example.com/search?q=Node.js%20%E6%95%99%E7%A8%8B
console.log(encodeURIComponent(url)) // http%3A%2F%2Fexample.com%2Fsearch%3Fq%3DNode.js%20%E6%95%99%E7%A8%8B
```

## IDN 和 Punycode

IDN（Internationalized Domain Names, IDNs）称为国际化域名。随着互联网的全球化，出现了需要支持非英语字符的域名需求。比如，可以使用中文的域名（`中国.icom.museum`）、阿拉伯文或其他语言的字符作为你的网站域名。这就是 IDN 国际化域名。

然而，互联网的某些部分（特别是域名系统 DNS）设计之初并没有考虑到非 ASCII 字符。比如域名系统(DNS)最初只支持 ASCII 字符集（基本的英文字符、数字和一些符号）。为了解决这个问题，引入了 Punycode 编码。Punycode 能够将含有非 ASCII 字符的字符串转换成一个 ASCII 字符集表示的形式。这使得 IDN 可以被 DNS 系统处理。

Nodejs 早期低版本提供了 punycode 模块来处理 idn 的转化，但是在新版本中，该模块已被弃用，改为通过以下 url 模块提供的两个函数来处理。

- `domainToASCII(domain)` 返回 domain 的 Punycode ASCII 序列化。如果 domain 是无效域，则返回空字符串。
- `domainToUnicode(domain)` 返回 domain 的 Unicode 序列化。如果 domain 是无效域，则返回空字符串。

```js
import { domainToASCII, domainToUnicode } from "node:url"

console.log(domainToASCII("español.com")) // Prints xn--espaol-zwa.com
console.log(domainToASCII("中文.com")) // Prints xn--fiq228c.com
console.log(domainToASCII("xn--iñvalid.com")) // Prints an empty string

console.log(url.domainToUnicode("xn--espaol-zwa.com")) // Prints español.com
console.log(url.domainToUnicode("xn--fiq228c.com")) // Prints 中文.com
console.log(url.domainToUnicode("xn--iñvalid.com")) // Prints an empty string
```

## 查询参数

URL 中的查询字符串，也是有特殊格式拼接的，通常为 `?k=val&k2=val2`，在实际业务中需要经常将它的字符串形式和对象形式进行转化。所以在 nodejs 中通常有两种处理方式：

- querystring 早期 nodejs 提供的用于解析和格式化网址查询字符串的实用工具模块
- URLSearchParams 类是遵循现代 Web 规范实现的用于解析 url 查询字符串的类。

### queryString

主要使用以下两个方法：

- querystring.parse
- querystring.stringify

> querystring.decode() 和 querystring.encode() 分别是 parse 和 stringify 旧版本的方法，没有提供更多自定义参数。

`querystring.parse(str[, sep[, eq[, options]]])` 方法将网址查询字符串 (str) 解析为键值对的集合。

```
  str <string> 要解析的网址查询字符串
  sep <string> 用于在查询字符串中分隔键值对的子字符串。默认值：'&'。
  eq <string> .用于分隔查询字符串中的键和值的子字符串。默认值：'='。
  options <Object>
    decodeURIComponent <Function> 当对查询字符串中的百分比编码字符进行解码时使用的函数。默认值：querystring.unescape()。
    maxKeys <number> 指定要解析的最大键数。指定 0 以删除键的计数限制。默认值：1000。
```

`querystring.stringify(obj[, sep[, eq[, options]]])` 方法通过遍历对象的 "自有属性" 从给定的 obj 生成 URL 查询字符串。

```
  obj <Object> 要序列化为网址查询字符串的对象
  sep <string> 用于在查询字符串中分隔键值对的子字符串。默认值：'&'。
  eq <string> .用于分隔查询字符串中的键和值的子字符串。默认值：'='。
  options
    encodeURIComponent <Function> 当将网址不安全的字符转换为查询字符串中的百分比编码时使用的函数。默认值：querystring.escape()。
```

### URLSearchParams

URLSearchParams 相对于 querystring 模块的优势是可以动态操作查询参数，动态附加，删除等。

```js
// 新建一个查询参数对象
new URLSearchParams() // 实例化空对象
new URLSearchParams(string) // 基于字符串格式：
new URLSearchParams(object) // 基于对象的k-v形式
new URLSearchParams(iterable) // 可以是一个 Array 或者任何迭代对象,但每个键值对必须有两个元素。

// 输出字符串的查询参数
urlSearchParams.toString()

// 字符串对象的增删改查
urlSearchParams.append(name,value)
urlSearchParams.delete(name)
urlSearchParams.set(name,value)
urlSearchParams.get(name)
urlSearchParams.getAll(name)
urlSearchParams.has(name)

// 对象相关的方法
urlSearchParams.keys()
urlSearchParams.values()
urlSearchParams.entries()
urlSearchParams.forEach(fn[,thisArg])
urlSearchParams.sort()
```

### 示例代码

解码

```js
const qs = "name=ferret&color=purple"
const searchParams = new URLSearchParams(qs)
const parsedQs = querystring.parse(qs)

console.log(parsedQs)
// 输出: { name: 'ferret', color: 'purple' }

const obj = searchParams.entries().reduce((ret, cur) => {
  ret[cur[0]] = cur[1]
  return ret
}, {})
console.log(obj) // { name: 'ferret', color: 'purple' }
```

编码

```js
const obj = { name: "ferret", color: "purple" }
const searchParams = new URLSearchParams(obj)
const qs = querystring.stringify(obj)
console.log(qs)
console.log(searchParams.toString())
// 输出: 'name=ferret&color=purple'
```

可以看到，因为 `new URLSearchParams` 接受不同形式的入参，所以在查询参数的解析和操作上更为统一，都在 URLSearchParams 实例对象上操作。不会像 querystring 模块提供不同的方法来操作。更建议实践 URL 和 URLSearchParams 统一的 API 使用，并且更有 `urlSearchParams.sort()` 产生的收益。

### `urlSearchParams.sort()` 和缓存

Node.js 中的 `URLSearchParams.sort()` 方法是一个非常实用的功能，它允许你对 URL 中查询参数（query parameters）进行排序，按键 key 的字母顺序排序所有的查询参数的名称（keys），其值（values）则跟随对应的名称移动。

这样做的目的，不仅可以使 URL 看起来更加整洁，更重要的有助于网络节点中的 url 命中缓存，因为确保 URL 的格式一致性意味着相同的请求会被识别为相同，从而提高了缓存命中率。

比如一个 API 调用场景，你需要从后端获取某些数据，并且这个请求带有多个查询参数。如果每次请求的 URL 参数顺序不一致，即便请求的是相同的资源，也可能导致无法有效利用缓存。

特别是当这些查询参数是动态添加的，那么可能每次生成的 URL 顺序都不同，使用URLSearchParams.sort()可以确保查询字符串的顺序一致，这对于缓存策略尤其重要。

```js
const baseURL = "https://api.example.com/data?"
let paramsString = "date=2023-04-01&user=123&format=json"

let searchParams = new URLSearchParams(paramsString)
searchParams.sort()
let sortedURL = baseURL + searchParams.toString()
// 排序后的URL: https://api.example.com/data?date=2023-04-01&format=json&user=123

// 使用sortedURL发送请求
// 这样子无论参数是如何组合的，最终请求的URL结构都是一样的，
// 大大增强了缓存的可能性，提高了应用性能。
```
