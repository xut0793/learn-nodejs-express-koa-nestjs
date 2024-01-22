/*
 * @Date         : 2024-01-06 19:39:18 星期6
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import { userController } from "../controller/user.controller.js"

const router = Router()

router.get("/page", userController.page)
router.get("/query", userController.query)
router.post("/create", userController.create)
router.get("/debug", userController.debug)
router.get("/error", userController.error)
router.get("/:id", userController.findOne)
router.put("/:id", userController.update)
router.delete("/:id", userController.delete)

export default router
