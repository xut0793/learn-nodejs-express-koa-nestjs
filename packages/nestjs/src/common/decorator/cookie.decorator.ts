/*
 * @Date         : 2023-11-22 20:03:20 星期3
 * @Author       : xut
 * @Description  :
 */
import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const Cookies = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return key ? request.cookies?.[key] : request.cookies;
  },
);
