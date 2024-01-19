/*
 * @Date         : 2024-01-11 16:58:40 星期4
 * @Author       : xut
 * @Description  : 统一响应对象，包括正常和错误
 */

/**
 *  @description 业务错误代码
 *
 * HTTP:     00000-09999，比如 00404 00500
 * 数据：     10000-10099
 * 用户及认证：10100-10199
 * 角色：     10200-10299
 * 资源（菜单、按钮）：10300-10399
 * 预期之外错误 10500-10599
 */
export class BizStatus {
  constructor(code, msg) {
    this.code = code
    this.msg = msg
  }

  static OK = new BizStatus(10000, "ok")
  static FAIL = new BizStatus(10500, "Internal Server Error")
  static PARAM_INVALID = new BizStatus(10001, "参数无效")
  static ACCESS_FORBIDDEN = new BizStatus(10002, "拒绝访问")
  static USER_EXISTING = new BizStatus(10101, "用户已存在")
  static USER_NOT_FOUND = new BizStatus(10102, "用户不存在")
  static USER_PASSWORD_INVALID = new BizStatus(10103, "密码无效")
  static USER_TOKEN_INVALID = new BizStatus(10104, "token 无效")
  static ROLE_NOT_FOUND = new BizStatus(10201, "角色不存在")
  static RESOURCE_NOT_FOUND = new BizStatus(10301, "资源不存在")
}

/**
 * 构建一个自定义的业务错误类，用于错误捕获时区分
 */
export class BizException extends Error {
  constructor(code, msg) {
    let _code = null
    if (code instanceof BizStatus) {
      _code = code.code
      msg = code.msg
    }

    super(msg)

    this.code = _code || code
    this.msg = msg
    this.data = null

    // 捕获构造点的堆栈跟踪，具体使用见 http://nodejs.cn/api/errors.html#errors_error_capturestacktrace_targetobject_constructoropt
    Error.captureStackTrace(this)
  }
}

export class UserNotFoundBizException extends BizException {
  constructor() {
    super(BizStatus.USER_NOT_FOUND)
  }
}
