# 单点登录 SSO (Single Sign On)

## What

单点登录（Single Sign On），简称为 SSO，是比较流行的企业业务子系统整合的解决方案之一。SSO 适用于在多个应用系统中，用户只需要登录一次就可以访问所有相互信任的应用系统，并且只要在某处操作登出，其它系统也同时注销登录状态。

单点登录虽然字面上强调登录，但逻辑实现上，需要包含两部分内容：单点登录和单点登出。

## Why

企业发展初期，信息系统不多，可能只有一个系统就可以满足业务需求，用户也只需要用账号和密码登录即可完成认证。但是随着业务的迭代发展，系统架构会随之迭代，演变越来越多的子系统，如果每次访问一个子系统都需要进行一次登录操作，或者需要逐个登出的话，显然流程是非常低效的。

web系统由单系统发展成多系统组成的应用群，复杂性应该由系统内部承担，而不是用户。无论web系统内部多么复杂，对用户而言，都是一个统一的整体，也就是说，用户访问web系统的整个应用群与访问单个系统一样，登录和登出只要一次就够了。

## How

Web 登录的本质是什么， 就是如何维持 HTTP(s) 的登录态。

> HTTP(s) 无状态：服务器无法知道两个请求是否来自同一个浏览器，即服务器不知道用户上一次做了什么，每次请求都是完全独立的请求。

所以从 web 发展的历史中，出现了通过 Cookie / Session / Token 来解决这个问题。

扩展到多个系统间实现单点登录方案的本质，就是在多个系统间实现共享登录态。

所以有如下的解决方案，但现在广泛使用 CAS 方案。

### 基于同域 Cookie

> 从学术角度（《计算机网络》中的定义），.com、.cn 为一级域名（也称顶级域名），.com.cn、baidu.com 为二级域名，sina.com.cn、tieba.baidu.com 为三级域名，以此类推，N 级域名就是 N-1 级域名的直接子域名。
> 从使用者的角度来说，一般把支持独立备案的主域名称作一级域名，如 baidu.com、sina.com.cn 皆可称作一级域名，在主域名下建立的直接子域名称作二级域名，如 tieba.baidu.com 为二级域名。

不管是纯Cookie，还是基于Cookie实现的Session，都是基于 Cookie 的两个特性：

- 浏览器自主行为
- Cookie 不能跨域

以基于 Cookie 实现的方案举例：

一个企业一般情况下有一个一级域名，通过二级域名区分不同的系统。比如企业域名叫做：`http://a.com`，同时有两个业务系统分别为：`http://app1.a.com` 和 `http://app2.a.com`。我们要做单点登录（SSO），需要一个登录系统，叫做：`http://sso.a.com`。

我们只要在 `http://sso.a.com` 进行登录，默认情况下，签发的 Cookie 会被写入到当前域名下 `http://sso.a.com`。当我们要访问 `http://app1.a.com` 和 `http://app2.a.com` 时，如何能共享 `sso.a.com` 域名下的 Cookie 呢？

cookie 是不能跨域的，但在内部系统中，虽然二级域名不同，但系统都在一级域名下，所以在签发 Cookie 时将 domain 属性设为一级域名 `a.com`，这样所有子域的访问时，浏览器都会自动带上顶域的 Cookie。这样就实现了在多系统间传递登录态。

如果选择的是基于 Cookie 保存 SessionID 的话，则需要将 Session 数据存储在共享数据服务上，比如独立的 Redis 服务，这样不同的子系统拿到 SessionID 才能取同一份 Session 数据。

### Nginx 反向代理

共享 Cookie 的方法只适合同域场景下，那如果要跨一级域名实现登录状共享，比如 `www.a.com`和 `www.b.com`，如何解决。有一种方式是使用 Nginx 的反向代理实现。

反向代理服务器对于客户端而言它就像是原始服务器，并且客户端不需要进行任何特别的设置。客户端向反向代理的命名空间(name-space)中的内容发送请求，接着反向代理将判断向何处(原始服务器)转交请求，并将获得的内容返回给客户端，就像这些内容 原本就是它自己的一样。

