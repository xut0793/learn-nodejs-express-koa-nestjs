import { Router } from "express"
import userRouter from "../user/user.router.js"

const router = Router()

router.use("/user", userRouter)

export default router
