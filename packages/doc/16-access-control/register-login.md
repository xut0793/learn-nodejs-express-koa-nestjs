# 注册、登录的方式

## 注册

注册的主要目的是用来收集特定的用户信息，方便服务端来生成用户的唯一标识符。

常用来作为唯一性标识的个人信息包括：

- 账号，通常在注册页面填写一个账号，提交时会校验账号其唯一性，或者提交密码等资料后由系统分配一个唯一性账号。比如早期的 QQ 号。
- 邮箱具有唯一性，注册时通过向邮箱发送验证码或验证链接，校验邮箱是否真实有效。
- 手机号码具有唯一性，注册时通过向手机发达验证码，校验手机号是否真实有效。
- 第三方授权，利用已注册过的第三方平台返回的唯一用户标识符标记用户。

对 B 端系统，一般都会有一个唯一的工号来标识员工，这些信息在内部数据库可查，所以使用 toB 的系统时一般是不会有注册页面的，使用工号或分配的公司邮箱直接登录即可。

## 登录

对应可获取唯一性标识的方式，注册和登录方式常见的有：

- 账号 + 密码
- 邮箱 + 密码
- 手机号 + 密码
- 跳转第三方系统授权登录，常见于 toC 系统
- 单点登录 SSO，常见于 toB 的企业内部多系统登录，但如 PC 端网页的淘宝、天猫也是单点登录的示例。

随着互联网发展，为了应对爬虫或机器人的自动登录，校验是机器还是真人操作，一般会在首次登录或频繁登录出错后，出现安全码校验。安全码的常见形式有：

- 邮箱或手机号，发送验证码或验证链接
- 额外输入随机字符、数字等
- 滑动条或滑动拼图

如何进行登录？我们能见到的大部分场景都是应用有自己独立的登录页面，更常见的页面形式是填写表单。

## 账号+密码

基本流程：

1. 在注册中提供唯一性的账号和密码，存入数据库
2. 在登录时提供账号和密码，与数据库数据对比合法。

```js
// account.router.js
import { Router } from "express"
import { userModel } from "./db/index.js"

export const router = Router()

/**
 * 用户注册
 *
 * 1.检查账号是否重复注册
 */
router.post("/register", (req, res) => {
  const params = req.body
  const { account, password } = params

  const isExist = userModel.has(account)

  if (isExist) {
    res.send({ code: "-1", msg: "账号已存在，请重新命名", data: null })
  } else {
    const user = usersModel.create({ account, password })
    res.json({ code: 0, msg: "ok", data: user })
  }
})

/**
 * 用户登录
 *
 * 1.检查用户账号和密码是否匹配，存在用户
 * 2.不存在时，理想情况下是响应详细信息，到底是账号不对，还是密码错误。但为了避免穷举等安全风险，在此环节是避免透露详细报错信息的。
 */
router.post("/login", (req, res) => {
  const params = req.body

  const { account, password } = params

  if (userModel.has(account) && userModel.validate({ username, password })) {
    return res.send({ code: 0, msg: "ok", data: params })
  } else {
    return res.send({
      code: "-1",
      msg: "登录失败，请检查用户名或密码是否正确",
      data: null,
    })
  }
})
```

## 邮箱+验证码+密码

与上述账号密码流程相同，扩展的代码在于检查输入的邮箱是不是有效的，检验的方法是邮箱能不能正常接收邮件。

1. 随机生成一个验证码，向邮箱发送一封邮件
2. 用户通过收到的邮件，将邮件里的验证码随密码一起提交
3. 后端服务校验当前邮箱和验证码是否正确，即可证实邮箱的有效性。

邮件的发送需要安装第三方依赖包 nodemailer

