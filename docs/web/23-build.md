# build 生产构建

## 服务器环境准备

1. 选择合适的服务器提供商，现在有很多选择，比如在云厂商上购买服务器，或使用云厂商的容器服务，或者一些独立的服务化平台，如 Now，demo deploy 等。
2. 全新的服务器就是一台全新的电脑，需要安装软件环境，操作系统、nodejs、git、nginx等。基本上跟在本地配置nodejs 环境一样。

## 项目构建前准备

1. 生产环境变量的配置，将 .env.production 文件中将项目所需生产环境变量配置好，包括数据库、redis、jwt key 等。
2. 在构建命令中记得设置 `NODE_ENV` 变量值为 `'production'`。因为很多依赖包会通过该变量的配置转为生产模式下代码，可以提高程序的性能。而且构建工具也会根据此变量删除代码中堆栈跟踪的打印，比如 console.log、debugger 等语句，日志打印类型也会简化。
3. 检查项目内日志系统，在生产环境下，尽量使用最小化日志记录方式，并将日志输出到日志文件或日志系统中。
4. 压缩源码文件，另外对于 web 服务器，对静态资源的响应尽量使用 gzip 或 deflate 的压缩文件输出。
5. 检查项目中一些仅生产的配置，比如 helmet 插件等

## 构建

1. 在上面准备工作检查完成后，可以将代码推送到代码仓库。
2. 登录服务器，通过已安装的 git 从代码仓库克隆项目代码到服务器里 `git clone`
3. 服务器下安装项目依赖，此时注意只安装生产依赖就可以了，通过命令 `npm install --production`

```sh
# 直接使用 npm install，会将项目 package.json 中 dependencies 字段和 devDependencies 字段中的依赖包都下载安装
npm install

# 生产模式下，只会安装 dependencies 字段中的像依赖包
npm install --production

# 只会安装 devDependencies 字段中的依赖，刚好与 --production 相反。
# 以前可能会用 --dev 修饰，但已经被废弃。
npm install --only=dev
```

另外，`npm install` 和 `npm ci` 的区别：

- 直接使用 `npm ci` 安装的项目，必须具有现有的 `package-lock.json` 或 `npm-shrinkwrap.json` 文件。
- 如果 lock 文件中的依赖与 package.json 中的依赖不匹配，`npm ci` 将退出并出错，而不是更新 lock 文件。
- `npm ci` 一次只能安装整个项目依赖，不能使用此命令添加单个依赖。
- 如果 node_modules 已经存在，使用 `npm ci` 在依赖开始安装之前，会自动将其删除。
- `npm ci` 永远不会写入 package.json 文件更新依赖包名称或版本，也不会更新任何 lock 文件。

所以 `npm ci` 通常适合在自动化环境、持续集成环境中进行依赖包全新安装的场景。比如 `NODE_ENV=production npm ci --production`

下一步，对构建生成的 dist 目录下代码，进行部署，启动服务，见下一章 PM2。

## 镜像构建

当选择在容器中执行项目时，需要将项目打包构建成一个可分发的镜像 image 。

- [Nodejs 应用编译构建镜像的提速建议](https://juejin.cn/post/7237134263715315749)
