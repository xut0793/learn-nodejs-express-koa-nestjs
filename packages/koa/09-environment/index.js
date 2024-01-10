import { resolve } from "node:path"
import Koa from "koa"
import Router from "@koa/router"
import { envParser, envConfigSchema } from "./env.middleware.js"

const router = new Router()

router.get("/environment", (ctx) => {
  ctx.body = ctx.state
})

const app = new Koa()

app
  .use(
    envParser({
      envDir: resolve(process.cwd(), "./09-environment/config"),
      validationSchema: envConfigSchema,
      validationOptions: {
        allowUnknown: true,
      },
    })
  )
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
