/*
 * @Date         : 2024-01-24 18:17:06 星期3
 * @Author       : xut
 * @Description  :
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Stream } from 'stream';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((data) => {
        // html
        if (typeof data === 'string' && /<\w+>/.test(data)) {
          return data;
        } else if (data instanceof StreamableFile) {
          return data;
        } else if (data instanceof Stream || data instanceof Uint8Array) {
          return data;
        } else {
          return {
            code: 10000,
            msg: 'success',
            data,
          };
        }
      }),
    );
  }
}
