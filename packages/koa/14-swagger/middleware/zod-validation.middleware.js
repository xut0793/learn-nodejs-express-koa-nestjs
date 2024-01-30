/*
 * @Date         : 2024-01-26 23:20:44 星期5
 * @Author       : xut
 * @Description  :
 */
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

export const zodValidationMiddleware = new ZodValidationMiddleware()
