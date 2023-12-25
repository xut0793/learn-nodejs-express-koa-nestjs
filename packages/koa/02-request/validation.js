import Koa from "koa"
import Router from "@koa/router"
import { koaBody } from "koa-body"
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
    return function zodValidationHandler(ctx, next) {
      return this._parse(zodSchema, ctx.params, ctx, next)
    }.bind(this)
  }
  query(zodSchema) {
    return function zodValidationHandler(ctx, next) {
      return this._parse(zodSchema, ctx.query, ctx, next)
    }.bind(this)
  }
  body(zodSchema) {
    return function zodValidationHandler(ctx, next) {
      return this._parse(zodSchema, ctx.request.body, ctx, next)
    }.bind(this)
  }
  _parse(zodSchema, data, ctx, next) {
    if (!data) return next()

    const result = zodSchema.safeParse(data)

    if (result.success) {
      next()
    } else {
      ctx.status = 400
      ctx.body = result.error.format()
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
const app = new Koa()
const router = new Router()

const zodValidationMiddleware = new ZodValidationMiddleware()

router.get("/validation/params/:id", (ctx) => {
  // 不使用中间件的示例
  const result = paramIdDto.safeParse(ctx.params.id)

  if (result.success) {
    ctx.body = ctx.params
  } else {
    ctx.status = 400
    ctx.body = result.error.issues
  }
})

router.get(
  "/validation/query",
  zodValidationMiddleware.query(queryDto),
  (ctx) => {
    ctx.body = ctx.query
  }
)

router.post(
  "/validation/body",
  zodValidationMiddleware.body(createUserDto),
  (ctx) => {
    ctx.body = ctx.request.body
  }
)

app.use(koaBody()).use(router.routes()).use(router.allowedMethods())
app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
