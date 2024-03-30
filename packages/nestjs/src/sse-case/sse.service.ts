/*
 * @Date         : 2023-11-19 12:59:25 星期0
 * @Author       : xut
 * @Description  :
 */
import { Injectable, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';

@Injectable()
export class SseService {
  constructor(private readonly eventEmitter: EventEmitter2) {}
  subscribe(): Observable<MessageEvent> {
    return fromEvent(this.eventEmitter, 'SSE_BROADCAST').pipe(
      map((data) => {
        return data as MessageEvent;
      }),
    );
  }

  broadcast(data: Record<string, string>) {
    this.eventEmitter.emit('SSE_BROADCAST', {
      data: { action: 'info', data },
    });
    return;
  }
}
