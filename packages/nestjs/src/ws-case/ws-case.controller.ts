/*
 * @Date         : 2024-03-31 19:43:09 星期0
 * @Author       : xut
 * @Description  :
 */
import { Controller, Get } from '@nestjs/common';
import { WsCaseGateway } from './ws-case.gateway';

@Controller('ws')
export class WsCaseController {
  constructor(private readonly ws: WsCaseGateway) {}

  @Get('emit')
  handleEmit() {
    // 如果实现的是 ws 服务，则需要通过 this.ws.server.clients 拿到所有连接逐个触发。 clients 是一个 Set 对象。
    if (this.ws.server.clients.size === 0) {
      console.log('暂无客户端建立链接 >>>');
    } else {
      this.ws.server.clients.forEach((socket) => {
        socket.emit('message', '这是系统推送的通知');
      });
    }
  }
}
