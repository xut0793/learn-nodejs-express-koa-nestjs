/*
 * @Date         : 2024-01-10 16:42:37 星期3
 * @Author       : xut
 * @Description  : 获取本地 .env 文件的配置变量，挂载到 app.locals.config 中。
 *                 本中间件应该在注册在第一位，以保证后续中间件对环境变量的访问。
 */
import { resolve } from "node:path"
import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand"
import { z } from "zod"

export const envConfigSchema = z.object({
  BAR: z.string(),
  FOO_BAR: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "staging"])
    .default("development"),
})

export function envParser(options) {
  const envDir = options?.envDir ?? process.cwd()
  const dotenvPath = resolve(envDir, ".env")
  const nodeEnv = process.env.NODE_ENV
  const validationSchema = options?.validationSchema
  const validationOptions = {
    allowUnknown: options?.validationOptions?.allowUnknown ?? false,
  }

  const localResult = dotenv.config({
    path: `${dotenvPath}.local`,
  })

  const envResult = dotenv.config({
    path: `${dotenvPath}.${nodeEnv}`,
  })

  const commonResult = dotenv.config({
    path: dotenvPath,
  })

  const dotenvResult = {
    parsed: {
      ...commonResult.parsed,
      ...envResult.parsed,
      ...localResult.parsed,
    },
  }

  const expandedResult = dotenvExpand.expand(dotenvResult)

  const error =
    localResult.error ||
    envResult.error ||
    commonResult.error ||
    expandedResult.error

  if (!error && validationSchema) {
    const zodSchema = validationOptions.allowUnknown
      ? validationSchema.passthrough()
      : validationSchema
    const result = zodSchema.safeParse({
      ...expandedResult.parsed,
      NODE_ENV: nodeEnv,
    })

    if (!result.success) {
      error = new Error(JSON.stringify(result.error.format()))
    }
  }

  return (ctx, next) => {
    if (error) {
      next(error)
    } else {
      // 中间件是每个请求过来都会执行，所以如果当前应用 app 中已挂载 config 则不需要再赋值了。
      if (!ctx.state?.config) {
        ctx.state = {
          ...ctx.state,
          config: expandedResult.parsed,
        }
      }

      next()
    }
  }
}
