/*
 * @Date         : 2024-03-02 16:31:48 星期6
 * @Author       : xut
 * @Description  :
 */
import { randomBytes, randomInt } from "node:crypto"

/**
 * 生成随机字符串
 *
 * 利用十六进制表示字符串。所以字符串长度  len * 4 / 8 = size，即 randomBytes(size) 的参数，表示要生成的字节数
 * 所以 len 最好是8的倍数
 * @param {number} len 字符串长度
 * @return {string}
 */
export function genRandomString(len) {
  const size = Math.floor((len * 4) / 8)
  return randomBytes(size).toString("hex")
}

/**
 * 生成指定范围内随机整数
 * @param {number} min 最小值
 * @param {number} max 最大值
 */
export function genRandomInt(min, max) {
  return randomInt(min, max)
}
