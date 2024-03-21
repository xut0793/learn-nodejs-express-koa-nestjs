/*
 * @Date         : 2024-03-16 21:12:40 星期6
 * @Author       : xut
 * @Description  :
 */
import { resolve, join } from "node:path"
import express from "express"
import { newEnforcer } from "casbin"

const dirname = resolve(process.cwd(), "./16-access-control-casbin")
const basicModelPath = join(dirname, "./casbin/basic_model.conf")
const basicPolicyPath = join(dirname, "./casbin/basic_policy.csv")
const rbacModelPath = join(dirname, "./casbin/rbac_model.conf")
const rbacPolicyPath = join(dirname, "./casbin/rbac_policy.csv")
const app = express()

app.get("/basic", async (req, res) => {
  // new一个casbin实例，有两个参数，一个是模型描述文件的路径，一个是策略文件的路径
  const e = await newEnforcer(basicModelPath, basicPolicyPath)

  // 这里判断bob这个人是否有data2的写权限
  // 从策略文件中可以看到bob是拥有data2的write权限的，所以这里应该返回为true
  // 策略文件里的内容
  // p, alice, data1, read
  // p, bob, data2, write
  const result = await e.enforce("bob", "data2", "write")

  res.status(200).send(`bob read data2 是否允许：${result}`)
})

app.get("/rbac", async (req, res) => {
  const enforcer = await newEnforcer(rbacModelPath, rbacPolicyPath)
  const result = await enforcer.enforce("tom", "/api/book/1", "delete")
  res.status(200).send(`tom delete /api/book/1 是否允许：${result}`)
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
