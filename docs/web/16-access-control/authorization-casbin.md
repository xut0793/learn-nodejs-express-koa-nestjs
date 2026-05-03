# Casbin 使用

[Casbin](https://casbin.org/zh/) 是一个强大的、高效的开源访问控制框架，其权限管理机制支持多种访问控制模型(ACL,RBAC,ABAC等)。Casbin 在 node 环境的实现依赖包 node-casbin。

Casbin 的核心是两个配置文件和一个执行器：

- 两个配置文件
  - model.conf 存储访问模型
  - policy.csv 存储具体的权限配置，可以以文件形式或对应数据库的适配器形式。
- enforcer 执行器，创建执行器时需要传入model和policy。

Node-Casbin 的主要特性包括：

- 支持自定义请求的格式，默认的请求格式为{subject, object, action}；
- 具有访问控制模型 model 和策略 policy 两个核心概念；
- 支持 RBAC 中的多层角色继承，不止主体可以有角色，资源也可以具有角色；
- 支持超级用户，如 root 或 Administrator，超级用户可以不受授权策略的约束访问任意资源；
- 支持多种内置的操作符，方便对路径式的资源进行管理，如 keyMatch 支持 /foo/bar 可以映射到 /foo\*。或者 keyMatch2 支持 /foo/:id 可以映射到 /foo/1；

Node-Casbin 不做的事情：

- 身份认证 authentication （即验证用户的用户名、密码），Node-Casbin 只负责访问控制。应该有其他专门的组件负责身份认证，如 Passport 等，然后由 Node-Casbin 进行访问控制，二者是相互配合的关系；
- 管理用户列表或角色列表。Node-Casbin 认为由项目自身来管理用户、角色列表更为合适，Node-Casbin 假设所有策略和请求中出现的用户、角色、资源都是合法有效的。

casbin 支持的权限模型

- ACL (访问控制列表)
- 带有超级用户的ACL
- 无用户的ACL：这对于没有身份验证或用户登录的系统特别有用。
- 无资源的ACL：在某些情况下，目标是一种资源类型，而不是单个资源。 可以使用像"write-article"和"read-log"这样的权限。 这并不控制对特定文章或日志的访问。
- RBAC (基于角色的访问控制)
- 带有资源角色的RBAC：用户和资源同时可以拥有角色（或组）。
- 带有域/租户的RBAC：用户可以为不同的域/租户拥有不同的角色集。
- ABAC (基于属性的访问控制)：可以使用类似"resource.Owner"的语法糖来获取资源的属性。
- RESTful：支持像"/res/\*"，"/res/:id"这样的路径，以及像"GET"，"POST"，"PUT"，"DELETE"这样的HTTP方法。
- 拒绝优先：同时支持允许和拒绝授权，其中拒绝优先于允许。
- 优先级：策略规则可以设置优先级，类似于防火墙规则。

[casbin 支持不同模型和策略的示例](https://casbin.org/zh/docs/supported-models)

## Model 访问控制模型

[访问模型的语法1](https://casbin.org/zh/docs/how-it-works)
[访问模型的语法2](https://casbin.org/zh/docs/syntax-for-models)

```conf
# subject 主体（被访问的实体）
# object 对象（被访问的资源）
# action 动作（访问方式）
# domain 域或组
[request_definition]
# 定义了e.Enforce(args)函数中对应的参数
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
# g 代是一种 RBAC 模型，如 RBAC0，用户和角色的关系。
# 当在匹配器中使用时 g(r.sub, p.sub) 意味着请求中的 sub 应该在策略中拥有角色 user。
g = _, _

[policy_effect]
# 这是固定的，内置可选的策略有：
# 1. some(where (p.eft == allow)) 如果有匹配到一条 allow策略规则，最终效果是allow（也称为允许覆盖）
# 2. !some(where (p.eft == deny)) 如果没有匹配的deny策略规则，最终的效果是allow（也称为deny-override）
# 3. some(where (p.eft == allow)) && !some(where (p.eft == deny)) 必须至少有一个匹配的allow策略规则，并且不能有任何匹配的deny策略规则。 因此，以这种方式，支持允许和拒绝授权，并且拒绝优先。
# 4. priority(p.eft) || deny
# 5. subjectPriority(p.eft)
e = some(where (p.eft == allow))

[matchers]
# [匹配器]是策略匹配器的定义。 匹配器是定义如何根据请求评估策略规则的表达式。
# 表达式的顺序可以极大地影响性能。
# 支持唯一一个带有文本名称的运算符 in，检查右侧的数组，看是否包含等于左侧值的值，比如 m = r.sub.name in (r.obj.admins)
m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && r.emthod == p.act || r.sub == "root"
```

## Policy 策略

策略最常见的形式是 csv 文件和数据库适配器的形式。

[policy-storage](https://casbin.org/zh/docs/policy-storage)
[Adapters](https://casbin.org/zh/docs/adapters)

### csv 文件介绍

CSV（Comma-Separated Values，逗号分隔的值）是一种简单、实用的文件格式，用于存储和表示包括文本、数值等各种类型的数据。CSV 文件通常以 .csv 作为文件扩展名。这种文件格式的一个显著特点是：文件内的数据以逗号 , 分隔，呈现一个表格形式。

CSV 文件的结构相对简单，通常由以下组成：

- 每行表示一条记录：CSV 文件中的每一行代表一条记录，相当于数据库中的一行数据。
- 逗号分隔：每行数据中，使用逗号 , 进行数据分隔，代表不同的数据。
- 引号包围：当数据单元格中的内容含有逗号时，为避免混淆，需要引号 (单引号 ' 或双引号 ")将这个数据包围起来，防止误认为是两个不同数据。

```csv
姓名,年龄,性别
张三,25,男
李四,28,男
王五,22,女
```

上面的例子中，CSV 文件包含三列（姓名、年龄和性别），每行都由逗号 , 分隔的三个数据项组成。

CSV 文件已广泛应用于存储、传输和编辑数据，主要优势是简单易用、兼容性高和易于数据交换等特点。

- 简单易懂：CSV 文件基于纯文本格式，因此可以使用任何文本编辑器(如Notepad)轻松打开和编辑。
- 数据兼容性：CSV 文件中的数据可以很容易地跨平台进行传输和处理，任何具有 CSV 处理功能的软件(如Microsoft Excel、Google Sheets、甚至编程语言库)都能处理该类型的文件。
- 资源占用低：CSV 文件以纯文本形式存储数据，其体积相对较小，便于节省存储空间。

## Enforcer 执行器

[执行器 api](https://casbin.org/zh/docs/api-overview)

## 库

- [node-casbin，casbin 在node端的实现]()
- [nest-authz，在nestjs中使用 casbin](https://github.com/nawbc/nest-authz/tree/master)
- [nest-authz-example 例子](https://github.com/node-casbin/nest-authz-example/blob/master)
- [casbin.js 在前端使用]()
- [vue-authz 在前端框架 vue 中集成 casbin.js]()

### nest-authz 使用

1. 安装 `pnpm add nest-authz`
2. 配置 model 和 policy
3. 注册模块 AuthZModule

```js
// 第一种，简单本地文件配置
AuthZModule.register({
  model: 'rbac.model.conf',
  policy: 'rbac.policy.csv',
  usernameFromContext: (ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user && req.user.uid;
  },
})

// 第二种，策略对接到数据库，集成到对应的 ORM 中，比如 TypeORMAdapter
AuthZModule.register({
  model: 'model.conf',
  policy: TypeORMAdapter.newAdapter({
    name: 'casbin',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'password',
    database: 'nestdb'
  }),
  usernameFromContext: (ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user && request.user.username;
  }
})

// 第三种，与 configModule 的集成
@Module({
  imports: [
    ConfigModule,
    AuthZModule.register({
      imports: [ConfigModule],
      enforcerProvider: {
        provide: AUTHZ_ENFORCER,
        useFactory: async (configSrv: ConfigService) => {
          const config = await configSrv.getAuthConfig();
          return casbin.newEnforcer(config.model, config.policy); // 这里 config.policy 在 ConfigService 中配置，可以去接本地配置文件，也可以为数据库的适配器。
        },
        inject: [ConfigService],
      },
      usernameFromContext: (ctx) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user && request.user.username;
      }
    }),
  ],
  controllers: [AppController],
  providers: [AppService]
})
```

4. 设置访问权限 @UsePermission
   在控制器中设置接口需要的访问权限

```ts
  @Get('users')
  @UsePermissions({
    action: AuthActionVerb.READ, // AuthActionVerb 中枚举了 CREATE UPDATE DELETE READ。也可以自定义检举 HttpMethod 对应 GET POST UPDATE DELETE等。
    resource: Resource.UserList, // 对应接口
    possession: AuthPossession.ANY, // any own own|any
  })
  async findAllUsers() {}
```

5. 设置访问权限守卫 AuthZGuard

```ts
  @Get('users')
  @UseGuards(AuthZGuard)
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.UserList,
    possession: AuthPossession.ANY,
  })
  async findAllUsers() {}
```

6. 对用户、角色、资源的权限关系设置

虽然 @UsePermissions 装饰器配合 AuthZGuard 可以拦截用户的权限访问。另一种场景在对用户绑定角色、角色绑定资源操作的服务中，需要操作 policy 配置，需要使用 AuthzRBACService 或 AuthzManagementService 包装器来操作 casbin.js 接口。

- AuthzManagementService 可以调用 casbin.js 中获取主体、资源、操作等基本接口，如 getAllSubjects / getAllActions / getAllObjects 等，以及对策略的增删改查 getPolicy / addPolicy / updatePolicy / removePolicy 等。
- AuthzRBACService 可以调用基于角色管理的权限配置 getRolesForUser / hasRoleForUser / addRoleForUser 等。

```ts
import { AuthZRBACService } from "nest-authz"

@Injectable()
export class RoleService implements CoreRBACRole {
  constructor(
    private readonly userSrv: UserService,
    private readonly authzService: AuthZRBACService
  ) {}
  async assignedUsers(role: string): Promise<string[]> {
    const isRoleExists = await this.exists(role)
    if (!isRoleExists) {
      throw new NotFoundException(`The role ${role} not found`)
    }

    return this.authzService.getUsersForRole(role)
  }

  async rolePermissions(role: string): Promise<string[][]> {
    const isRoleExists = await this.exists(role)
    if (!isRoleExists) {
      throw new NotFoundException(`The role ${role} not found`)
    }

    return this.authzService.getPermissionsForUser(role)
  }
  // 等等
}
```
