/*
 * @Date         : 2024-01-16 19:19:19 星期2
 * @Author       : xut
 * @Description  :
 */
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { UserNotFoundBizException } from './biz.exception';

@Controller('error')
export class ErrorCaseController {
  /**
   * 直接抛出错误，默认响应 500
   *
   * 响应结果：
   * {
   *   "statusCode": 500,
   *   "message": "Internal server error"
   * }
   */
  @Get()
  unknownException() {
    throw new Error('unknown error');
  }

  /**
   * HttpException 传入字符串和响应状态码
   *
   * 响应结果：
   * {
   *   "statusCode": 401,
   *   "message": "没有删除文章的操作权限",
   * }
   */
  @Get('throw')
  throwException() {
    throw new HttpException('没有文章的操作权限', HttpStatus.UNAUTHORIZED);
  }

  /**
   * createBody 传入对象，对象会直接作为响应
   *
   * 响应结果：
   * {
   *   "message": "没有删除文章的操作权限",
   *   "operation": "delete",
   *   "operator": "lisa"
   * }
   */
  @Get('object')
  throwObject() {
    const errorBody = HttpException.createBody({
      message: '没有删除文章的操作权限',
      operation: 'delete',
      operator: 'lisa',
    });
    throw new HttpException(errorBody, HttpStatus.UNAUTHORIZED);
    // throw new UnauthorizedException(errorBody)
  }

  /**
   * createBody 传入多个字符串参数
   *
   * 响应结果：
   * {
   *   "message": "没有删除文章的操作权限",
   *   "error": "Error: 未知用户",
   *   "statusCode": 10401
   * }
   */
  @Get('body')
  throwBody() {
    const err = new Error('未知用户');
    const errorBody = HttpException.createBody(
      '没有删除文章的操作权限',
      err.toString(),
      10401,
    );
    throw new UnauthorizedException(errorBody);
  }

  /**
   * 抛出业务自定义异常
   *
   * 响应结果：
   * {
   *   "code": 10102,
   *   "message": "用户不存在",
   *   "data": null
   * }
   */
  @Get('user')
  throwUserNotFoundBizException() {
    throw new UserNotFoundBizException();
  }
}
