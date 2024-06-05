/*
 * @Date         : 2024-06-03 09:16:13 星期1
 * @Author       : xut
 * @Description  :
 */
import v8 from "node:v8"

const stat = v8.getHeapStatistics()

const converted = Object.entries(stat).reduce((ret, cur) => {
  ret[cur[0]] = cur[1] / 1024 / 1024 // M
  return ret
}, {})
console.log("🚀 ~ converted:", converted)