假设部署了 Nginx 的服务，将认证中心 sso.com、系统 a.com、系统 b.com都通过对应的命名空间进行代理转发请求，这样对客户端来说所有请求都只面向 Nginx 服务。

```nginx
upstream sso {
		server  127.0.0.1:8080  max_fails=0 weight=1;
}
upstream a {
		server  127.0.0.1:8081  max_fails=0 weight=1;
}
upstream b {
 		server 127.0.0.1:8082    max_fails=0 weight=1;
}

location /sso {
		proxy_pass http://sso;
  	proxy_set_header Host  127.0.0.1;
  	proxy_set_header   X-Real-IP        $remote_addr;
  	proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;

  	proxy_set_header Cookie $http_cookie;
  	log_subrequest on;
}

location /web1 {
		proxy_pass http://a;
  	proxy_set_header Host  127.0.0.1;
  	proxy_set_header   X-Real-IP        $remote_addr;
  	proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;

  	proxy_set_header Cookie $http_cookie;
  	log_subrequest on;
}

location /web2 {
  	proxy_pass http://b;
  	proxy_set_header Host  127.0.0.1;
  	proxy_set_header   X-Real-IP        $remote_addr;
  	proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
  	proxy_set_header Cookie $http_cookie;
  	log_subrequest on;
}
```

### iframe 跨域共享

这种方案属于比较 hack 了。

在前后端分离的情况下，完全可以不使用 Cookie，我们可以选择将 Session ID （或 Token ）保存到浏览器的 LocalStorage 中，让前端在每次向后端发送请求时，主动将 LocalStorage 的数据传递给服务端。这些都是由前端来控制的，后端需要做的仅仅是在用户登录成功后，将 Session ID （或 Token ）放在响应体中传递给前端。

在这样的场景下，单点登录完全可以在前端实现。前端拿到 Session ID （或 Token ）后，除了将它写入自己域下的 LocalStorage 中之外，再通过 iframe 通过 postMessage 跨窗口通信的特殊手段将它写入多个其他域下的 LocalStorage 中。

这里在多系统间传递登录态，如果选择共享 SessionID 的话，则需要将 Session 数据存储在共享数据器上，比如独立的 Redis 服务，这样不同的子系统拿到 SessionID 才能取同一份 Session 数据。如果是共享 Token 方案，可以选择 JWT 方式，将认证数据封装在 JWT 载荷中，但密钥需要在各个子系统中共享。

```js
// 获取 token
var token = result.data.token

// 动态创建一个不可见的iframe，在iframe中加载一个跨域HTML
var iframe = document.createElement("iframe")
iframe.src = "http://a.com/localstorage.html"
document.body.append(iframe)
// 使用postMessage()方法将token传递给iframe
setTimeout(function () {
  iframe.contentWindow.postMessage(token, "http://a.com")
}, 4000)
setTimeout(function () {
  iframe.remove()
}, 6000)

// 在这个iframe所加载的HTML中绑定一个事件监听器，当事件被触发时，把接收到的token数据写入localStorage
window.addEventListener(
  "message",
  function (event) {
    localStorage.setItem("token", event.data)
  },
  false
)
```

此种实现方式完全由前端控制，几乎不需要后端参与，同样支持跨域。

### CAS 独立认证中心服务

CAS(Central Authentication Service) 是耶鲁大学发起的开源 SSO 方案，明确了各个系统间的交互流程。可以自己实现，也可以接入开源的 CAS 依赖包，如 jscas 等。

> Apereo CAS 是一个企业级单点登录系统，其中 CAS 的意思是”Central Authentication Service“。它最初是耶鲁大学实验室的项目，后来转让给了 JASIG 组织，项目更名为 JASIG CAS，后来该组织并入了 Apereo 基金会，项目也随之更名为 Apereo CAS。

