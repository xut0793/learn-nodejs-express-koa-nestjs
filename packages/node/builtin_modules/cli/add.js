/*
 * @Date         : 2024-05-24 10:37:39 星期5
 * @Author       : xut
 * @Description  :
 */
const args = process.argv.slice(2) // 去除前两个默认参数（node路径和脚本文件路径）
console.log("Passed arguments:", args)

function add(...params) {
  return params.reduce((ret, cur) => ret + parseInt(cur, 10), 0)
}

const ret = add(...args)
console.log("🚀 ~ sum result:", ret)
