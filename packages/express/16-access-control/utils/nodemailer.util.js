/*
 * @Date         : 2024-02-28 15:18:37 星期3
 * @Author       : xut
 * @Description  : https://nodemailer.com
 *
 * 发送邮件的步骤
 * 1.需要一个发送的邮箱，并且开启 SMTP 服务。比如QQ邮箱，登录进去，在设置 - 账户 - SMTP 服务设置中，开启 POP3/SMTP 后，会获得一个授权 code
 * 2.然后服务端安装邮件发送的依赖包 nodemailer
 * 3.创建一个传送器实例 nodemailer.createTransport()
 * 4.调用实例的发送方法 transport.sendMail()
 * 5.成功后关闭传送器 transport.close()
 */
import nodemailer from "nodemailer"

// 中转的邮箱配置
const MAIL_CONFIG = {
  from: "403893851@qq.com", // 配置的邮箱，业务上为公司的服务邮箱
  code: "qnjlqcnoirrvbidf", // 邮箱开启 SMTP 服务后返回的授权码
}

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
    to, // 接收者邮箱 可以是多个 以,号隔开，此时需要注意：如果有一个邮箱发送成功，则认为此次邮箱发送成功。所以可以在结果中对比 accepted 的接受成功的邮箱与 to 要发送的发送的邮箱来判断是否全部成功
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