CAS 实现一个独立的认证中心服务，专门负责处理登录请求的独立的 Web 服务。只有认证中心能接受用户的用户名密码等安全信息，创建全局会话。其他系统不提供登录入口，只接受认证中心的间接授权，间接授权通过令牌实现，以此创建各自的局部会话。

全局会话与局部会话有如下约束关系：

- 局部会话存在，全局会话一定存在
- 全局会话存在，局部会话不一定存在
- 全局会话销毁，局部会话必须销毁

CAS 1.0 协议定义了一组术语，一组票据，一组接口。

- 术语：
  - Client：用户。
  - Server：中心服务器，也是 SSO 中负责单点登录的服务器。
  - Service：需要使用单点登录的各个服务，相当于上文中的产品 a/b。
- 接口：
  - /login：登录接口，用于登录到中心服务器。
  - /logout：登出接口，用于从中心服务器登出。
  - /serviceValidate：用于让各个 service 验证用户是否登录中心服务器。
- 票据
  - TGT: Ticket Granting Ticket。 TGT 是 CAS 为用户签发的登录票据，拥有了 TGT，用户就可以证明自己在 CAS 成功登录过。TGT 封装了 Cookie 值以及此 Cookie 值对应的用户信息。当 HTTP 请求到来时，CAS 以此 Cookie 值（TGC）为 key 查询缓存中有无 TGT ，如果有的话，则相信用户已登录过。
  - TGC：Ticket Granting Cookie。CAS Server 生成TGT放入自己的 Session 中，而 TGC 就是这个 Session 的唯一标识（SessionId），以 Cookie 形式放到浏览器端，是 CAS Server 用来明确用户身份的凭证。
  - ST：Service Ticket。ST 是 CAS 为用户签发的访问某一 service 的票据。用户访问 service 时，service 发现用户没有 ST，则要求用户去 CAS 获取 ST。用户向 CAS 发出获取 ST 的请求，CAS 发现用户有 TGT，则签发一个 ST，返回给用户。用户拿着 ST 去访问 service，service 拿 ST 去 CAS 验证，验证通过后，允许用户访问资源。

> CAS 2.0 中的内容又出现了 PGTIOU, PGT, PT 等概念。

CAS 交互流程

其中浏览器页面能显示重定向子服务的页面的关键在于，不要引起浏览器 CORS 限制。其中认证中心服务响应的登录表单页面，提交表单时必须保持 HTTP “简单请求” 的性质，不然重定向会触发 CORS 跨域访问限制，导致发起预检请求 option 报错，所以登录表单提交可选的方式：

- 使用 web form 表单默认提交行为，即按钮type=submit触发表单自动提交，不用自己定义 script 中的脚本。
- 如果需要使用 js 代码提交表单，则 Post 方式中，设置 Content-Type=application/x-www-form-urlencoded，并且不能阻止表单的默认页面跳转行为 evt.preventDefault()

## 总结

SSO 通常用于企业内部的多系统，优缺点明显，在实施SSO之前，需要仔细评估实际需求进行决策。

- 优点：
  - 用户体验提升：用户只需要登录一次，就可以访问多个应用程序或系统，减少了重复登录的繁琐过程，提升了用户的使用体验。
  - 安全性提升：集中管理用户的身份验证和授权，减少了用户在多个应用程序或系统中使用相同凭据的风险，同时也减少了密码泄露的风险。
  - 工作效率提升：减少用户在多个应用程序或系统中进行身份验证的时间，提升了工作效率。
- 缺点：
  - 单点故障：如果SSO系统出现故障，所有依赖于该系统的应用程序或系统都将无法使用，可能会导致业务中断。
  - 安全风险：如果SSO系统被攻击或被黑客入侵，所有依赖于该系统的应用程序或系统都将面临安全风险。
  - 实施成本高：SSO系统需要进行复杂的配置和集成，需要投入大量的时间和资源，实施成本较高。

## SSO 服务实现

[16-access-control-sso]()
