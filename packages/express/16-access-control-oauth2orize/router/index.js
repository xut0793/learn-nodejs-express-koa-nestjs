/*
 * @Date         : 2024-03-18 11:14:30 星期1
 * @Author       : xut
 * @Description  :
 */
/*
 * @Date         : 2024-03-18 11:14:30 星期1
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import fetch from "node-fetch"
import {
  deletePet,
  getAllPet,
  getPetById,
  postPet,
  updatePet,
} from "../controller/pet.controller.js"
import { getAllUser, postUser } from "../controller/user.controller.js"
import { getClients, postClient } from "../controller/client.controller.js"
import {
  localOrBearerAuthenticateMiddleware,
  isLocalAuthenticatedMiddleware,
} from "../authenticate-strategy/index.js"

export const router = Router()

// pets 的 get 即向内部开放，也向第三方开放，所以增加 access_token 的访问认证
router
  .route("/pets")
  .get(localOrBearerAuthenticateMiddleware, getAllPet)
  .post(isLocalAuthenticatedMiddleware, postPet)
router
  .route("/pet/:id")
  .get(isLocalAuthenticatedMiddleware, getPetById)
  .patch(isLocalAuthenticatedMiddleware, updatePet)
  .delete(isLocalAuthenticatedMiddleware, deletePet)

router
  .route("/users")
  .get(isLocalAuthenticatedMiddleware, getAllUser)
  .post(isLocalAuthenticatedMiddleware, postUser)
router
  .route("/clients")
  .get(isLocalAuthenticatedMiddleware, getClients)
  .post(isLocalAuthenticatedMiddleware, postClient)

// 模拟第三应用使用，申请授权访问同意后的回调请求
router.get("/oauth2/redirect", async (req, res) => {
  const code = req.query.code
  const fetchRes = await fetch("http://localhost:9001/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: "123",
      client_secret: "123",
      redirect_uri: "http://localhost:9001/api/oauth2/redirect",
      grant_type: "authorization_code",
      code,
    }),
  })

  const data = await fetchRes.json()
  res.type("html").send(`
    <h1>请求授权成功</h1>
    <p>你可以用此 access_token.token 请求授权范围内的宠物 Get /api/pets </p>
    <p>${JSON.stringify(data)}</p>
  `)
})
