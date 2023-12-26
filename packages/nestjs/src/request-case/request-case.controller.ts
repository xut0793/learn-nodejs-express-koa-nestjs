/*
 * @Date         : 2023-12-25 23:11:07 星期1
 * @Author       : xut
 * @Description  : request 请求参数的获取
 *
 * nestjs 内置了装饰器来获取请求参数，每个装饰器也可以传入key，获取特定的值
 * 同时也为所有标准的 HTTP 方法提供装饰器： @Get()、@Post()、@Put()、@Delete()、@Patch()、@Options() 和 @Head()。 此外，@All() 定义了一个端点来处理所有这些。
 * nestjs                  =>  express
 * @Request() / @Req()     =>  req
 * @Response() / @Res()    =>  res
 * @Next()                 =>  next
 *
 * @Param(key?: string)    =>  req.params / req.params[key]
 * @Query(key?: string)    =>  req.query / req.query[key]
 * @Query(key?: string)    =>  req.query / req.query[key]
 * @Headers(name?: string) =>  req.headers / req.headers[name]
 * @Ip()                   =>  req.ip
 * @HostParam()            =>  req.hosts
 * @Session()              =>  req.session
 *
 * 但是没有提供 @Cookie，需要自定义一个参数装饰器，见 request-cookie.controller.ts
 */
import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Headers,
  Body,
  Post,
} from '@nestjs/common';
import type { Request } from 'express';

@Controller()
export class RequestCaseController {
  /**
   * 从底层实现库特定的请求对象获取请求相关参数，比如 express 平台实现的 req 对象
   *
   * @param req express.req
   * @returns object
   */
  @Get('url')
  getRequestInfo(@Req() req: Request) {
    return {
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      hostname: req.hostname,
      secure: req.secure,
      path: req.path,
    };
  }

  /**
   * 获取请求头
   *
   * @param headers 请求头对象
   * @returns
   */
  @Get('headers')
  getHeaders(@Headers() headers: Record<string, any>) {
    return headers;
  }

  /**
   * 每一个装饰器也可以传入具体的 key，返回对应的 value
   *
   * @param type 请求内容类型
   * @returns
   */
  @Post('headers/type')
  getContentType(@Headers('Content-Type') type: string) {
    return {
      'Content-Type': type,
    };
  }

  /**
   * 动态路由，注意装饰器单词没有 s
   * 如果有多个动态路由参数，也可以 @Param() 获取所有
   *
   * @param id 动态路径的 key
   * @returns
   */
  @Get('params/:id')
  getParams(@Param('id') id: string) {
    return { id };
  }

  /**
   * 获取查询参数，也可以指定某个查询参数 @Query(key?: string)
   *
   * @param query 查询参数
   * @returns
   */
  @Get('query')
  getQuery(@Query() query: Record<string, any>) {
    return query;
  }

  /**
   * 获取请求体，实现 x-www-form-urlencoded / application/json 类型请求体，转成 json 对象获取
   * 对于 multipart/form-data 需要使用特定装饰器，见 request-file.controller.ts
   *
   * @param body 请求体
   * @returns
   */
  @Post('body')
  getBody(@Body() body: Record<string, any>) {
    return body;
  }
}
