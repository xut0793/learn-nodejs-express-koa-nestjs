import { Router } from "express"

export const router = Router()

router.get("/", (req, res) => {
  res.type("text/event-stream")

  let timer = null

  timer = setInterval(() => {
    const obj = logs.shift()
    const content = `data:${JSON.stringify(obj)}\n\n`
    res.write(content)

    if (logs.length === 0) {
      res.end()
      clearInterval(timer)
    }
  }, 1000)
})

const logs = [
  {
    level: "info",
    env: "development",
    traceId: "asdfre2324sf",
    method: "get",
    path: "/user/debug",
  },
  {
    level: "info",
    env: "development",
    traceId: "sdfsdfasdflk",
    method: "post",
    path: "/user/debug",
  },
  {
    level: "info",
    env: "development",
    traceId: "asdfdf2324sf",
    method: "put",
    path: "/user/debug",
  },
  {
    level: "info",
    env: "development",
    traceId: "asdfdf3524sf",
    method: "patch",
    path: "/user/debug",
  },
  {
    level: "info",
    env: "development",
    traceId: "asdfkre6dfsf",
    method: "delete",
    path: "/user/debug",
  },
  {
    level: "info",
    env: "development",
    traceId: "asdfk7df24sf",
    method: "option",
    path: "/user/debug",
  },
]
