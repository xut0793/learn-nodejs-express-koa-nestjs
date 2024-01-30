/*
 * @Date         : 2024-01-23 17:09:28 星期2
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import { zodValidationMiddleware } from "../middleware/zod-validation.middleware.js"
import { userController } from "./user.controller.js"
import { userIdDto, createUserDto, updateUserDto } from "./user.validation.js"

const router = Router()

/**
 * @swagger
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      required:
 *        - name
 *        - age
 *        - gender
 *        - birthday
 *      properties:
 *        name:
 *          type: string
 *          description: 账号
 *        age:
 *          type: string
 *          description: 年龄
 *        gender:
 *          type: string
 *          description: 姓别
 *          default: Male
 *          enum:
 *            - Male
 *            - Female
 *        birthday:
 *          type: number
 *          description: 生日
 *        desc:
 *          type: string
 *          description: 描述
 *      example:
 *        name: lisa
 *        age: 18
 *        gender: Female
 *        birthday: 1900-10-1
 *        desc: This is girl
 */

/**
 * @swagger
 * tags:
 *   name: User
 *   description: 用户管理
 */

/**
 * @swagger
 * /user:
 *   get:
 *     summary: 获取所有用户
 *     tags: [User]
 *     operationId: getAllUsers
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", userController.findAll)

/**
 * @swagger
 * /user/query:
 *   get:
 *     summary: 查询用户分页接口
 *     tags: [User]
 *     operationId: queryUsers
 *     parameters:
 *       - name: pageSize
 *         in: query
 *         description: 页码
 *         schema:
 *           type: number
 *       - name: pageNum
 *         in: query
 *         description: 页数
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: A list of users by pagination.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/query", userController.queryUsers)

/**
 *@swagger
 *  /user:
 *    post:
 *      summary: 新增用户
 *      tags: [User]
 *      operationId: createUser
 *      requestBody:
 *        description: create user object
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      responses:
 *        200:
 *          description: successful operation return user.
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/User'
 */
router.post(
  "/",
  zodValidationMiddleware.body(createUserDto),
  userController.createUser
)

/**
 *@swagger
 *  /user/:userId:
 *    patch:
 *      summary: 更新用户信息
 *      tags: [User]
 *      operationId: updateUser
 *      parameters:
 *        - name: userId
 *          in: path
 *          description: 'The userId that needs to be fetched. Use user1 for testing.'
 *          required: true,
 *          schema:
 *            type: string
 *      requestBody:
 *        description: update user object
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      responses:
 *        200:
 *          description: successful operation return updated user.
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/User'
 *        404:
 *          description: User not found
 */
router.patch(
  "/:userId",
  zodValidationMiddleware.params(userIdDto),
  zodValidationMiddleware.body(updateUserDto),
  userController.updateUser
)

/**
 *@swagger
 *  /user/:userId:
 *    delete:
 *      summary: 删除用户
 *      tags: [User]
 *      operationId: deleteUser
 *      parameters:
 *        - name: userId
 *          in: path
 *          description: 'The userId that needs to be deleted. Use user1 for testing.'
 *          required: true,
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          description: successful operation return deleted user.
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/User'
 *        404:
 *          description: User not found
 */
router.delete(
  "/:userId",
  zodValidationMiddleware.params(userIdDto),
  userController.delUser
)

export default router
