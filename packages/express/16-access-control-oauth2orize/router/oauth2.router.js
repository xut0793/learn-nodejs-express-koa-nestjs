/*
 * @Date         : 2024-03-18 16:38:46 星期1
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import {
  authorization,
  decision,
  getToken,
} from "../controller/oauth2.controller.js"
import {
  clientAuthenticate,
  isLocalAuthenticatedMiddleware,
} from "../authenticate-strategy/index.js"

export const router = Router()

// 第三方应用授权访问接口，前提是已登录当前应用
router
  .route("/authorize")
  .get(isLocalAuthenticatedMiddleware, authorization) // 启动授权过程
  .post(isLocalAuthenticatedMiddleware, decision) // 用户决定授权后的调整

// 第三应用提供的回调地址的服务器逻辑中调用，必须传入客户端 client_id 和 client_secret，这里用 clientAuthenticate 来对必填的 client_id 和 client_secret 参数进行校验。
// 另一种方法，是将校验客户端凭证的逻辑与 code 的校验逻辑，一起放在 getToken 中。
router.route("/token").post(clientAuthenticate, getToken) // 用 code 换取 token
