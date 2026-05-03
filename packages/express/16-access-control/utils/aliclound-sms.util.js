/*
 * @Date         : 2024-02-29 16:23:16 星期4
 * @Author       : xut
 * @Description  : https://next.api.aliyun.com/api/Dysmsapi/2017-05-25/SendSms
 */

import Core from "@alicloud/pop-core"

// 实际业务中可以设置环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID 和 ALIBABA_CLOUD_ACCESS_KEY_SECRET。

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
  accessKeyId: process.env["ALIBABA_CLOUD_ACCESS_KEY_ID"],
  accessKeySecret: process.env["ALIBABA_CLOUD_ACCESS_KEY_SECRET。"],
  // securityToken: process.env['ALIBABA_CLOUD_SECURITY_TOKEN'], // use STS Token
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
      },
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
