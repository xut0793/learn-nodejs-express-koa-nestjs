# corepack 管理包管理器

## What 它是什么

corepack 是 nodejs 在 v16.9.0 版本开始推出的一个用于管理包管理器的工具。念起来有点拗口。

## Why 为啥需要它

目前 nodejs 生态中，常用的包管理器有 npm / yarn / pnpm，其中 npm 是随 nodejs 默认安装的。如果你想使用不同版本的 npm，或者其他包管理器如 Yarn 和 pnpm，你可能需要手动安装它们。

通常会要求在本地电脑上全局安装，比如

```sh
npm -g install yarn

npm -g install pnpm
```

这三者的包管理器，使用不同的机制管理依赖包，通常在项目开发中，会要求统一包管理器，及其版本号，以避免一些因为依赖包版本而产生的不可预知的莫名其妙的问题。但因为每个人都需要手动安装并维护这些包管理器和正确版本，仅靠口头约定并不容易。

所以这就是 Corepack 的作用，允许你在你的项目中指定所需的包管理器和版本，然后 Corepack 负责自动下载并使用正确的版本。这样，项目中的所有人都将使用完全相同的包管理器，这有助于避免“在我的机器上运行良好”的问题。

## How 如何使用

1. 第一步，启用该功能

由于处于实验状态，目前需要显式地启用 Corepack 才能生效。

```sh
corepack enable
```

这个命令会为 yarn 和 pnpm 设置好 shims（间接层），即使这些工具本身还没有被安装。

2. 第二步，为项目配置需要约束的包管理器和版本

如果你想确保项目中的每个人都在使用 pnpm 6.14.7。你可以在项目的 package.json 文件中添加一个 "packageManager" 字段，像这样：

```json
{
  "name": "my-new-project",
  "version": "1.0.0",
  "packageManager": "pnpm@6.14.7"
}
```

这样的话，当其他任何人要运行该项目时，可以直接使用 `pnpm install` 命令安装依赖，即使当前本地并没有安装 pnpm 的任何版本， Corepack 会检查 package.json 文件并自动下载指定版本的 pnpm 包管理器用来初始化当前项目。

这样，Corepack 提供了一种方便的方式来确保项目成员都在使用确定的、项目所需的包管理器和指定的版本，从而避免版本差异导致的一系列问题。并且在持续集成 CI 环境中，通过配置 corepack 和 packageManager 字段，以及对应包管理器的 lock 文件，不管是在容器环境还是生产环境里，保持项目依赖一致性。

## corepack 命令

可以通过 `corepack -v` 查看最版本是 0.10.0

通过 `corepack -h` 查看当前支持的命令

```
━━━ Corepack - 0.10.0 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$ corepack <command>

━━━ General commands ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

corepack disable [--install-directory #0] ...
  Remove the Corepack shims from the install directory

corepack enable [--install-directory #0] ...
  Add the Corepack shims to the install directories

corepack hydrate [--activate] <fileName>
  Import a package manager into the cache

corepack prepare [--activate] [--all] [--json] [-o,--output] ...
  Generate a package manager archive
```

如果需要升级当前包管理器的版本，可以通过 `corepack prepare ` 命令

```sh
corepack prepare pnpm@7.0.0 --activate
# 目前该命令并不会自动更新 package.json 中的 packageManager 字段的值，最好手动同步，希望未来会自动更新。
```

如果需要切换包管理器及版本，同样的命令

```sh
corepack prepare yarn@1.22.5 --activate
## 上述命令让 Corepack 准备并激活 Yarn 版本 1.22.5
```

如果需要关闭 corepack 功能，可使用 `corepack disable` 命令。

## 不再推荐使用 `npm install -g pnpm` 手动全局安装包管理器

之所以不推荐使用 `npm install -g pnpm` 安装 pnpm 或 Yarn，是因为这种方式可能会导致多个版本的包管理器混乱，并且在系统级别上的权限问题可能会引起一些错误。而 Corepack 的目的就是为了解决这些问题，使得开发者能够轻松切换和使用不同的包管理器，而无需担心这些潜在的问题。

## 即使 corepack 开启，仍然不能限制 npm 的使用

因为 corepack 仍然不能限制使用 npm，所以通常会在 script 中配置 `"preinstall": "npx only-allow pnpm"`来增强限制，只使用 pnpm 安装依赖。
