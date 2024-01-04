/*
 * @Date         : 2023-12-27 10:54:36 星期3
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { urlParser, queryParser, paramsParser } from "../src/parser/index.js"
import { bodyParser } from "../src/parser/body-parser.js"
import { z } from "zod"

/**********************************************************************************
 * 1. 定义数据模型 schema
 ********************************************************************************/
// 原始值校验定义
const paramIdSchema = z.string().regex(/\d+/, "必须是数值型字符串")
// 对象校验定义
const querySchema = z.object({
  nickname: z.string().min(3).max(10),
  gender: z.enum(["Male", "Female", "nonbinary"]),
})

// 更高级用法可以自定义类型，比如 x.dateString / z.password，参考 [nestjs-zod](https://github.com/risen228/nestjs-zod/blob/c4d00a8550260c5ba4e541e31e0b7bbefdbf702a/src/z/new-types/date-string.ts)
const createUserSchema = z.object({
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
 * 基本使用
 ****************************************************************************/
// const result = querySchema.arse(data) // 这种方式会直接 throw error
// const result = querySchema.safeParse(data) // 自行处理错误

// result = {success: boolean, error: [errorInfo]}
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

/********************************************************************************
 * 应用
 ****************************************************************************/
export const app = createServer((req, res) => {
  const { search, pathname, method } = urlParser(req)
  queryParser(req, search)

  res.setHeader("Content-Type", "application/json")
  res.statusCode = 200

  if (method === "get" && pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end("Hello World By Node HTTP")
    return
  } else if (method === "get" && pathname === "/validation/query") {
    const result = querySchema.safeParse(req.query)

    if (result.success) {
      // res.end(JSON.stringify(req.query))
      res.end(JSON.stringify(result))
    } else {
      res.statusCode = 400
      res.end(JSON.stringify(result.error))
    }
  } else if (method === "get" && pathname.startsWith("/validation/params")) {
    const params = paramsParser(req, pathname, "/validation/params/:id")
    const result = paramIdSchema.safeParse(params?.id)

    if (result.success) {
      res.end(JSON.stringify(params))
    } else {
      res.statusCode = 400
      res.end(JSON.stringify(result.error))
    }
    return
  } else if (method === "post" && pathname === "/validation/body") {
    const jsonParser = bodyParser.json()
    return jsonParser(req, res, (err) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" })
        res.end(err.message)
      } else {
        const result = createUserSchema.safeParse(req.body)

        if (result.success) {
          res.end(JSON.stringify(req.body))
        } else {
          res.statusCode = 400
          res.end(JSON.stringify(result.error))
        }
      }
    })
  } else {
    res.writeHead(404)
    res.end("NOT FOUND")
  }
})

app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
