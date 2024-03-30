import { Router } from "express"

export const router = Router()

router.get("/", (req, res) => {
  res.type("text/event-stream")

  const arr = "hello world!".split("")

  let timer = null

  timer = setInterval(() => {
    const content = `data:${arr.shift()}\n\n`
    res.write(content)

    if (arr.length === 0) {
      res.write("data:done\n\n")
      res.end()
      clearInterval(timer)
    }
  }, 1000)
})
