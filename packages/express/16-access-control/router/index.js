import { Router } from "express"
import { router as accountRouter } from "./account.router.js"
import { router as mailRouter } from "./mail.router.js"
import { router as phoneRouter } from "./phone.router.js"
import { router as oauthRouter } from "./oauth-gitee.router.js"
import { router as cookieRouter } from "./cookie.router.js"
import { router as sessionRouter } from "./session.router.js"
import { router as basicRouter } from "./http-basic.router.js"
import { router as digestRouter } from "./http-digest.router.js"
import { router as bearerRouter } from "./http-bearer.router.js"

const router = Router()

router.use("/account", accountRouter)
router.use("/mail", mailRouter)
router.use("/phone", phoneRouter)
router.use("/oauth", oauthRouter)
router.use("/authentication/cookie", cookieRouter)
router.use("/authentication/session", sessionRouter)
router.use("/authentication/basic", basicRouter)
router.use("/authentication/digest", digestRouter)
router.use("/authentication/bearer", bearerRouter)

export default router
