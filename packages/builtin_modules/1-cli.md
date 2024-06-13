# CLI 命令行

Node.js 具有各种各样的命令行选项。这些选项暴露了内置调试、多种执行脚本的方式、以及其他有用的运行时选项。

## 基本格式

```
node [options] [ script.js ] [arguments]
```

## 模块加载器的选择

现在 Nodejs 兼容 Commonjs 和 ES Module 模块规范，所以内部模块解析时有 Commonjs 模块加载器和 ES 模块加载器。

当以下情况中，将使用 ES 模块加载器：

- 传递了 `--import` 或 `--experimental-default-type=module` 选项启动程序。
- 执行程序是以 `.mjs` 后缀结尾的。
- 执行程序不是以 `.cjs` 后缀结尾，并且最近的 package.json 配置文件中包含 `type: module` 选项时。

其它情形下默认使用 Commonjs 模块加载器。

特殊的，如果传入选项 `--experimental-wasm-modules` 时，可以在程序中调用 `.wasm` 包。

## 选项的前缀 `-` 和 `--` 区别

- `--` 前缀标识命令行选项，如果接受单个值的选项（例如 `--max-http-header-size`）被多次传入，则使用最后传入的值。并且通过命令行传入的选项会覆盖通过 NODE_OPTIONS 环境变量传入的选项。
- `-`前缀标识命令行选项别名，例如 `node -v` 同 `node --version`。
- 命令行选项如果有多个单词，允许用破折号 `-` 或下划线 `_` 分隔单词。例如，`--pending-deprecation` 等价于 `--pending_deprecation`，建议用下划线分隔单词，以区短橫线的意义。
- `--` 标识用于指示 node 选项的结束，后续内容将作为参数传给脚本。如果在此之前没有提供脚本文件名，则下一个参数用作脚本文件名。但现在紧跟脚本文件名后传入的内容都作为脚本参数。 比如 `node sum.js -- 1 2`，此时 `--` 也会作为脚本参数传入，所以最好不再使用双横线。直接 `node sum.js 1 2`

## 常用命令选项

```sh
# 开启 repl
node

# 当前版本
node -v，--version

# 帮助
node -h, --help

# 不执行脚本，仅作请求检查
node -c, --check

# 加载环境变量，node@20.6.0 以上版本支持，传递多个 --env-file 参数。后续文件将覆盖先前文件中定义的预先存在的变量。
node --env-file=.env --env-file=.development.env index.js

# node@22.0.0 以上版本支持，执行 package.json 中 script 对应的命令,-- 之后的任何参数都将附加到脚本中
node --run dev -- --verbose

# node@20.0.0 以上版本稳定支持，启动测试运行器
node --test
node --test-only
node --test-name-pattern

# node@22.0.0 以上版本稳定支持，监视文件中的更改会导致 Node.js 进程重新启动
node --watch index.js
node --watch-path=./src --watch-path=./tests index.js # 指定监视变动的文件目录
```
