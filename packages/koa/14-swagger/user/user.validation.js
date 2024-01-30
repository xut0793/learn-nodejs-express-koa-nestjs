/*
 * @Date         : 2024-01-23 17:10:54 星期2
 * @Author       : xut
 * @Description  :
 */
import { z } from "zod"

const genderEnum = ["Male", "Female", "nonbinary"]

export const userIdDto = z.object({
  userId: z.string().regex(/\d+/, "必须是数值型字符串"),
})
export const queryDto = z
  .object({
    name: z.string(),
    age: z.number().int().positive().safe(),
    gender: z.enum(genderEnum),
    pageSize: z.number().int().positive().safe(),
    pageNum: z.number().int().positive().safe(),
  })
  .partial()

export const createUserDto = z
  .object({
    name: z
      .string({
        description: "用户账号",
        required_error: "名称不能为空",
        invalid_type_error: "名称为字符串",
      })
      .min(4)
      .max(10),
    age: z.number().int().positive(),
    gender: z
      .enum(genderEnum)
      .default("Male")
      .describe("We respect your gender choice"),
    desc: z.string().optional(), // optional => string | undefined
    birthday: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (val) => {
          const isPast = new Date(val) < new Date()
          return isPast
        },
        {
          message: "出生日期不能是未来的时间点",
        }
      ),
  })
  .partial({ desc: true })

export const updateUserDto = createUserDto.partial()
