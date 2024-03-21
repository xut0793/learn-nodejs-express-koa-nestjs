/*
 * @Date         : 2024-03-18 17:31:22 星期1
 * @Author       : xut
 * @Description  :
 */
export {
  localAuthenticate,
  isLocalAuthenticatedMiddleware,
} from "./local.strategy.js"
export { clientAuthenticate } from "./client.strategy.js"
import { bearerAuthenticate } from "./token.strategy.js"

export const localOrBearerAuthenticateMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  return bearerAuthenticate(req, res, next)
}
