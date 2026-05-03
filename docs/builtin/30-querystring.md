# querystring

URL 中的查询字符串，也是有特殊格式拼接的，通常为 `?k=val&k2=val2`，在实际业务中需要经常将它的字符串形式和对象形式进行转化。所以在 nodejs 中通常有两种处理方式：

- querystring 是 nodejs 提供的用于解析和格式化网址查询字符串的实用工具模块
- URLSearchParams 类是遵循 Web 规范实现的用于解析 url 查询字符串的类。

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

## URLSearchParams

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

## querystring

querystring 比 URLSearchParams 性能更高，但不是标准化的 API。当性能不重要或需要与浏览器代码兼容时使用 URLSearchParams。

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

## 示例

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

```js
const obj = { name: "ferret", color: "purple" }
const searchParams = new URLSearchParams(obj)
const qs = querystring.stringify(obj)
console.log(qs)
console.log(searchParams.toString())
// 输出: 'name=ferret&color=purple'
```

可以看到，因为 `new URLSearchParams` 接受不同形式的入参，所以在查询参数的解析和操作上更为统一，都在 URLSearchParams 实例对象上操作。不会像 querystring 模块提供不同的方法来操作。更建议实践 URL 和 URLSearchParams 统一的 API 使用，并且更有 `urlSearchParams.sort()` 产生的收益。

## `urlSearchParams.sort()` 和缓存

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
