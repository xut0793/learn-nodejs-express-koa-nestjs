/*
 * @Date         : 2024-01-31 16:43:27 星期3
 * @Author       : xut
 * @Description  :
 */
import express from "express"
import { PrismaClient } from "@prisma/client"

const app = express()
const prisma = new PrismaClient()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get("/prisma", (req, res) => {
  res.send("Hello Express Prisma")
})

app.get("/prisma/user", async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

app.post("/prisma/user", async (req, res) => {
  const user = await prisma.user.create({
    data: req.body,
  })
  res.json(user)
})

app.patch("/prisma/user/:id", async (req, res) => {
  const user = await prisma.user.update({
    where: {
      id: req.params.id,
    },
    data: req.body,
  })

  res.json(user)
})

app.delete("/prisma/user/:id", async (req, res) => {
  const user = await prisma.user.delete({
    where: {
      id: req.params.id,
    },
  })

  res.json(user)
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
