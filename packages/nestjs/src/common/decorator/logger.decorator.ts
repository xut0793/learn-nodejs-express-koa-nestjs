/*
 * @Date         : 2024-01-21 12:48:33 星期0
 * @Author       : xut
 * @Description  : get 点：参数装饰器只能在 controller 中的方法使用，如果在 service 的方法中使用会报错。
 */
import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { CustomLogger } from '../utils/custom-logger';

export const Logger = createParamDecorator(
  (scope: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.logger as CustomLogger;
  },
);
