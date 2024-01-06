import { Router } from "express"
const router = new Router()

router.get("/login", (req, res) => {
  res.send("user login")
})

export default router
