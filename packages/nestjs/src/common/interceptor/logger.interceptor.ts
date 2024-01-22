/*
 * @Date         : 2024-01-21 23:48:01 星期0
 * @Author       : xut
 * @Description  :
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'node:crypto';
// import type { Logger as WinstonLogger } from 'winston';
// import { CustomLogger } from '../utils/custom-logger';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  /**
   * 方式2：全局替换 nestjs 内置的 logger 实例。
   * 1. app 创建的 create 函数中传入 winston 实例
   * 2. appModule 中注册全局拦截器 
   * providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor
  }
]
   */
  // 这个 Logger 需要在 create 中把nestjs 自带的替换为 winston
  // private readonly logger = new Logger() as unknown as winstonLogger;

  /**
   * 方式1：完全脱离 nestjs 中内置的 logger 使用形式
   * 如果使用此构建函数传入全局 winston 实例的话，注册时就需要在 main.ts 中使用 app.useGlobalInterceptors(new LoggerInterceptor(winstonLogger))
   */
  constructor(private readonly logger: Logger) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const requestIdHeaderName = 'X-Request-Id';
    const requestIdHeader = req.get(requestIdHeaderName);
    const reqId = requestIdHeader ? requestIdHeader : randomUUID(); // 生成一个链接ID
    const startTimestamp = Date.now();
    const method = req.method.toLowerCase();

    const metaInfo = {
      reqId,
      uid: req['user']?.['id'],
      req: {
        ip: req.ip,
        ua: req.headers['user-agent'],
        method,
        path: req.url,
        headers: JSON.stringify(req.headers),
        query: JSON.stringify(req.query),
        cookies: JSON.stringify(req.cookies),
        body: req.is('json') ? JSON.stringify(req.body) : null,
      },
    };

    // 每个请求生成一个子记录器
    // const _logger = this.logger.localInstance as WinstonLogger;
    // const childLogger = _logger.child(metaInfo);

    // childLogger.info('client-req', { stage: 'client-req' });
    const requestMsg = `request ${method} ${req.url} : ${
      context.getClass().name
    } - ${context.getHandler().name} invoked...`;
    this.logger.debug(requestMsg, 'LoggerInterceptor', metaInfo);

    // 在业务 controller service 中需要使用此 childLogger 输出日志
    // req['logger'] = childLogger;
    req['reqId'] = reqId;
    // 将链路 id 进行响应
    res.append(requestIdHeaderName, reqId);

    return next.handle().pipe(
      tap((data) => {
        const cost = Date.now() - startTimestamp;
        const responseMsg = `response ${res.statusCode} - ${cost}ms`;
        this.logger.debug(responseMsg, 'LoggerInterceptor', {
          cost,
          res: {
            statusCode: res.statusCode,
            headers: JSON.stringify(res.getHeaders()),
            body: res.get('Content-Type')?.includes?.('json')
              ? JSON.stringify(data)
              : null,
          },
        });
      }),
    );
  }
}
