/*
 * @Date         : 2024-01-03 20:40:26 星期3
 * @Author       : xut
 * @Description  : response 响应设置
 *
 * 一、响应报文
 * HTTP/1.1 200 OK             // 协议版本 状态码 状态描述
 * Content-Length: 1024
 * Content-Type: application/json
 *
 * {"code":200,"message":null,"data":"xxx"}
 *
 * 二、响应数据设置
 * 1.状态码和状态文本 @HttpCode(code) HttpStatus
 * 2.响应头 @Header(field, value)
 * 3.响应体 会根据 return 的内容类型,设置 Content-Type 响应头
 *    文件流 new StreamableFile(Buffer | Stream)
 * 4.重定向 @Redirect(url, statusCode=302)
 *
 * 三、响应体与 content-type
 * 会根据 body 的内容,来设置 content-type 响应头
 * 1. 如果是字符串, Content-Type 默认为 text/html 或 text/plain，两者的默认字符集均为 utf-8。
 * 2. 如果是对象, Content-Type 默认为 application/json。 这包括普通对象 { foo: 'bar' } 和数组 ['foo', 'bar']。
 * 3. 如果是 buffer / stream, 需要返回 new StreamableFile(buffer | stream)，此时 Content-Type 默认为 application/octet-stream
 */
import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Query,
  Redirect,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { resolve } from 'path';

@Controller()
export class ResponseCaseController {
  /**
   * 设置响应状态码 HttpCode
   *
   * @returns
   */
  @Get('status-code')
  @HttpCode(HttpStatus.OK)
  resStatusCode() {
    return 'status code';
  }

  /**
   * 设置响应头 Header
   *
   * @returns
   */
  @Get('header')
  @Header('Content-Type', 'text/html')
  @Header('X-Power-By', 'nestjs')
  resHeader() {
    return '<h1>nestjs header</h1>';
  }

  /**
   * 设置 cookie
   *
   * passthrough 参数：
   *
   * @param res 响应对象
   * @returns
   */
  @Get('cookie/set')
  setCookies(@Res({ passthrough: true }) res: Response) {
    res.cookie('cookie11', 'a cookie', {
      path: '/cookie',
      maxAge: 1000 * 60 * 60 * 24 * 1,
    }); // 过期时间 1d

    return 'cookie set success';
  }

  /**
   * 设置签名 cookie
   *
   * passthrough 参数：
   * Nest 内部程序会检测业务逻辑中是否使用 @Res() 或 @Next()，表明你选择了特定于库的选项，响应将由 res 对象接管。此时特定于 nest 平台的过滤器、后置拦截器将不再起作用。
   * 如果既需要使用 Res 对象（比如设置 cookie 或 header 时），又要继续 nest 的响应流程，则需要传入 passthrough: true 选项。
   *
   * @param res 响应对象
   * @returns
   */
  @Get('cookie/sign-set')
  setSignCookies(@Res({ passthrough: true }) res: Response) {
    res.cookie('singedCookie', 'a signed cookie', {
      path: '/cookie',
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 1,
    });

    return 'signed cookie set success';
  }

  /**
   * 重定向 redirect
   * 有两个参数，url 和 statusCode，两者都是可选的。 如果省略，statusCode 的默认值为 302
   * 如果需要根据业务逻辑动态返回 url 时，需要返回一个符合 HttpRedirectResponse 接口的对象，将覆盖传递给 @Redirect(url, code) 装饰器的任何参数。
   *
   * interface HttpRedirectResponse {
   *   url: string;
   *   statusCode: HttpStatus;
   * }
   *
   * @param version
   * @returns
   */
  @Get('redirect')
  @Redirect('https://www.bing.com', 302)
  resRedirect(@Query('version') version: string) {
    if (version === '5') {
      return { url: 'https://nest.nodejs.cn/v5/' }; //这里返回的 url 将覆盖 @Redirect(url, code) 中的。
    }
  }

  /**
   *  响应字符串
   *
   * @returns
   */
  @Get('body/text')
  resText() {
    return '/body/text';
  }

  /**
   * 响应 html
   *
   * @returns
   */
  @Get('body/html')
  @Header('Content-Type', 'text/html')
  resHtml() {
    return '<h1>/body/html</h1>';
  }

  /**
   * 响应 json
   *
   * @returns
   */
  @Get('body/json')
  resJson() {
    return { author: 'lisa', createTime: Date.now() };
  }

  /**
   * 响应文件流
   * 但直接使用 res 对象的方式，会失去对 nestjs 后续过滤器和后置拦截器的逻辑
   *
   * @param res
   */
  @Get('file')
  getFile(@Res() res: Response) {
    const filename = 'test.txt';
    const filePath = resolve(process.cwd(), '../../public', filename);
    const file = createReadStream(filePath);
    file.pipe(res);
  }

  /**
   * 响应文件流 文件下载
   * 通过返回一个 StreamableFile 实例，此时 nest 框架将负责后续的响应逻辑，并保持过滤器和拦截器等逻辑。
   *
   * @returns
   */
  @Get('body/download')
  @Header('Content-Disposition', 'attachment; filename="test.txt"')
  resDownload(): StreamableFile {
    const filename = 'test.txt';
    const filePath = resolve(process.cwd(), '../../public', filename);
    return new StreamableFile(createReadStream(filePath));
  }

  /**
   * 响应文件流的另一种方式，设置 passthrough: true，并且返回 StreamableFile 实例
   * 此时可根据业务逻辑灵活设置，比如响应头
   *
   * @param res
   * @returns
   */
  @Get('body/file')
  resFile(@Res({ passthrough: true }) res: Response): StreamableFile {
    const filename = 'test.txt';
    const filePath = resolve(process.cwd(), '../../public', filename);
    res.set('Content-Type', 'application/octet-stream'); // 这是返回 StreamableFile 的默认值
    return new StreamableFile(createReadStream(filePath));
  }
}
