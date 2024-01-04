/*
 * @Date         : 2023-10-25 23:16:49 星期3
 * @Author       : xut
 * @Description  : 接口响应统一数据格式 {code, message, data}
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TestInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const dto = this.reflector.getAllAndOverride('ZOD_SERIALIZER_DTO_OPTIONS', [
      context.getHandler(),
      context.getClass(),
    ]);
    const schema = dto.schema;

    return next.handle().pipe(
      map((res) => {
        const result = schema.safeParse(res);

        if (result.success) {
          return result.data;
        } else {
          return result.error;
        }
      }),
    );
  }
}
