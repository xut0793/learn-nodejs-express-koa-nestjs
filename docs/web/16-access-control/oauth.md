# OAuth

## What 什么是 OAuth

OAuth 不是一个 API 或者服务，而是一个验证授权(Authorization)的开放标准，所有人都可以基于这个标准实现自己的 OAuth 代码。

OAuth 是一个标准，app 可以用来实现安全的委托访问(secure delegated access)。 OAuth 基于 HTTPS，以及 RESTFul API，应用间使用 access token 来进行身份验证。

认证的理解可以粗分为对内和对外，而 OAuth 就是用于对外开放资源的解决方案。理解它可以从两个视角来说：

- 站在应用角度：简单理解，就是允许用户的认证过程交给一个可信的第三方进行担保。这里的第三方可以公司自己部署的授信服务，也可以是外部应用，如微信，支付宝等。这种情况下，目的通常是为了从第三方获取到用户标识，来完成自身应用后续的授权和鉴权。类似于在银行里可以使用从派出所那里领到的身份证来证明你是谁。
- 站在提供 OAuth 服务的应用角度：OAuth 是一种认证第三方应用的解决方案。约定了一系列 HTTP 请求和响应的交互流程，识别出用户的身份和第三方应用身份，从而根据用户的授权，允许第三方应用从你这边获取用户相关的信息。这里的第三方应用指的就是业务应用。

OAuth主要有 OAuth 1.0 和 OAuth 2.0 两个版本，并且二者完全不同，且不兼容。OAuth2.0 是目前广泛使用的版本，我们多数谈论OAuth时，为 OAuth2.0。

