/*
 * @Date         : 2024-02-01 14:08:35 星期4
 * @Author       : xut
 * @Description  :
 */
import Koa from "koa"
import { koaBody } from "koa-body"
import Router from "@koa/router"
import { PrismaClient } from "@prisma/client"

const app = new Koa()
const router = new Router()
const prisma = new PrismaClient()

router.get("/prisma", async (ctx) => {
  ctx.body = "Hello Koa Prisma"
})

router.get("/prisma/user", async (ctx) => {
  const users = await prisma.user.findMany()
  ctx.body = users
})

router.post("/prisma/user", async (ctx) => {
  const user = await prisma.user.create({
    data: ctx.request.body,
  })

  ctx.body = user
})

router.patch("/prisma/user/:id", async (ctx) => {
  const user = await prisma.user.update({
    where: {
      id: ctx.params.id,
    },
    data: ctx.request.body,
  })

  ctx.body = user
})

router.delete("/prisma/user/:id", async (ctx) => {
  const user = await prisma.user.delete({
    where: {
      id: ctx.params.id,
    },
  })

  ctx.body = user
})

app.use(koaBody()).use(router.routes()).use(router.allowedMethods())

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
