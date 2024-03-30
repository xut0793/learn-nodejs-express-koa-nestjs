/*
 * @Date         : 2023-11-19 11:08:06 星期0
 * @Author       : xut
 * @Description  :
 */
import {
  Controller,
  Sse,
  MessageEvent,
  Query,
  Get,
  Header,
  Req,
} from '@nestjs/common';
import { Observable, interval, map, take } from 'rxjs';
import { SseService } from './sse.service';
import { Cookies } from '../common/decorator/cookie.decorator';
import { Request } from 'express';

@Controller('sse')
export class SseController {
  count: number = 0;
  constructor(private readonly sseService: SseService) {}

  /**
   * 周期性事件流，定时推送
   */
  @Sse('interval')
  @Header('Cache-Control', 'no-cache, must-revalidate') // 阻止浏览器缓存
  @Header('Expires', 'Sun, 31 Dec 2000 05:00:00 GMT') // 兼容性，设置过期时间为过去时
  sseInterval(
    @Req() req: Request,
    @Query() query: Record<string, string>,
  ): Observable<MessageEvent> {
    /**
     * 1. 正常的退出，浏览器默认会发起重试，此时 last-event-id 在请求头里
     * 2. 用户侧主动发起长连接逻辑时，last-event-di 拼接在 url 的查询参数中
     */
    const lastEventId = req.headers['last-event-id'] || query['last-event-id'];

    /**
     * 通过 cookie 来配置用户信息
     */
    const cookie = req.cookies;
    console.log(
      '🚀 ~ file: sse.controller.ts:62 ~ SseController ~ cookie:',
      cookie,
    );

    // @Sse 在 nestjs 规定必须返回一个 observable 可观测对象。因为 nestjs 内部实现时对此对象添加了监听
    return interval(1000)
      .pipe(take(5))
      .pipe(
        map(() => {
          if (lastEventId) {
            this.count = +lastEventId;
          } else {
            this.count++;
          }
          return {
            // FIX: 这里对 id, type, retry 设置在客户端没有用，全部作为 data 数据了，待找原因？？？
            id: `${this.count}`,
            type: 'custom_event', // 默认是 message 事件
            retry: 5000,
            data: {
              action: 'info',
              count: this.count,
            },
          };
        }),
      );
  }

  @Sse('subscribe')
  @Header('Cache-Control', 'no-cache, must-revalidate') // 阻止浏览器缓存
  @Header('Expires', 'Sun, 31 Dec 2000 05:00:00 GMT') // 兼容性，设置过期时间为过去时
  sseEvent() {
    return this.sseService.subscribe();
  }
  /**
   * 非周期性事件流，利用事件触发器进行推送
   */
  @Get('broadcast')
  broadcast(
    @Query() query: Record<string, string>,
    @Cookies() cookies: Record<string, string>,
  ) {
    this.sseService.broadcast({ ...query, ...cookies });
  }
}
