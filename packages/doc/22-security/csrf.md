# CSRF 跨站请求伪造

CSRF 的全称是 Cross Site Request Forgery，跨站请求伪造。

## 理解 CSRF 有两个关键点：

1. 跨站点的请求

跨站的请求，指的是发起攻击的请求是从恶意网站到目标网站的，所以 CSRF 的特点是攻击的发生是由各种跨站的请求造成的。那针对这一点，对应的防御也比较简单，目标网站应该区分请求的来源，即识别请求头字段 Referer 的值是否是可信任站点。

> Referer 请求头字段指明了当前请求的来源，目标网站可以通过这个判断当前请求是从哪个页面或网站过来的。
> 相对于 XSS 跨站脚本攻击是触发从目标网站向恶意网站发起恶意脚本的请求。

```
  +------------+   XSS 跨站请求   +------------+
  |            +----------------->            |
  |  目标站点   |                 |  恶意站点   |
  |            <-----------------+            |
  +------------+   返回恶意脚本   +------------+


  +--------------------+   诱骗操作发起请求      +----------+
  |  伪装过的恶意站点    +----------------------->  目标站点  |
  +--------------------+   携带目标站点的用户凭证 +-----------+

```

2. 请求是伪造的

伪造的定义，可以理解为：如果请求的发出不是用户的意愿，那么这个请求就是伪造的。

> 对于 XSS 来说攻击的请求虽然是从目标网站内发出的，没有同源策略的限制，但同样可以认为这些请求也是伪造的，因为它们同样不是用户的意愿。

从以上内容可以理解，实施 CSRF 攻击的关键是：

- 如何伪装一个网站，诱骗目标用户访问
- 跨域请求，如何携带用户凭证
- 跨域请求，目标站点服务端对浏览器同源策略的配置

## 案例

目标网站 A 有一个删除文章的功能，在交互上是用户单击删除文章按钮，发起一个 Get www.a.com/blog/del?id=1 的请求。

黑客实施 CSRF 攻击的步骤：

1. 黑客在自己的站点中编写一个恶意页面 www.evil.com/csrf.html，将上述恶意脚本购入其中。

```html
<script>
  for (let i = 1; i < 1000; i++) {
    new Image().src = "http://www.a.com/blog/del?id=" + i
  }
</script>
```

2. 然后运用社工学诱骗已经登录过目标网站 A 的（假设目标网站的身份验证机制是 cookie）用户访问 www.evil.com/csrf.html 页面，则攻击就发生了。

跨域发起的请求，类似这样：

```
GET /blog/del?id=1 HTTP/1.1f
Host: www.a.com
Referer: http://www.evil.com/csrf.html
Cookie: JSESSIONID=abctesdfkjsdfjasdfasd
```

如果是目标站点 a 页面中用户自己操作删除，发起的请求，类似这样：

```
GET /blog/del?id=1 HTTP/1.1
Host: www.a.com
Referer: http://www.a.com
Cookie: JSESSIONID=abctesdfkjsdfjasdfasd
```

两者请求中的区别就是请求来源 Referer 不同。

另一种场景，假设目标网站用户的身份认证不基于 Cookie 机制（包括 Cookie 和 Session），比如使用 Authorization: Bearer 的令牌机制，那么上述 CSRF 攻击请求会因为身份认证不通过而失败。

再一种场景，上述 CSRF 攻击的目的是删除文章，对攻击者来说，只要有发起有效的请求就是攻击成功，并不在乎请求的返回数据。上述请求因为是 HTML 元素发起的 GET 简单请求，不会触发浏览器跨域报错。但即使通过脚本使用 XHR 对象发起非简单请求触发浏览器跨域机制报错也视为攻击成功，因为当前攻击目的不在乎请求的返回数据，而浏览器的跨域访问控制机制不会阻止请求的发起，只会阻止浏览器获取跨域请求的响应数据。

如果攻击的目的是为了获得目标服务器的隐私数据，则攻击时需要正视目标站点对 CORS 的配置，如果目标服务器配置 CORS 的 `Access-Control-Allow-Origin: *`，则视为存在 CSRF 漏洞可利用。

## CSRF 类型

按照发起攻击的方式不同，可以分为 HTML CSRF 攻击和 JSON HiJacking 攻击。

### HTML CSRF 攻击

HTML CSRF 攻击指的是请求是通过某些 HTML 元素发起的，这一类是最普遍的。

HTML 元素中能够设置 src / href 等属性的元素，都会发起一个 GET 请求，常见的有：

- `<link href="" >`
- `<meta http-equiv="refresh content="0; url=">`
- `<img src="" />`
- `<a href="">`
- `<iframe src="" >`
- `<script src="">`
- `<audio src="">`
- `<video src="">`
- `<form action="">`

CSS 样式中有：

- `@import ''`
- `background: url('')`

另外就是通过 script 脚本动态生成标签对象发起请求，或者构造 form 表单发起 post 请求等。

### JSON HiJacking 攻击

JSON HiJacking 攻击主要在于某些站点提供 JSONP 的调用接口。

## CSRF 漏洞挖掘

CSRF 的漏洞挖掘只要确认目标站点的以下内容即可：

- 目标站点的身份认证机制是否基于 Cookie 机制；
- 目标站点是否有验证 Referer 请求头
- 目标站点发起跨域请求是否响应 `Access-Control-Allow-Origin: *`
- 目标站点是否提供 JSONP 接口。

## CSRF 漏洞攻击

在确定了目标站点存在 CSRF 漏洞后，即可参照上述案例的步骤进行诱骗网站的开发，并考虑如何运用社工学诱骗目标用户访问恶意网站并进行操作，即达成 CSRF 攻击的目的。

## CSRF 漏洞防御

- 检查 HTTP Referer 字段是否同域，或者在信任的白名单中
- 用户身份认证如果是基于 Cookie 机制，则尽量缩短 Cookie 有效期，可以一定程度上减少被攻击的风险。或者改为基于 Token 的令牌机制
- 对重要的操作进行再次验证，比如使用随机验证码，滑动验证图案等。
- 对 CORS 机制进行详细设计，比如对 Access-Control-Allow-Origin 的值可以与 Referer 共用一份白名单，设置 Access-Control-Allow-Methods / Access-Control-Allow-Headers / Access-Control-Max-Age / Access-Control-Allow-Credentials
