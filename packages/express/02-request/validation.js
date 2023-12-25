/*
 * @Date         : 2023-12-25 15:48:33 星期1
 * @Author       : xut
 * @Description  : 使用 zod.js 对请求参数进行校验
 * @link [zod](https://zod.dev/README_ZH)
 *
 */
import express from "express"
import { z } from "zod"

/**********************************************************************************
 * 1. 定义数据模型 schema
 ********************************************************************************/

// 基本使用
const paramIdDto = z.string().regex(/\d+/, "必须是数值型字符串")

const queryDto = z.object({
  nickname: z.string().min(3).max(10),
  gender: z.enum(["Male", "Female", "nonbinary"]),
})

// 复杂，更高级用法可以自定义类型，比如 x.dateString / z.password，参考 [nestjs-zod](https://github.com/risen228/nestjs-zod/blob/c4d00a8550260c5ba4e541e31e0b7bbefdbf702a/src/z/new-types/date-string.ts)
const createUserDto = z.object({
  name: z
    .string({
      description: "用户账号",
      required_error: "名称不能为空",
      invalid_type_error: "名称为字符串",
    })
    .min(4)
    .max(10),
  marriage: z.boolean(),
  age: z.number().int().positive(),
  gender: z
    .enum(["Male", "Female", "nonbinary"])
    .default("Male")
    .describe("We respect your gender choice"),
  email: z.string().email().nullable(), // nullable => string | null
  avatar: z.string().url().nullish(), // nullish => string | null | undefined
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

/********************************************************************************
 * 定义一个校验中间件
 ****************************************************************************/
class ZodValidationMiddleware {
  params(zodSchema) {
    return function zodValidationHandler(req, res, next) {
      return this._parse(zodSchema, req.params, res, next)
    }.bind(this)
  }
  query(zodSchema) {
    return function zodValidationHandler(req, res, next) {
      return this._parse(zodSchema, req.query, res, next)
    }.bind(this)
  }
  body(zodSchema) {
    return function zodValidationHandler(req, res, next) {
      return this._parse(zodSchema, req.body, res, next)
    }.bind(this)
  }
  _parse(zodSchema, data, res, next) {
    if (!data) return next()

    const result = zodSchema.safeParse(data)

    if (result.success) {
      next()
    } else {
      res.status(400).send(result.error.format())
      /**
       * 默认错误是一个数组列表
       [
        {
          "code": "invalid_type",
          "expected": "string",
          "received": "number",
          "path": [ "name" ],
          "message": "Expected string, received number"
        }
      ]
       */
      // res.status(400).send(result.error.issues)

      /**
       * 可以使用.format()方法将这个错误转换为一个嵌套对象。
       * {
          name: { _errors: [ 'Expected string, received number' ] }
        } 
       */
    }
  }
}

/********************************************************************************
 * 应用
 ****************************************************************************/
const app = express()

app.use(express.json())
const zodValidationMiddleware = new ZodValidationMiddleware()

app.get("/validation/params/:id", (req, res) => {
  // 不使用中间件的示例
  const result = paramIdDto.safeParse(req.params.id)

  if (result.success) {
    res.json(req.params)
  } else {
    res.status(400).send(result.error.issues)
  }
})

app.get(
  "/validation/query",
  zodValidationMiddleware.query(queryDto),
  (req, res) => {
    res.json(req.query)
  }
)

app.post(
  "/validation/body",
  zodValidationMiddleware.body(createUserDto),
  (req, res) => {
    res.json(req.body)
  }
)

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
