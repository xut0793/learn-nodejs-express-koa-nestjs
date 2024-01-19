/*
 * @Date         : 2024-01-16 20:34:36 星期2
 * @Author       : xut
 * @Description  : 自定义业务异常响应
 */
import { HttpException, HttpStatus } from '@nestjs/common';
import { BizCode, BizMsg } from './biz-status.enum';

export class BizException extends HttpException {
  constructor(code: BizCode, message: string) {
    const errorBody = HttpException.createBody({
      code,
      message,
      data: null,
    });
    super(errorBody, HttpStatus.OK);
  }
}

export class UserNotFoundBizException extends BizException {
  constructor(message?: string) {
    super(BizCode.USER_NOT_FOUND, message || BizMsg.USER_NOT_FOUND);
  }
}

// 其它 USER_EXISTING USER_PASSWORD_INVALID 类似
