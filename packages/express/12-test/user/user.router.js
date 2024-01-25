/*
 * @Date         : 2024-01-23 17:09:28 星期2
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import { zodValidationMiddleware } from "../common/middleware/zod-validation.middleware.js"
import { userController } from "./user.controller.js"
import { userIdDto, createUserDto, updateUserDto } from "./user.validation.js"

const router = Router()

router.get("/", userController.findAll)
router.get("/query", userController.queryUsers)
router.post(
  "/",
  zodValidationMiddleware.body(createUserDto),
  userController.createUser
)
router.patch(
  "/:userId",
  zodValidationMiddleware.params(userIdDto),
  zodValidationMiddleware.body(updateUserDto),
  userController.updateUser
)
router.delete(
  "/:userId",
  zodValidationMiddleware.params(userIdDto),
  userController.delUser
)

export default router