> [RFC 6749 The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749.html)
>
> [RFC 6749 OAuth2 规范中文翻译](https://github.com/liruonian/oauth2-zh_CN)

## Why 为什么要有 OAuth

如果要应用A资源对外开放，允许应用B来访问，不可能在应用B中提供登录应用A的账号密码的，除非两者都是公司内部系统。否则就会泄露登录凭证了。
所以 OAuth 规范的出现就是为了解决访问资源的安全性以及灵活性。目前 OAuth 主要应用在向外部第三方应用开放资源访问授信上。

## OAuth2 认证的前提：应用注册

对于提供 OAuth 服务的应用来说，不是随便一个的应用都可以到我这里领取授信凭证的。申请授信的第三方应用要先完成在 OAuth 服务中进行登记。申请想要访问哪部分资源（授权范围 scope），重定向地址 redirect_uri，明确使用的授权类型 grant_type 等信息，然后 OAuth 服务的应用下发你的客户端凭证 client_id 和 client_secret。

## 4种参与者

- 资源所有者（resource owner）：能够授权访问受保护资源的实体，如果资源所有者是个人，则称为最终用户。
- 资源服务器（resource server）：托管受保护资源的服务器，能够接收并响应携带access token访问受保护资源的请求。
- 客户端（client）：作为资源所有者的“代理”，在其授权下访问受保护资源的应用程序。其中“client（即客户端）”一词并不意味着任何特定的实施特征（如，该应用是在服务器、桌面或其它设备上运行）。
- 授权服务器（authorization server）：在成功认证资源所有者并获得授权后，向客户端签发access token的服务器。

## 4种授权类型 grant_type

1. 授权码 Authorization Code
2. 简化型授权 Implicit：是简化的授权码模式，省略了获取和颁发授权码 code 的过程，直接下发 access_token。
3. 密码型 Password Credentials：直接用资源所有者的密码凭证（即用户名密码）可以直接用来获取访问令牌。此种模式只有当资源所有者与客户端之间存在高度信任（例如客户端时设备操作系统的一部分，或是高特权应用），因为账号密码对第三方应用直接可知。
4. 客户端凭证 Client Credentials：通常企业内部系统间调用，发起请求的第三方客户端同时也是资源所有者。

不同类型的选择，主要视业务场景和需求，主要考量标准就是参与的三方角色之间的信任程度。其中授权码类型是使用最广泛的，也是校验最严格，安全性最高的一种。

> 值得注意的是从 OAuth 2.1开始密码模式和简化模式已经被完全废弃，不再列入规范。这也是 OAuth 2.1 相对于 OAuth 2.0 最大的变化和革新

### 1.授权码模式

```
 +----------+
 | Resource |
 |   Owner  |
 |          |
 +----------+
      ^
      |
     (B)
 +----|-----+          Client Identifier      +---------------+
 |         -+----(A)-- & Redirection URI ---->|               |
 |  User-   |                                 | Authorization |
 |  Agent  -+----(B)-- User authenticates --->|     Server    |
 | 浏览器    |                                 |               |
 |         -+----(C)-- Authorization Code ---<|               |
 +-|----|---+                                 +---------------+
   |    |                                         ^      v
  (A)  (C)                                        |      |
   |    |                                         |      |
   ^    v                                         |      |
 +---------+                                      |      |
 |         |>---(D)-- Authorization Code ---------'      |
 |  Client |          & Redirection URI                  |
 |         |                                             |
 |         |<---(E)----- Access Token -------------------'
 +---------+       (w/ Optional Refresh Token)
```

流程：

- (A) 客户端通过将资源所有者的user-agent重定向到授权端点来初始化授权码流程，客户端需要携带客户端标识、请求授权的范围、state以及重定向URI（当授权通过或拒绝时，授权服务器将user-agent重定向回该URI）。`GET /authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=http://example.com/api/oauth/redirect`
  (B) 授权服务器对资源所有者进行认证，并确认资源所有者是授权还是拒绝客户端的访问请求（可选）。
  (C) 假设资源所有者授权允许客户端的访问，授权服务器会将user-agent重定向到之前提供的重定向URI（授权请求中或者客户端注册时提供的），重定向URI中会包含授权码，以及之前客户端提供的state参数。`http://example.com/api/oauth/redirect?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz`
  (D) 客户端，通常为后端服务，通过上述步骤中获取的授权码 code，向授权服务器请求访问令牌。当发起该请求时，客户端需要进行身份认证，此外，参数中也需要包含换取授权码时携带的重定向URI，以作为验证。
  (E) 授权服务器对客户端进行认证，验证授权码 code 是否正确，并确保重定向URI与步骤C中的完全匹配，如果验证通过，授权服务器将返回访问令牌 access_token，也可能包含刷新令牌 refresh_token。

### 2.简化授权模式

```
 +----------+
 | Resource |
 |  Owner   |
 |          |
 +----------+
      ^
      |
     (B)
 +----|-----+          Client Identifier     +---------------+
 |         -+----(A)-- & Redirection URI --->|               |
 |  User-   |                                | Authorization |
 |  Agent  -|----(B)-- User authenticates -->|     Server    |
 |          |                                |               |
 |          |<---(C)--- Redirection URI ----<|               |
 |          |          with Access Token     +---------------+
 |          |            in Fragment
 |          |                                +---------------+
 |          |----(D)--- Redirection URI ---->|   Web-Hosted  |
 |          |          without Fragment      |     Client    |
 |          |                                |    Resource   |
 |     (F)  |<---(E)------- Script ---------<|               |
 |          |                                +---------------+
 +-|--------+
   |    |
  (A)  (G) Access Token
   |    |
   ^    v
 +---------+
 |         |
 |  Client |
 |         |
 +---------+
```

流程：

(A) 客户端通过将资源所有者的user-agent重定向到授权端点来初始化授权流程，客户端需要携带客户端标识、请求授权的范围、state以及重定向URI（当授权通过或拒绝时，授权服务器将user-agent重定向回该URI）。
(B) 授权服务器对资源所有者进行认证，并确认资源所有者是授权还是拒绝客户端的访问请求。
(C) 假设资源所有者同意授权，那授权服务器将使用之前提供的重定向URI将user-agent重定向回客户端。在重定向URI的fragment部分会包含访问令牌。
(D) user-agent会遵循重定向指令，向基于web的客户端发起请求（不包含fragment部分 [RFC2616]），frament由user-agent自行处理。
(E) 基于web的客户端会返回一个web页面（一般是包含内置脚本的HTML文档），该页面有访问包含fragment在内的整个重定向URI的权限，并且会从fragment中获取到访问令牌。
(F) user-agent执行客户端返回的脚本，用于解析获取访问令牌。
(G) user-agent将访问令牌传送给客户端。

### 3.密码模式

```
 +----------+
 | Resource |
 |  Owner   |
 |          |
 +----------+
      v
      |    Resource Owner
     (A) Password Credentials
      |
      v
 +---------+                                  +---------------+
 |         |>--(B)---- Resource Owner ------->|               |
 |         |         Password Credentials     | Authorization |
 | Client  |                                  |     Server    |
 |         |<--(C)---- Access Token ---------<|               |
 |         |    (w/ Optional Refresh Token)   |               |
 +---------+                                  +---------------+
```

(A) 资源所有者向客户端提供自己的用户名和密码。
(B) 客户端通过使用资源所有者的用户名和密码来访问授权服务器的令牌端点，以获取访问令牌。当发起该请求时，授权服务器需要认证客户端的身份。
(C) 授权服务器验证客户端身份，同时也验证资源所有者的凭据，如果都通过，则签发访问令牌。

### 4.客户端凭证模式

```
 +---------+                                  +---------------+
 |         |                                  |               |
 |         |>--(A)- Client Authentication --->| Authorization |
 | Client  |                                  |     Server    |
 |         |<--(B)---- Access Token ---------<|               |
 |         |                                  |               |
 +---------+                                  +---------------+
```

(A) 客户端向授权服务器发起认证并请求获取访问令牌。
(B) 授权服务器验证客户端身份，如果通过，则签发访问令牌。

## oauth 与 jwt 区别

jwt 只是一种token的形式，你完全可以不用jwt，哪怕一段随机的字符串也可以当作token（不考虑安全性、前后端访问压力等因素）。本质上，你这边使用token是因为http协议无状态，然后用 token 来维持用户状态的。通过记录用户状态信息以完成你的后端业务逻辑的。

oauth 是应用向外部第三方应用开放部分资源的一套授信协议，或者说是一种第三方认证的解决方案。本质上，oauth 是通过一系列方法，成功识别出用户的身份和第三方应用身份，允许第三方应用从你这边获取应用注册时授权范围内相关资源的信息的一种解决方案。

所以 oauth 和 token 完全不是一个维度上的东西。

## 参考链接

[OAuth2](https://oauth.net/2/)
[OAuth2.0 详解](https://zhuanlan.zhihu.com/p/89020647)
[有JWT为什么还要用oAuth2.0来做登入和权限认证呢？](https://www.zhihu.com/question/392620649)
[基于OAuth2授权框架实现授权服务器（使用Node.js设计开发）](https://blog.csdn.net/azurelaker/article/details/120393540)
[马里奥的 OAuth 2.0 历险记](https://www.zhihu.com/column/c_1628366409720881152)
