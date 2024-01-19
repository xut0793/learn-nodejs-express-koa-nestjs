/*
 * @Date         : 2024-01-11 20:57:47 星期4
 * @Author       : xut
 * @Description  :
 */
// import { createError } from "./http-errors.js"
const createError = require("./http-errors")

const err = createError(401, "test createError", {
  "Content-Type": "application/json",
})
console.log("🚀 ~ err:", err)
