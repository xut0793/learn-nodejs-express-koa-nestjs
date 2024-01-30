/*
 * @Date         : 2024-01-23 19:37:58 星期2
 * @Author       : xut
 * @Description  :
 */
export function responseMiddleware(req, res, next) {
  // 重写 res.json 方法，统一响应固定格式
  const originalJson = res.json.bind(res)

  res.json = (data) => {
    originalJson({
      code: 10000,
      msg: "success",
      data,
    })
  }

  next()
}
