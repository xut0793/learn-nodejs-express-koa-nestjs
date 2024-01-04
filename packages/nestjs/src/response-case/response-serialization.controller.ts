/*
 * @Date         : 2024-01-04 14:13:05 星期4
 * @Author       : xut
 * @Description  : 响应参数序列化，通过后置拦截器实现
 *
 * 1. nestjs 原生提供了基于 class-validation / class-transformer 实现的 ClassSerializerInterceptor
 * 2. nestjs-zod 提供了基于 zod 的 ZodSerializerInterceptor 配合 ZodSerializerDto。
 *
 * zod object 的默认行为：
 * 1. 默认情况下，Zod 对象的模式在解析过程中会剥离出未被 schema 定义的 key
 * 2. 相反，如果你想通过未知的 keys，使用 zodSchema.passthrough()
 * 3. 也可以用.strict()来 禁止 未知键。如果输入中存在任何未知的 keys，Zod 将抛出一个错误。
 * 4. 当使用 passthrough 或 strict 后，如果想恢复默认行为，可以使用 strip
 * 5. 也可以将一个 "catchall "模式传递给一个对象模式。所有未知的 keys 都将根据它进行额外验证。
 */
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import {
  ZodSerializerDto,
  ZodSerializerInterceptor,
  createZodDto,
} from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

/**********************************************************************************
 * 类型定义
 *
 * nestjs-zod 针对 nestjs 提供了
 * createZodDto 将一个 zod schema 转成 nestjs 风格的类声明
 * ZodValidationPipe 前置的请求校验的管道，可以作用于全局、控制器、或路由级别
 * ZodSerializerInterceptor 后置的响应拦截器校验，用于序列化响应数据
 * zodToOpenAPI 将 schema 转成符合 swagger 文档的类型定义
 * 扩展了 zod 的标准类型 ZodDateString ZodPassword
 ********************************************************************************/
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

// 为了复用 schema ，这里响应的用户字段模型可以从 CreateUserSchema 中提供
const ResUserSchema = CreateUserSchema.omit({ password: true }); // 响应对象不包括 password 字段
export type ResUser = z.infer<typeof ResUserSchema>;
export class ResUserDto extends createZodDto(ResUserSchema) {}
@Controller('/serialization')
@UseInterceptors(ZodSerializerInterceptor)
// @UseInterceptors(TestInterceptor)
export class ResponseSerializationController {
  @Get()
  @ZodSerializerDto(ResUserDto)
  serializationResData() {
    const resUser = {
      name: 'lisa',
      marriage: false,
      age: 18,
      gender: 'Male',
      email: 'lisa@qq.com',
      avatar: 'http://ijuetxufh.kr/ogpn',
      birthday: '2000-01-01',
      desc: '测试响应参数序列化效果',
      password: '123456', // 预期不会响应到客户端
      extraKey: 31, // 额外的字段预期也不会响应
    };
    return resUser;
  }
}
