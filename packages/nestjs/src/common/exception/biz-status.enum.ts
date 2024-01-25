/**
 * @description 业务错误代码
 *
 * HTTP:     00000-09999，比如 00404 00500
 * 数据：     10000-10099
 * 用户及认证：10100-10199
 * 角色：     10200-10299
 * 资源（菜单、按钮）：10300-10399
 * 预期之外错误 10500-10599
 */
export enum BizCode {
  OK = 10000,
  FAIL = 10500,
  PARAM_INVALID = 10001,
  ACCESS_FORBIDDEN = 10002,
  USER_EXISTING = 10101,
  USER_NOT_FOUND = 10102,
  USER_PASSWORD_INVALID = 10103,
  USER_TOKEN_INVALID = 10104,
  ROLE_NOT_FOUND = 10201,
  RESOURCE_NOT_FOUND = 10301,
}

export enum BizMsg {
  OK = 'ok',
  FAIL = 'Internal Server Error',
  PARAM_INVALID = '参数无效',
  ACCESS_FORBIDDEN = '拒绝访问',
  USER_EXISTING = '用户已存在',
  USER_NOT_FOUND = '用户不存在',
  USER_PASSWORD_INVALID = '密码无效',
  USER_TOKEN_INVALID = 'token 无效',
  ROLE_NOT_FOUND = '角色不存在',
  RESOURCE_NOT_FOUND = '资源不存在',
}
