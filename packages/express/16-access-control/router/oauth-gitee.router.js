/*
 * @Date         : 2024-02-29 19:19:08 星期4
 * @Author       : xut
 * @Description  :
 */
/*
 * @Date         : 2024-02-29 19:19:08 星期4
 * @Author       : xut
 * @Description  :
 */
import { Router } from "express"
import fetch from "node-fetch"

export const router = Router()

let userInfo = null

/**
 * gitee 授权登录的配置信息
 */
const clientId =
  "150be2cc0fe88fa75e2eca6d3aa292a87d867a6b7c7c4c61fde958fb66295e4d"
const clientSecret =
  "f85748c2309f383b415e8689c26da0651aef8203a13ec2a6429562b471498e72"
const oauthLoginUrl = "https://gitee.com/oauth/token"
const getGithubUserUrl = "https://gitee.com/api/v5/user"

router.get("/redirect/gitee", async (req, res) => {
  try {
    const code = req.query.code
    console.log("🚀 ~ router.get ~ code:", code)

    const oauthParams = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: "http://localhost:8080/api/oauth/redirect/gitee",
    }

    const loginRes = await fetch(oauthLoginUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(oauthParams),
    })

    const data = await loginRes.json()

    /**
     * 返回的访问token对象
    {
      access_token: "1b2498bf76fb1b93804701e7bb81bd1b",
      token_type: "bearer",
      expires_in: 86400,
      refresh_token: "4b0cf7bdbb6f80569175042402367cc213a1e4f187e321d2ab0f87dd2ae66b20",
      scope: "user_info",
      created_at: 1709208723,
    }
     */
    console.log("access_token >>>", data)

    /**
     * 此时两种处理，视业务需求：
     * 1.一次性把业务需要的第三方应用的用户信息在此时用获取的 token 获取过来，保存到业务中。
     * 2. 把第三方的访问 token 信息保存起来，待后续需要时使用，请求第三方应用上的信息。
     */

    const userRes = await fetch(getGithubUserUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `${data.token_type} ${data.access_token}`,
      },
    })

    userInfo = await userRes.json()

    // res.send({ code: "0", msg: "ok", data: userInfo })
    // 此时页面可以增加增加逻辑判断 url 是否有 login 登录信息来判断是否已登录
    // 如果使用 res.render 渲染页面模板，也可以直接把登录信息注入页面，如 res.render('index.html', userInfo)
    res.redirect("http://localhost:8080/static/index.html#oauth?login=true")
  } catch (error) {
    res.status(200).send({ code: "-1", msg: error.message, data: error })
  }
})

/**
 * 此方法好处是不会向客户端暴露 client_id 等信息，但弊端是需要对第三方的 oauth 服务接口支持跨域。
 */
router.get("/login", async (req, res) => {
  res.redirect(
    "https://gitee.com/oauth/authorize?client_id=150be2cc0fe88fa75e2eca6d3aa292a87d867a6b7c7c4c61fde958fb66295e4d&redirect_uri=http://localhost:8080/api/oauth/redirect/gitee&response_type=code"
  )
})
