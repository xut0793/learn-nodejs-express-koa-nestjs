/*
 * @Date         : 2024-03-31 18:54:47 星期0
 * @Author       : xut
 * @Description  :
 */
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { WebSocket as Client, WebSocketServer as Wss } from 'ws';

@WebSocketGateway({ path: '/ws' })
export class WsCaseGateway {
  @WebSocketServer()
  server: Wss;

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() body: any,
    @ConnectedSocket() client: Client,
  ): string {
    console.log('🚀 ~ WsCaseGateway ~ client:', client);
    console.log('🚀 ~ WsCaseGateway ~ handleMessage ~ body:', body);
    return 'Hello world!';
  }

  /**
   * 与上面 @MessageBody() 封装方法一致。
   * 但是不推荐这种方法，因为它需要在每个单元测试中模拟 socket 实例。
   * 并且无法触发 nestjs 的响应流程了，比如无法利用拦截器和过滤器等
   *
   * 如果实在需要访问套接字实例，可以使用 @ConnectedSocket() 装饰器获取。
   * 这样就不用在意处理事件的回调函数形参的顺序问题了。
   *
   * @param client 特定于实现 websocket 平台的 套接字实例，比如 ws 或 socket.io
   * @param data 客户端接收的数据
   * @returns
   */
  @SubscribeMessage('params_client')
  paramsClient(client: Client, body: any) {
    console.log('🚀 ~ WsCaseGateway ~ paramsClient ~ body:', body);
    client.emit('message', 'client.emit 推送的消息');
    return;
  }

  /**
   * 如果实现的是 ws 服务，则需要通过 this.ws.server.clients 拿到所有连接逐个触发。 clients 是一个 Set 对象。
   */
  @SubscribeMessage('WebSocketServer')
  paramsServer(client: Client, body: any) {
    console.log('🚀 ~ WsCaseGateway ~ paramsServer ~ body:', body);
    this.server.clients.forEach((c) => {
      c.emit('message', 'this.server.clients 推送的消息');
    });
    return;
  }

  /**
   * 响应客户端对应的事件类型
   */
  @SubscribeMessage('browser_client')
  browserClient(@MessageBody() body: any) {
    console.log('🚀 ~ WsCaseGateway ~ browserClient ~ body:', body);
    return {
      event: 'browser_client',
      data: body,
    };
  }
}
