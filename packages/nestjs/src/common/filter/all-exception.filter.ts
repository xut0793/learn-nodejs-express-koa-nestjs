/*
 * @Date         : 2023-10-15 20:08:31 星期0
 * @Author       : xut
 * @Description  : 全局异常过滤器
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { BizException } from '../exception/biz.exception';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof BizException) {
      response.status(HttpStatus.OK).send(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).send({
        code: status,
        msg: exception.message,
        err: exception.getResponse(),
        data: null,
      });
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).send({
      code: status,
      msg: exception.message ?? 'Internal Server Error',
      err: exception,
      data: null,
    });
  }
}
