/*
 * @Date         : 2024-01-24 17:14:07 星期3
 * @Author       : xut
 * @Description  :
 */
import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

// 复杂示例
export const createUserSchema = z.object({
  name: z
    .string({
      description: '用户账号',
      required_error: '名称不能为空',
      invalid_type_error: '名称为字符串',
    })
    .min(2)
    .max(10),
  age: z.number().int().positive(),
  gender: z
    .enum(['Male', 'Female', 'nonbinary'])
    .default('Male')
    .describe('We respect your gender choice'),
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

export type UserDto = z.infer<typeof createUserSchema> & {
  id: number;
  createTime: string;
  updateTime?: string;
};
export class CreateUserDto extends createZodDto(createUserSchema) {}
