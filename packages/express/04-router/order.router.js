/*
 * @Date         : 2024-01-06 12:46:14 星期6
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
const router = new Router()

router.get("/query", (req, res) => {
  res.send("order query")
})

export default router