```js
import { Router } from "express"
import {
  sendMail,
  generateRandomCode,
  validateCode,
  validateThreshold,
} from "../utils/nodemailer.utils.js"
import { userModel } from "./db/index.js"

export const router = Router()

/**
 * 获取邮箱验证码
 *
 * 1. 生成指定位数的随机数字，作为验证码
 * 2. 验证码保持1分钟内有效，最多使用3次
 * 3. 限制频繁发送验证码
 */
router.get("/code", async (req, res) => {
  try {
    const mail = req.query.mail

    if (!mail) throw new Error("邮箱不能为空")

    const { err, msg } = validateThreshold(mail)

    if (err) {
      throw new Error(msg)
    }

    const code = generateRandomCode(mail)
    const text = `验证码：${code}，请勿转发或泄漏。如果非本人操作，请联系管理员`

    const sendResult = await sendMail(text, mail)

    res.send({ code: "0", msg: "ok", data: sendResult })
  } catch (error) {
    res.status(200).send({ code: "-1", msg: error.message, data: error })
  }
})

/**
 * 用户注册
 *
 * 1.将邮箱作为账号使用，检查邮箱是否重复注册
 * 2.检查邮箱是否有效，邮箱格式校验，校验邮箱验证码
 */
router.post("/register", (req, res) => {
  try {
    const params = req.body
    const { mail, mailCode, password } = params

    const isExist = userModel.has(mail)

    if (isExist) {
      throw new Error("邮箱已存在，请重新输入邮箱注册")
    }

    const { err, msg } = validateCode(mail, mailCode)

    if (err) {
      throw new Error(msg)
    }

    const user = userModel.create({ mail, password })

    res.send({ code: 0, msg: "ok", data: user })
  } catch (error) {
    res.status(200).send({ code: "-1", msg: error.message, data: error })
  }
})

/**
 * 用户登录
 *
 * 1.检查用户账号和密码是否匹配，存在用户
 * 2.不存在时，理想情况下是响应详细信息，到底是账号不对，还是密码错误。但为了避免穷举等安全风险，在此环节是避免透露详细报错信息的。
 */
router.post("/login", (req, res) => {
  const params = req.body
  const { mail, password } = params

  if (userModel.has(mail) && userModel.validate({ mail, password })) {
    return res.send({ code: 0, msg: "ok", data: params })
  } else {
    return res.send({
      code: "-1",
      msg: "登录失败，请检查用户名或密码是否正确",
      data: null,
    })
  }
})
```

### nodemailer

