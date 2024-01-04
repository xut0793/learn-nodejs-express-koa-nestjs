/*
 * @Date         : 2023-12-26 19:08:54 星期2
 * @Author       : xut
 * @Description  : 请求参数校验，nestjs 提供了内个内置的管道
 *                  ValidationPipe  ParseIntPipe  ParseBoolPipe  ParseArrayPipe  ParseUUIDPipe
 * 其中 ValidationPipe 使用 class-validation / class-transformer 进行校验和转换。
 * 另一种方式，是使用 zod.js，搭配 nestjs-zod 对请求参数进行校验，导入 nestjs-zod 提供的校验管道 ZodValidationPipe
 *
 * @link [class-validator ](https://nest.nodejs.cn/techniques/validation#%E4%BD%BF%E7%94%A8%E5%86%85%E7%BD%AE%E7%9A%84-validationpipe)
 * @link [zod](https://zod.dev/README_ZH)
 * @link [nestjs-zod](https://zod.dev/README_ZH)
 *
 * 这两种是不同风格的验证方式
 * class-validator 是类和装饰器风格，与 nestjs 写法一致
 * zod 是函数式风格，可以链式调用。主要优点是零依赖，typescript 类型友好
 */
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { z } from 'nestjs-zod/z';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';

/**********************************************************************************
 * 类型定义
 * nestjs-zod 针对 nestjs 提供了
 * createZodDto 将一个 zod schema 转成 nestjs 风格的类声明
 * ZodValidationPipe 前置的请求校验的管道，可以作用于全局、控制器、或路由级别
 * ZodSerializerInterceptor 后置的响应拦截器校验，用于序列化响应数据
 * zodToOpenAPI 将 schema 转成符合 swagger 文档的类型定义
 * 扩展了 zod 的标准类型 ZodDateString ZodPassword
 ********************************************************************************/

// 简单示例
const QueryUserSchema = z.object({
  nickname: z.string().min(3).max(10),
  gender: z.enum(['Male', 'Female', 'nonbinary']),
});

export type QueryUser = z.infer<typeof QueryUserSchema>;
export class QueryUserDto extends createZodDto(QueryUserSchema) {}

// 复杂示例
const CreateUserSchema = z.object({
  name: z
    .string({
      description: '用户账号',
      required_error: '名称不能为空',
      invalid_type_error: '名称为字符串',
    })
    .min(4)
    .max(10),
  marriage: z.boolean(),
  age: z.number().int().positive(),
  gender: z
    .enum(['Male', 'Female', 'nonbinary'])
    .default('Male')
    .describe('We respect your gender choice'),
  email: z.string().email().nullable(), // nullable => string | null
  avatar: z.string().url().nullish(), // nullish => string | null | undefined
  desc: z.string().optional(), // optional => string | undefined
  birthday: z.dateString().past('出生日期不能是未来的时间点').format('date'), // z.dateString 是 nestjs-zod 扩展的类型，原生 zod 只有 z.date
  password: z
    .password()
    .min(4)
    .max(10)
    .atLeastOne('digit')
    .atLeastOne('special')
    .atLeastOne('uppercase')
    .atLeastOne('lowercase'), // z.password 也是 nestjs-zod 扩展类型
});

export type CreateUser = z.infer<typeof CreateUserSchema>; // 提取纯 Typescript 类型
export class CreateUserDto extends createZodDto(CreateUserSchema) {}

/********************************************************************************
 * 应用
 ****************************************************************************/
@Controller('/validation')
@UsePipes(ZodValidationPipe)
export class RequestValidationController {
  @Get('params/:id')
  validateParamsId(@Param('id', ParseIntPipe) id: number) {
    return {
      id,
      type: typeof id,
    };
  }

  /**
   * 路由级别注册管道校验请求入参，会覆盖控制器或全局的校验管道
   *
   * @param query
   * @returns
   */
  @Get('query')
  @UsePipes(ZodValidationPipe)
  validateQuery(@Query() query: QueryUserDto) {
    return query;
  }

  /**
   * 使用控制器级别的校验管道
   *
   * @param body
   * @returns
   */
  @Post('body')
  validateBody(@Body() body: CreateUserDto) {
    return body;
  }
}
