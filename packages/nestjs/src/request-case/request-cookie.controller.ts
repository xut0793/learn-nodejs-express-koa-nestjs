/*
 * @Date         : 2023-12-25 23:49:10 星期1
 * @Author       : xut
 * @Description  : 获取 cookies 和 singedCookies
 *
 * 一、中间件
 * 1. 需要安装依赖包
 * pnpm add cookie-parser
 * pnpm add -D @types/cookie-parser
 *
 * 2. 注册中间件
 * 在 main.ts 中注册 app.use(cookieParser(secret, options))
 *
 * 中间件 cookie-parser，会将提取的 cookies 对象放在 request 上。分为是否签名两种情况：
 * 1. 获取 req.cookies / req.signedCookies（如果已签名的值在客户端有被改动，则读取的值为false)
 * 2. 设置时，response 对象提供了内置实现： res.cookie(key, value, options)
 * 3. res.cookie 设置某个cookie后，想清除，则可以调用 res.clearCookie(name, options)
 *
 * 二、中间件配置选项
 * cookie-parser(secret, options)
 *    secret: '一个用于加密的密钥',
 *    options: {
 *        decode: false,
 *       // 这个值的设置会影响cooke获取的位置。
 *      // 当默认为 false 时，则已签名的cookie从req.signedCookies 上获取原始值，未设置签名的从 req.cookies 上获取
 *      // 当设置 true 时，则所有cookies都在 req.cookies 上获取，但设置了签名的 cookie 不是原始值，是被签名的值。
 *      // 所以这个属性有点反人性。
 *    }
 *
 * 示例：
 * app.use(cookieParser('__secret__', options))
 * res.cookie("no-sign", "ninja")
 * res.cookie("signed", "ninja", { signed: true })
 *
 * 1. 当 decode: false 时，默认值
 * 客户端收到签名的 signed 值是 s:Aninja.3xZA%2BqZ6iXlD5UvE0O8Cjym3tcG21eM8sqPVEDra6Sk
 * 此时服务端获取时分别通过 res.cookies['no-sign'] 和 res.signedCookies['signed] 获取，值都为原始值 ’ninja'
 *
 * 2. 当 decode: true 时，
 * 客户端收到签名的 cookies 值仍是签名后的。但是服务端获取时就有所区别
 * 此时 res.signedCookes 没有 signed 的值了。都要从 res.cookies 中获取。
 * res.cookies = {
 *    'no-sign': 'ninja',
 *    'signed': 's:Aninja.3xZA%2BqZ6iXlD5UvE0O8Cjym3tcG21eM8sqPVEDra6Sk'
 * }
 *
 * 另外，如果客户端浏览器篡改了已签名的 cookie，则服务端再次获取该 cookies 的值将为 false
 * res.signedCookies['signed'] = false
 *
 * 如果cookie过期了，则值为 undefined
 *
 * 三、设置响应的 cookie
 * res.cookie响应时设置 cookie 时选项
 *   domain	字符串	cookie 的域名。 默认为应用的域名。
 *   encode	函数	用于 cookie 值编码的同步函数。 默认为 encodeURIComponent。
 *   expires	日期	格林威治标准时间 cookie 的到期日期。 如果未指定或设置为 0，则创建会话 cookie。
 *   httpOnly	布尔值	将 cookie 标记为只能由 Web 服务器访问。
 *   maxAge	数字	方便的选项，用于设置相对于当前时间的到期时间（以毫秒为单位）。
 *   path	字符串	cookie 的路径。 默认为 “/”。
 *   priority	字符串	“优先级” Set-Cookie 属性的值。
 *   secure	布尔值	将 cookie 标记为仅与 HTTPS 一起使用。
 *   signed	布尔值	指示是否应该对 cookie 进行签名。
 *   sameSite	布尔值或字符串	“SameSite” Set-Cookie 属性的值。
 * }
 *
 *
 */
import {
  Controller,
  ExecutionContext,
  Get,
  Req,
  Res,
  createParamDecorator,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * 自定义装饰器 @cookies(name?: string)
 *
 * 相关主题内容
 * 1. [自定义装饰器](https://nest.nodejs.cn/custom-decorators#%E5%8F%82%E6%95%B0%E8%A3%85%E9%A5%B0%E5%99%A8)
 * 2. [执行上下文 executionContext](https://nest.nodejs.cn/fundamentals/execution-context#%E6%89%A7%E8%A1%8C%E4%B8%8A%E4%B8%8B%E6%96%87%E7%B1%BB)
 */
export const Cookies = createParamDecorator(
  (name: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return name ? request.cookies?.[name] : request.cookies;
  },
);

/**
 * 自定义装饰器 @SignedCookies(name?: string | boolean)
 */
export const SignedCookies = createParamDecorator(
  (name: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return name ? request.singedCookies?.[name] : request.signedCookies;
  },
);

@Controller('/cookie')
export class RequestCookieController {
  /**
   * 设置 cookie
   *
   * passthrough 参数：
   *
   * @param res 响应对象
   * @returns
   */
  @Get('set')
  setCookies(@Res({ passthrough: true }) res: Response) {
    res.cookie('cookie11', 'a cookie', {
      path: '/cookie',
      maxAge: 1000 * 60 * 60 * 24 * 1,
    }); // 过期时间 1d
    res.cookie('singedCookie', 'a signed cookie', {
      path: '/cookie',
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 1,
    });

    return 'cookie set success';
  }

  /**
   * 第一种：从请求对象中直接获取 cookies 和已签名的 singedCookies
   *
   * @param req 请求对象
   * @returns
   */
  @Get('get-from-req')
  getCookiesFromReq(@Req() req: Request) {
    return {
      cookies: req.cookies,
      signedCookies: req.signedCookies,
    };
  }

  /**
   * 第二种：自定义装饰器
   * @Cookie(key?: string)
   * @SignedCookies(name?: string | boolean)
   *
   * @param cookies
   * @returns
   */
  @Get('get-from-decorator')
  getCookiesFromDecorator(
    @Cookies() cookies: Record<string, any>,
    @SignedCookies() signedCookies: Record<string, any>,
  ) {
    return {
      cookies,
      signedCookies,
    };
  }
}
