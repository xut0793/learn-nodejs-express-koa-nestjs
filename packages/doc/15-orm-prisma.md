# ORM Prisma

prisma 主要为分为三个模块：

- prisma cli
- schema.prisma
- @prisma/client

## 安装依赖

```sh
pnpm add prisma @prisma/client
```

## 集成

集成分为两种情况：

- 已存在一个数据库表结构

```sh
# 1. 这会在当前命令执行目录中创建 prisma 目录，并新增了 schema.prisma 文件和 .env 文件。
#    然后在 schema.prisma 中完善 datasource 中的  provider 填写使用的数据库类型，并且在 .env 文件填写对应的 DATABASE_URL
pnpm dlx prisma init

# 2. 同步一个已有的数据库表结构到当前 schema.prisma 中
pnpm dlx prisma db pull

# 3. 生成本地客户端 @prisma/client 可调用的数据模型
pnm dlx prisma generate

```

- 没有数据库表结构

```sh
# 1. 这会在当前命令执行目录中创建 prisma 目录，并新增了 schema.prisma 文件和 .env 文件。
#    然后在 schema.prisma 中完善 datasource 中的  provider 填写使用的数据库类型，并且在 .env 文件填写对应的 DATABASE_URL
pnpm dlx prisma init

# 2. 手动建模，在 schema.prisma 中手动添加对应和模型数据 model

# 3. 迁移模型数据到数据库中
pnpm dlx prisma migrate dev --name init

# 4. prisma generate命令会读取 schema.prisma，并在node_modules/@prisma/client中更新生成本地客户端 @prisma/client 可调用的数据模型
pnm dlx prisma generate

```

完成以上步骤后，业务代码中使用 PrismaClient 实例调用 CURD 逻辑

```js
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

// 省略其它逻辑
const allUsers = await prisma.user.findMany()
```

在开发环境中，如果更改了 schema.prisma 中的数据模型，则每次更改，都需要再调用 `pnpm dlx prisma db push` 更新到数据库中，以及 `pnpm dlx prisma generate` 更新本地数据模型。

对线上环境，可以执行一次 `pnpm dlx prisma migrate` 生成一次数据库迁移数据。

## api

关于 schema.prisma 文档编写规范，@prisma/client 客户端提供可用的api方法，以及 prisma cli 命令，可以查看 [Prisma 中文网站](https://prisma.nodejs.cn/reference)

## nestjs

nestjs 除了上述步骤外，需要将 PrismaClient 封装成一个全局可用模块。

```sh
nestjs g mo prisma
nestjs g s prisma
```

`Prisma.service.ts`

```ts
// src/common/module/prisma/prisma.service.ts

import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect()
  }
  async onModuleDestroy() {
    await this.$disconnect()
  }
}
```

`Prisma.module.ts`

```ts
// src/common/module/prisma/prisma.controller.ts

import { Module } from "@nestjs/common"
import { PrismaService } from "./prisma.service"

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

在 app.module.ts 中，全局注册

```ts
import { PrismaModule } from "./common/module/prisma/prisma.module"

@Global()
@Module({
  imports: [
    // 省略其它代码
    PrismaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

业务模块中使用

```ts
import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../common/module/prisma/prisma.service"
import { CreateUserDto } from "./dto/create-user.dto"
import { UpdateUserDto } from "./dto/update-user.dto"

@Injectable()
export class PrismaTestService {
  constructor(private readonly prismaService: PrismaService) {}
  findAll() {
    return this.prismaService.user.findMany()
  }

  create(createUserDto: CreateUserDto) {
    return this.prismaService.user.create({ data: createUserDto })
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prismaService.user.update({
      data: updateUserDto,
      where: { id },
    })
  }

  remove(id: number) {
    return this.prismaService.user.delete({ where: { id } })
  }
}
```

## 问题

1. 登录 MySQL 报错：ERROR 2003 (HY000): Can‘t connect to MySQL server on ‘localhost‘ (10061)

```
适用：windows MySQL 8.0 以上版本
解决方案：
1. 首先以管理员身份启动 cmd
2. 然后输入 mysqld --remove mysql
3. 进入 MySQL 安装目录中找到 data 文件夹，清空其中全部文件。如果就建立一个空文件夹
4. 重新注册服务 mysqld -install
5. 重新初始化服务 mysqld --initialize
6. 完成初始化后，在 data 文件中找到以 .err 结尾的文件，打开会看到 A temporary password is generated for root@localhost: yC)+M9Q4Tvlq，冒号空格后面的 yC)+M9Q4Tvlq 就是初始密码
7. 重启 MySQL 服务，在 cmd 中输入 net start mysql，启动成功
8. 用初始密码登录 mysql -uroot -p
9. 更改密码，比如123456 ALTER user 'root'@'localhost' IDENTIFIED BY '123456';
10. 刷新配置 FLUSH PRIVILEGES;
```