[nodemailer](https://nodemailer.com) 实现发送邮件的步骤：

1. 需要一个发送的邮箱，并且开启 SMTP 服务。比如QQ邮箱，登录进去，在设置 - 账户 - SMTP 服务设置中，开启 POP3/SMTP 后，会获得一个授权 code
2. 然后服务端安装邮件发送的依赖包 nodemailer
3. 创建一个传送器实例 `nodemailer.createTransport()`
4. 调用实例的发送方法 `transport.sendMail()`
5. 成功后关闭传送器 `transport.close()`

将 nodemailer 使用的逻辑封装到通用的工具模块中。

```js
import nodemailer from "nodemailer"

// 中转的邮箱配置
const MAIL_CONFIG = {
  from: process.env.MAIL_FROM, // 配置的邮箱，业务上为公司的服务邮箱
  code: process.env.MAIL_CODE, // 邮箱开启 SMTP 服务后返回的授权码
}

// 可以统一放到配置文件中
const CODE_CONFIG = {
  numberLength: 4, // 验证码的位数
  maxCount: 3, // 有效次数
  threshold: 5000, // 5秒内重复请求视为频繁操作
  effectiveTime: 60000, // 验证码1分钟内有效 过了1分钟清除，校验时判断是否为空即可。
}

//验证码相关信息。业务开发也可以放redis 或者写入数据库内
const codeInfoList = {
  // 'xxx@163.com': {
  //   code: "", // 对应的验证码
  //   count: 0, // 已校验次数
  //   timestamp: 0, // 发送时间戳，毫秒，用来校验频繁操作
  // },
}

export async function sendMail(text, to) {
  const { from, code } = MAIL_CONFIG

  const transport = nodemailer.createTransport({
    host: "smtp.qq.com",
    port: 587, // 端口号：465或587， 如果某个端口号不行，可以尝试另一个，对应变更 secure 字段
    secure: false, // true for 465, false for other ports
    auth: {
      user: from,
      pass: code,
    },
  })

  const result = await transport.sendMail({
    from,
    to, // 接收者邮箱 可以是多个 以,号隔开，此时需要注意：如果有一个邮箱发送成功，则认为此次邮箱发送成功。所以可以在结果中对比 accepted 的接受成功的邮箱与 envelope.to 要发送的发送的邮箱来判断是否全部成功
    text, // 文本
    // html: '<p>xxx</p>', // html格式
    subject: "测试发送邮箱验证码", // 邮箱主题
  })

  transport.close()

  return result

  /**
   * result 对象
    accepted: [ 'xue250run@163.com' ],
    rejected: [],
    ehlo: [
      'PIPELINING',
      'SIZE 73400320',
      'AUTH LOGIN PLAIN XOAUTH XOAUTH2',
      'AUTH=LOGIN',
      'MAILCOMPRESS',
      '8BITMIME'
    ],
    envelopeTime: 192,
    messageTime: 349,
    messageSize: 530,
    response: '250 OK: queued as.',
    envelope: { from: '403893851@qq.com', to: [ 'xue250run@163.com' ] },
    messageId: '<4aa06617-2f02-f51e-9aa2-5ae4ddde536d@qq.com>'
  */
}

export function generateRandomCode(mail) {
  const code = Math.random()
    .toString()
    .slice(0 - CODE_CONFIG.numberLength)

  codeInfoList[mail] = {
    code,
    timestamp: Date.now(),
    count: 0,
  }

  //验证码1分钟内有效 过了1分钟清除，校验时判断是否为空即可。
  setTimeout(() => {
    codeInfoList[mail] = {
      code: null,
      count: 0,
      timestamp: null,
    }
  }, CODE_CONFIG.effectiveTime)

  return code
}

export function validateCode(mail, code) {
  const codeInfo = codeInfoList[mail]

  if (!codeInfo?.code) {
    return {
      err: true,
      msg: "验证码已失效，请重新发送",
    }
  }
  if (codeInfo.code !== code) {
    return {
      err: true,
      msg: `验证码 ${code} 不正确，请重新输入`,
    }
  }

  codeInfo.count++

  if (codeInfo.count >= codeInfo.maxCount) {
    codeInfo.code = ""
    codeInfo.count = 0
    codeInfo.timestamp = null
  }

  return {
    err: false,
    msg: "ok",
  }
}

export function validateThreshold(mail) {
  const codeInfo = codeInfoList[mail]

  if (codeInfo?.code) {
    const interval = Date.now() - codeInfo.timestamp

    if (interval <= CODE_CONFIG.threshold) {
      return {
        err: true,
        msg: "验证码已发送，请勿频繁操作",
      }
    }
  }

  return {
    err: false,
    msg: "ok",
  }
}
```

## 手机号+验证码+密码

基本流程与上述邮箱一样，区别在于如何调用短信服务商的 SDK 进行手机短信的发送。这里以阿里云的短信服务 SDK 为例。

首先需要在阿里云控制台中选择开通短信服务，获取访问密钥、短信签名、短信模板等信息。具体教程

- [阿里云短信接入流程](https://zhuanlan.zhihu.com/p/634449088)
- [阿里云短信服务](https://help.aliyun.com/zh/sms/)

这里用阿里云免费的测试短信演示

```js
// alicolund-sms.utils.js
import Core from "@alicloud/pop-core"

const ALICLOUD_ACCESS_KEY = {
  ACCESS_KEY_ID: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  ACCESS_KEY_SECRET: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
}

// 【阿里云短信测试】 您的验证码为：${code}，请勿泄露于他人！
const ALICLOUD_SMS_CONFIG = {
  signName: "阿里云短信测试", // 上面 【】中的内容，需要在阿里云中进行资质申请认证后，可自定义
  templateCode: "SMS_154950909", // 模板内容：  您的验证码为：${code}，请勿泄露于他人！
}

//验证码相关信息。业务开发也可以放redis 或者写入数据库内
const CODE_CONFIG = {
  numberLength: 4, // 验证码的位数
  maxCount: 3, // 有效次数
  threshold: 5000, // 5秒内重复请求视为频繁操作
  effectiveTime: 60000, // 验证码1分钟内有效 过了1分钟清除，校验时判断是否为空即可。
}

const codeInfoList = {
  // "13698021015": {
  //   code: "", // 对应的验证码
  //   count: 0, // 已校验次数
  //   timestamp: 0, // 发送时间戳，毫秒，用来校验频繁操作
  // },
}

const client = new Core({
  accessKeyId: ALICLOUD_ACCESS_KEY["ACCESS_KEY_ID"],
  accessKeySecret: ALICLOUD_ACCESS_KEY["ACCESS_KEY_SECRET"],
  endpoint: "https://dysmsapi.aliyuncs.com",
  apiVersion: "2017-05-25",
})

export function sendSms(PhoneNumbers, TemplateParam) {
  return new Promise((resolve, reject) => {
    // 注意参数大驼峰形式
    const params = {
      SignName: ALICLOUD_SMS_CONFIG.signName,
      TemplateCode: ALICLOUD_SMS_CONFIG.templateCode,
      PhoneNumbers,
      TemplateParam, // JSON.stringify({code: '1234'})
    }

    const requestOption = {
      method: "POST",
      formatParams: false,
    }

    client.request("SendSms", params, requestOption).then(
      (result) => {
        resolve(result)
      },
      (err) => {
        reject(err)
      }
    )

    /**
       * 响应对象 sendResp.body
       {
          "Message": "OK",
          "RequestId": "FAC44DFB-6A49-58E9-B94A-4E567F3E5C28",
          "Code": "OK",
          "BizId": "558112009170214426^0"
        }
       */
  })
}

export function generateRandomCode(phone) {
  const code = Math.random()
    .toString()
    .slice(0 - CODE_CONFIG.numberLength)

  codeInfoList[phone] = {
    code,
    timestamp: Date.now(),
    count: 0,
  }

  //验证码1分钟内有效 过了1分钟清除，校验时判断是否为空即可。
  setTimeout(() => {
    codeInfoList[phone] = {
      code: null,
      count: 0,
      timestamp: null,
    }
  }, CODE_CONFIG.effectiveTime)

  return code
}

export function validateCode(phone, code) {
  const codeInfo = codeInfoList[phone]

  if (!codeInfo?.code) {
    return {
      err: true,
      msg: "验证码已失效，请重新发送",
    }
  }
  if (codeInfo.code !== code) {
    return {
      err: true,
      msg: `验证码 ${code} 不正确，请重新输入`,
    }
  }

  codeInfo.count++

  if (codeInfo.count >= CODE_CONFIG.maxCount) {
    codeInfo.code = null
    codeInfo.count = 0
    codeInfo.timestamp = null
  }

  return {
    err: false,
    msg: "ok",
  }
}

export function validateThreshold(phone) {
  const codeInfo = codeInfoList[phone]

  if (codeInfo?.code) {
    const interval = Date.now() - codeInfo.timestamp

    if (interval <= CODE_CONFIG.threshold) {
      return {
        err: true,
        msg: "验证码已发送，请勿频繁操作",
      }
    }
  }
  return {
    err: false,
    msg: "ok",
  }
}
```

## 第三方授权登录

为什么可以用第三应用来做登录？想想我们需要在自己应用中登录的目的是什么？登录主要是需要向访问的系统证明自己是谁。

那如果我在第三方应用 B 中已经注册登录过了，而且刚好 B 应用也开放了允许其它应用通过接口查询指定范围内信息的接口，比如用户基本信息的接口。然后目标应用 A 是接受 B 应用的用户信息作为证明你是谁的材料，那么就可以在访问应用A时使用B应用的授权信息来登录。

这里复杂的是 B 应用如何开放资源给外部应用访问，大部分的做法是采用成熟 oauth2 授权框架来实现。那对应我们需要访问的 A 应用，考虑的是如何接入应用B，获取到可信的用户信息。

首先是应用注册，A 应用需要先在第三方应用B中进行注册，成为可信应用。拿到 clientId 和 clientSecret。以接入 gitee 授权登录为例，具体的[应用注册](https://gitee.com/api/v5/oauth_doc#/)

然后是应用A在代码层面的接入逻辑：

1. 进入 A 应用页面，进行本地登录检测，若尚无本地登录，则进行后续步骤
2. 跳转到提供 OAuth 服务的 B 应用提供的用户认证界面，此时B应用需要进行登录认证，如果已登录，则直接下一步，如果暂未登录，需要先进行登录B应用，再回到当前授权访问页面，需要在 url 中带上之前应用应用拿到的 client_id 和填写的回调接口 redirect_url。
3. 首次进行访问授权时，应用B需要询问你是否允许授权给应用A相关信息，会有一个授权列表，由你确认授权范围(scope)。然后用户提交确认还是拒绝。如果是同意，那么有效时间内，再访问该地址，则会不再显示授权确认页面，直接下一步。
4. 验证成功，服务器生成授权码 code，并附在先前取得的回调 redirect_url?code 中，进行重定向调用。
5. 应用 A 服务端接收到带有授权码 code 的请求，说明已经获得了 OAuth服务器的授权，此时可以带着client_id、client_secret、code，向 B 应用换取 access_token。
6. 应用 A 成功获取到 access_token 后，可以在本地进行缓存记录，以便后续使用。也可马上利用 access_token 向 B 应用请求之前应用注册时申请开放的用户资源，作为登录应用 A 可信的用户凭证。

```js
import { Router } from "express"
import fetch from "node-fetch"

export const router = Router()

// 实际业务可以存入数据库
let userInfo = null

/**
 * gitee 授权登录的配置信息
 */
const clientId = process.env.OAUTH_GITEE_CLIENT_ID
const clientSecret = process.env.OAUTH_GITEE_CLIENT_SECRET
const clientRedirectUri = process.env.OAUTH_GITEE_REDIRECT_URI // "http://localhost:8080/api/oauth/redirect/gitee"

const GITEE_API = {
  authorize: `https://gitee.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${clientRedirectUri}`,
  token: "https://gitee.com/oauth/token",
  user: "https://gitee.com/api/v5/user",
}

/**
 *  应用在 gitee 中注册时填写的回调接口 redirect_uri，用 code 换取 access_token
 */
router.get("/redirect/gitee", async (req, res) => {
  try {
    const code = req.query.code
    console.log("🚀 ~ router.get ~ code:", code)

    const oauthParams = {
      grant_type: "authorization_code",
      redirect_uri: clientRedirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }

    const loginRes = await fetch(GITEE_API.token, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(oauthParams),
    })

    const data = await loginRes.json()

    /**
     * 返回的访问token对象
    {
      access_token: "1b2498bf76fb1b93804701e7bb81bd1b",
      token_type: "bearer",
      expires_in: 86400,
      refresh_token: "4b0cf7bdbb6f80569175042402367cc213a1e4f187e321d2ab0f87dd2ae66b20",
      scope: "user_info",
      created_at: 1709208723,
    }
     */
    console.log("access_token >>>", data)

    /**
     * 此时两种处理，视业务需求：
     * 1.一次性把业务需要的第三方应用的用户信息在此时用获取的 token 获取过来，保存到业务中。
     * 2. 把第三方的访问 token 信息保存起来，待后续需要时使用，请求第三方应用上的信息。
     */

    const userRes = await fetch(GITEE_API.user, {
      headers: {
        Accept: "application/json",
        Authorization: `${data.token_type} ${data.access_token}`,
      },
    })

    userInfo = await userRes.json()

    // res.send({ code: "0", msg: "ok", data: userInfo })
    // 此时页面可以增加增加逻辑判断 url 是否有 login 登录信息来判断是否已登录
    // 如果使用 res.render 渲染页面模板，也可以直接把登录信息注入页面，如 res.render('index.html', userInfo)
    res.redirect("http://localhost:8080/static/index.html#oauth?login=true")
  } catch (error) {
    res.status(200).send({ code: "-1", msg: error.message, data: error })
  }
})

/**
 * 此方法好处前端接入更方便，对于前端来说仍然调用自身服务登录接口，但弊端是需要提供 oauth 服务接口支持跨域。一般应用于公司内同域应用，将 Access-Control-Allow-Origin 指定为已注册的子应用。
 */
router.get("/login", async (req, res) => {
  res.redirect(GITEE_API.authorize)
})
```

## SSO 单点登录

[SSO 单点登录](./sso.md)
