/*
 * @Date         : 2024-03-17 17:09:48 星期0
 * @Author       : xut
 * @Description  : 不完整的实现，无法运行，仅作思路参考。有机会阅读 <<OAuth in action >>
 * @Link         :  [如何基于OAuth2授权框架实现授权服务器（使用Node.js设计开发）](https://blog.csdn.net/azurelaker/article/details/120393540)
 */
import {resolve, join} from 'node:path';
import express from 'express';
import { create } from 'express-handlebars';
import {
  initController,
  registerCallback, // 注册
  approveCallback, // 通过
  authorizeCallback, // 授权
  tokenCallback, // 令牌
  getClientConfigCallback,
  deleteClientConfigCallback,
  introspectCallback, // 内省
  revokeCallback, // 撤销
  pubJwkCallback,
} from './controller.js';

const basePath =resolve(process.cwd(), './16-access-control-oauth2-server')
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: false}))


app.use('/', express.static(join(basePath, 'static'))))
const hbs = create({
  extname: "hbs",
  defaultLayout: false,
})
pp.set("views", join(basePath, '/static')) // 配置视图读取的目录
app.set("view engine", "hbs") // 默认情况下，express 会根据文件名后缀读取对应的模板引擎 .pug => pug .hbs => hbs
app.engine("hbs", hbs.engine) // 默认情况下，express 会调用上面注册的 view engine 的值 hbs.__express 作为解析引擎，所以这里覆盖为自定义的 create 的值。

app.get('/authorize', authorizeCallback)
app.post('/approve', approveCallback)
app.post('/token', tokenCallback)
app.post('/introspect', introspectCallback)
app.post('/revoke', revokeCallback)
app.get('/pubjwk', pubJwkCallback)

app.post('/register', registerCallback)
app.get('/register/:clientId', getClientConfigCallback)
app.delete('/register/:clientId', deleteClientConfigCallback)


initController()

const server = app.listen(process.env.PORT || 9001, () => {
  let address = server.address()
  console.log(`🚀 OAuth2 Server running at http://${address.address}:${address.port}`)
})