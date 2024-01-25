/*
 * @Date         : 2024-01-24 17:14:07 星期3
 * @Author       : xut
 * @Description  :
 */
import { createZodDto } from 'nestjs-zod';
import { createUserSchema } from './create-user.dto';

export const updateUserSchema = createUserSchema.partial();
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
