/*
 * @Date         : 2024-01-23 19:40:25 星期2
 * @Author       : xut
 * @Description  :
 */
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

export const zodValidationMiddleware = new ZodValidationMiddleware()
