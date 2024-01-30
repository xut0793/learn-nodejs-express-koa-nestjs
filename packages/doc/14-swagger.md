# Api 文档 Swagger

[OpenAPI 规范 (中文版)](https://openapi.apifox.cn)

OpenAPI 规范（OAS），是定义一个标准的、与具体编程语言无关的 RESTful API 的规范。如果您遵循 OpenAPI 规范来定义您的 API，那么您就可以用文档生成工具来展示您的 API，用代码生成工具来自动生成各种编程语言的服务器端和客户端的代码，用自动测试工具进行测试等等。

OpenAPI 3.0.0（OAS 3.0） 是 OpenAPI 规范的第一个正式版本，在2015年从 Swagger 规范重命名为 OpenAPI 规范。

## express 集成

[Documenting your Express API with Swagger](https://blog.logrocket.com/documenting-express-js-api-swagger/)

### 安装依赖

```sh
pnpm add -D swagger-ui-express swagger-jsdoc
```

- swagger-ui-express 依赖允许从 swagger.json 文件或定义的 options 对象来创建 Swagger UI 页面。
- swagger-jsdoc 可以在代码注释中使用 jsdoc 注释生成 OpenAPI 定义。

### 配置 swagger-ui

为了工程的模块性，将 swagger 抽离放置于 utils 文件夹下面，在工程的 `utils/swaggers.js`。

```js
import { resolve } from "node:path"
import { Router } from "express"
import swaggerDoc from "swagger-jsdoc"
import swaggerUI from "swagger-ui-express"

/**
 * swagger-ui 的配置 options
 */
const options = {
  // swagger ui 页面主题的一些显示信息
  definition: {
    openapi: "3.1.0",
    info: {
      title: "learn express",
      version: "0.0.1",
      description:
        "This is a simple CRUD API application made with Express and documented with Swagger",
      contact: {
        name: "xquant",
        url: "https://bing.com",
        email: "info@email.com",
      },
    },
    servers: [{ url: "http://localhost:9001/api" }],
  },
  // 去哪个路由下收集 swagger 注释
  apis: [resolve(process.cwd(), "./14-swagger/**/*.router.js")],
}

const swaggerSpecs = swaggerDoc(options)

function swaggerJsonMiddleware(req, res) {
  res.setHeader("Content-Type", "application/json")
  res.send(swaggerSpecs)
}

const router = Router()
// 开放相关接口，
router.get("/api/swagger.json", swaggerJsonMiddleware)
// 必须使用 use 注册，使用 swaggerSpec 生成 swagger 文档页面，并开放在指定路由
router.use(
  "/api/docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpecs, { explorer: true })
) // explorer：true，显示顶部搜索栏

export default router
```

然后在 app 中注册。

```js
// app.js
import express from "express"
import router from "./router/index.js"
import swaggerRouter from "./utils/swagger.js"

const app = express()

app.use(express.json())
app.use(swaggerRouter)
app.use("/api", router)

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
```

### 特殊格式的注释

swagger-jsdoc会查找带有 `@swagger` 或 `@openapi` 标签的注释来创建 OpenAPI 定义，并且形成 paths 字段附加到 swaggerSpecs 对象中。

注释的格式类似 yaml，以缩进来分隔字段。

详情的注释模板，可以参考 [editor.swagger.io](https://editor.swagger.io)

主要几类属性：

- headers
- parameters，通过 in 属性区分 query 和 path
- requestBody
- responses

```js
// user.router.js

/**
 *@swagger
 *  /user/:userId:
 *    patch:
 *      summary: 更新用户信息
 *      operationId: updateUser
 *      parameters:
 *        - name: userId
 *          in: path
 *          description: 'The userId that needs to be fetched. Use user1 for testing.'
 *          required: true,
 *          schema:
 *            type: string
 *      requestBody:
 *        description: update user object
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      responses:
 *        200:
 *          description: successful operation return updated user.
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/User'
 *        404:
 *          description: User not found
 */
router.patch(
  "/:userId",
  zodValidationMiddleware.params(userIdDto),
  zodValidationMiddleware.body(updateUserDto),
  userController.updateUser
)
```

对于可重用的配置，比如用户模型，可以通过 `components/schemas/xx` 定义，然后使用 `$ref: '#/components/schemas/xx'`。

```js
/**
 * @swagger
 * components:
 *  securitySchemes:
 *    BearerAuth:
 *      type: http
 *      scheme: bearer
 *  schemas:
 *    User:
 *      type: object
 *      required:
 *        - name
 *        - age
 *        - gender
 *        - birthday
 *      properties:
 *        name:
 *          type: string
 *          description: 账号
 *        age:
 *          type: string
 *          description: 年龄
 *        gender:
 *          type: string
 *          description: 姓别
 *          default: Male
 *          enum:
 *            - Male
 *            - Female
 *        birthday:
 *          type: number
 *          description: 生日
 *        desc:
 *          type: string
 *          description: 描述
 *      example:
 *        name: lisa
 *        age: 18
 *        gender: Female
 *        birthday: 1900-10-1
 *        desc: This is girl
 */
```

如果是 jwt 验证的接口，可以添加如下属性

[swagger authentication](https://swagger.io/docs/specification/authentication/)

```js
/**
 * @swagger
 * components:
 *  securitySchemes:
 *    BearerAuth:
 *      type: http
 *      scheme: bearer
 */
```

然后在各个 router 中也添加属性 security

```js
/**
 * @swagger
 * /user:
 *   get:
 *     summary: 获取所有用户
 *     tags: [User]
 *     operationId: getAllUsers
 *     security:
 *       - BearerAuth:
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
```

## koa 集成

### 安装依赖

```sh
pnpm add -D koa2-swagger-ui swagger-jsdoc
```

### 配置 swagger-ui

在utils 文件中创建 swagger.js

```js
import Router from "@koa/router"
import { resolve } from "node:path"
import swaggerDoc from "swagger-jsdoc"
import { koaSwagger } from "koa2-swagger-ui"

/**
 * swagger-ui 的配置 options
 */
const options = {
  // swagger ui 页面主题的一些显示令牌
  definition: {
    openapi: "3.1.0",
    info: {
      title: "learn koa",
      version: "0.0.1",
      description:
        "This is a simple CRUD API application made with Koa and documented with Swagger",
      contact: {
        name: "xquant",
        url: "https://bing.com",
        email: "info@email.com",
      },
    },
    servers: [{ url: "http://localhost:9002/api" }],
  },
  // 去哪个路由下收集 swagger 注释
  apis: [resolve(process.cwd(), "./14-swagger/**/*.router.js")],
}

const swaggerSpecs = swaggerDoc(options)

async function swaggerJsonMiddleware(ctx) {
  ctx.setHeader("Content-Type", "application/json")
  ctx.body = swaggerSpecs
}

const router = new Router()

// 开放相关所有接口 swagger.json，可用于外部客户端导入，如 postman 等。
router.get("/api/swagger.json", swaggerJsonMiddleware)

// 使用 swaggerSpec 生成 swagger 文档页面，并开放在指定路由
// 区别于 express 必须用 use，这里必须用 get
router.get(
  "/api/docs",
  koaSwagger({
    routerPrefix: false, // 默认 /docs
    swaggerOptions: {
      spec: swaggerSpecs,
    },
  })
)

export default router
```

在 koa 应用中注册 swagger router

```js
import Koa from "koa"
import swaggerRouter from "./utils/swagger.js"
import userRouter from "./user/user.router.js"

const app = new Koa()
app.use(swaggerRouter.routes()).use(swaggerRouter.allowedMethods())
app.use(userRouter.routes()).use(userRouter.allowedMethods())

app.listen(9002, () => {
  console.log(`🚀 Server running at http://localhost:9002`)
})
```

然后在 router 定义文件中填写符合 swagger 规范的注释。同上面 express 一样即可。

上面是使用 yaml 格式注释提取文档。下面这个案例使用类似 nestjs 的装饰器模式提取文档。

[使用装饰器为 Koa APIs 创建Swagger 文档](https://apifox.com/apiskills/create-swagger-docs-for-koa-apis-with-decorators/)

## nestjs 集成

nestjs 提供了 `@nestjs/swagger` 模块来集成 swagger 文档。

### 安装依赖

```sh
pnpm add -D @nestjs/swagger
```

### 初始化文档配置

在 main.ts 中初始化 swagger 文档相关属性的配置，比如标题、描述、版本等属性。

```ts
// main.ts
import { NestFactory } from "@nestjs/core"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = new DocumentBuilder()
    .setTitle("learn nestjs")
    .setDescription(
      "This is a simple CRUD API application made with Koa and documented with Swagger"
    )
    .setVersion("0.0.1")
    .addTag("API")
    .build()

  // document 就是上面 express 中 specs 对象
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("/api/docs", app, document)

  await app.listen(3000)
}
bootstrap()
```

### 特殊的装饰器提取接口定义

`SwaggerModule` 会在路由处理程序中搜索所有 `@Body`、`@Query` 和 `@Param` 装饰器，用来生成 API 文档。基于接口中 DTO 参数的 schema 模型定义，需要在 DTO 类的属性上手动添加装饰器 `@ApiProperty(options)`

其中 options 针对不同的字段类型，有不同的属性设置。

```ts
// options 示例
export class CreateUserDto {
  @ApiProperty({ type: Number })
  age: number

  @ApiProperty({ type: [String] })
  names: string[]

  @ApiProperty({ enum: ["Admin", "Moderator", "User"] })
  role: Role
}
```

`@ApiProperty` 装饰器描述的字段是默认必填的，如果是可选的属性，可以使用 `@ApiPropertyOptional` 装饰器来代替 `@ApiProperty({ required: false })` 的写法。

### 授权

对项目接口定义了授权机制时，在 Swagger 文档中要开启授权，可以使用 `@ApiSecurity` 装饰器，然后选择一种授权模式 `basic / bearer / cookie / oauth2` 等。

```ts
// main.ts

const config = new DocumentBuilder().addSecurity("basic", {
  type: "http",
  scheme: "bearer",
})
// 省略其它配置
```

然后在需要开启授权的控制器模块上添加 `@ApiSecurity('bearer')`

```ts
@ApiSecurity("bearer")
@Controller("user")
export class UserController {}
```

上述是完整的方式，但常用的身份验证技术是内置的，所以提供了对应的简洁写法：

- `const options = new DocumentBuilder().addBasicAuth()` 对应 `@ApiBasicAuth()`
- `const options = new DocumentBuilder().addBearerAuth()` 对应 `@ApiBearerAuth()`
- `const options = new DocumentBuilder().addCookieAuth('optional-session-id')` 对应 `@ApiCookieAuth()`
- `const options = new DocumentBuilder().addOAuth2()` 对应 `@ApiOAuth2(['pets:write'])`

### 自定义统一响应数据结构的 schema

[自定义 ApiResponse](https://nest.nodejs.cn/openapi/operations#%E9%AB%98%E7%BA%A7%EF%BC%9A%E6%B3%9B%E5%9E%8B-apiresponse)

### 常用装饰器

所有可用的 OpenAPI 装饰器都有一个 Api 前缀以区别于核心装饰器。

```
装饰器                    可作用的范围
@ApiSecurity()	         方法/控制器
@ApiBasicAuth()	         方法/控制器
@ApiBearerAuth()	       方法/控制器
@ApiCookieAuth()	       方法/控制器
@ApiOAuth2()	           方法/控制器

@ApiTags()	             方法/控制器 分组
@ApiOperation()	         方法
@ApiHeader()	           方法/控制器
@ApiParam()	             方法
@ApiQuery()	             方法
@ApiBody()	             方法
@ApiConsumes()	         方法/控制器，定义文件上传的请求头，如 multipart/form-data
@ApiResponse()	         方法/控制器

@ApiExcludeController()	     控制器
@ApiExcludeEndpoint()	   方法
@ApiExtension()	         方法
@ApiExtraModels()	       方法/控制器
@ApiProduces()	         方法/控制器

@ApiProperty()	         模型 schema
@ApiPropertyOptional()	 模型 schema
@ApiHideProperty()	     模型 schema
```

示例：

```ts
@Controller("/user")
@ApiTags("user")
@ApiBearerAuth()
class UserController {
  @Get(":id")
  @ApiOperation({ summary: "更新用户" })
  @ApiParam({
    name: "id",
    required: true,
    description: "Should be an id of a user that exists in the database",
    type: Number,
  })
  @ApiBody({ type: updateUserDto })
  @ApiResponse({
    status: 200,
    description: "A user has been successfully fetched",
    type: PostEntity,
  })
  @ApiResponse({
    status: 404,
    description: "A user with given id does not exist.",
  })
  updateUserById(@Param("id") id: string) {
    return this.userService.updateById(+id)
  }
}
```

在构建一些资源 DTO 模型时，通常都存在着相似的字段结构，比如创建资源的 schema 和更新资源的 schema，可能就存在个别字段的区别，或者必填或可选的区别。所以 nestjs 提供了很多实用函数来简化样板代码。基本同 typescript 的类型操作函数。

```
PartialType
PickType
OmitType
IntersectionType
```

示例

```ts
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger"
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator"

/*
 * @Date         : 2023-09-05 23:58:25 星期2
 * @Author       : xut
 * @Description  :
 */
export class CreateUserDto {
  @ApiProperty({ description: "用户账号", example: "xut" })
  @IsString({ message: "登录账号正确类型为字符串 string" })
  @IsNotEmpty({ message: "登录账号不能为空" })
  username: string

  @ApiProperty({
    description: "登录密码",
    example: "123456",
    minLength: 3,
    maxLength: 10,
  })
  @IsString({ message: "登录密码类型错误，正常类型字符串 string" })
  @IsNotEmpty({ message: "登录密码不能为空" })
  @MinLength(3, { message: "密码长度最小为3位" })
  @MaxLength(10, { message: "密码长度最大为10位" })
  password: string

  @ApiPropertyOptional({ description: "刷新 TOKEN" })
  @IsString()
  @IsOptional()
  refreshToken?: string
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```
