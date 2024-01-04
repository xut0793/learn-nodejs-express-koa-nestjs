/*
 * @Date         : 2024-01-04 14:57:26 星期4
 * @Author       : xut
 * @Description  :
 */
import { createServer } from "node:http"
import { z } from "zod"

/**********************************************************************************
 * 1. 定义数据模型 schema
 *
 * zod object 的默认行为：
 * 1. 默认情况下，Zod 对象的模式在解析过程中会剥离出未被 schema 定义的 key
 * 2. 相反，如果你想通过未知的 keys，使用 zodSchema.passthrough()
 * 3. 也可以用.strict()来 禁止 未知键。如果输入中存在任何未知的 keys，Zod 将抛出一个错误。
 * 4. 当使用 passthrough 或 strict 后，如果想恢复默认行为，可以使用 strip
 * 5. 也可以将一个 "catchall "模式传递给一个对象模式。所有未知的 keys 都将根据它进行额外验证。
 ********************************************************************************/

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

// 为了复用 schema ，这里响应的用户字段模型可以从 createUserDto 中提供
const ResUserDto = createUserDto.omit({ password: true }) // 响应对象不包括 password 字段

/********************************************************************************
 * 应用
 ****************************************************************************/

const server = createServer((req, res) => {
  const method = req.method
  const url = req.url

  if (method === "GET" && url === "/serialization") {
    const resUser = {
      name: "lisa",
      marriage: false,
      age: 18,
      gender: "Male",
      email: "lisa@qq.com",
      avatar: "http://ijuetxufh.kr/ogpn",
      birthday: "2000-01-01",
      desc: "测试响应参数序列化效果",
      password: "123456", // 预期不会响应到客户端
      extraKey: 31, // 额外的字段预期也不会响应
    }

    const result = ResUserDto.safeParse(resUser)

    if (result.success) {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify(result.data))
    } else {
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify(result.error))
    }
  } else {
    res.writeHead(404)
    res.end()
  }
})

app.get("/serialization", (req, res) => {
  const resUser = {
    name: "lisa",
    marriage: false,
    age: 18,
    gender: "Male",
    email: "lisa@qq.com",
    avatar: "http://ijuetxufh.kr/ogpn",
    birthday: "2000-01-01",
    desc: "测试响应参数序列化效果",
    password: "123456", // 预期不会响应到客户端
    extraKey: 31, // 额外的字段预期也不会响应
  }

  const result = ResUserDto.safeParse(resUser)

  if (result.success) {
    res.json(result.data)
  } else {
    res.status(500).send(result.error)
  }
})

server.listen(9000, () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
