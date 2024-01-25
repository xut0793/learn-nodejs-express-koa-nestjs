/*
 * @Date         : 2024-01-24 17:29:58 星期3
 * @Author       : xut
 * @Description  :
 */
import { z } from 'nestjs-zod/z';
import { createUserSchema } from './create-user.dto';
import { createZodDto } from 'nestjs-zod';

const queryPageDto = z.object({
  pageSize: z
    .string()
    .regex(/\d+/, '必须是数值型字符串')
    .transform((val) => parseInt(val, 10)),
  pageNum: z
    .string()
    .regex(/\d+/, '必须是数值型字符串')
    .transform((val) => parseInt(val, 10)),
});
const picked = createUserSchema
  .pick({ name: true, age: true, gender: true })
  .partial();
const queryUserDto = picked.merge(queryPageDto);

export class QueryUserDto extends createZodDto(queryUserDto) {}
