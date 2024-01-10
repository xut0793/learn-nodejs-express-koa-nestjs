/*
 * @Date         : 2024-01-10 16:13:23 星期3
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand"

const dotenvPath = resolve(process.cwd(), "./09-environment/config/.env")
const env = process.env.NODE_ENV
console.log("🚀 ~ NODE_ENV:", env)

const resultLocal = dotenv.config({
  path: `${dotenvPath}.local`,
})

const resultEnv = dotenv.config({
  path: `${dotenvPath}.${env}`,
})

const resultCommon = dotenv.config({
  path: dotenvPath,
})

const result = {
  ...resultCommon.parsed,
  ...resultEnv.parsed,
  ...resultLocal.parsed,
}
console.log("🚀 ~ dotenv:", result)
const obj = dotenvExpand.expand({ parsed: result }).parsed
console.log("🚀 ~ dotenv-expand:", obj)
