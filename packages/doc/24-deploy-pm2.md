# PM2

当我们使用 `node test.js` 执行时，如果运行中出现未捕获的错误时，执行进程就会关闭，程序停止运行，需要手动重新开启。在生产环境运维人中不可能时刻都盯着程序运行，所以需要一种软件帮我们守护程序，当程序报错停止运行时，自动重新运行程序。这就是 PM2 的意义。

PM2 是一个守护进程管理工具，帮助您管理和守护您的应用程序。[PM2 中文文档](https://pm2.fenxianglu.cn/docs/start/)

## 基本使用

```sh
# 全局安装
pnpm add -g pm2@latest
```

启动应用

```sh
pm2 start main.js
```

常用的命令列表

```sh
# Fork 模式
pm2 start app.js --name my-api    # 程序名

# Cluster 模式
pm2 start app.js -i 0             # 将根据可用的 CPU 使用 LB 启动最大进程
pm2 start app.js -i max           # 和上面一样，但是不推荐使用。
pm2 scale app +3                  # Scales `app` up by 3 workers
pm2 scale app 2                   # Scales `app` up or down to 2 workers total

# Listing

pm2 list                          # 显示所有进程状态
pm2 jlist                         # 以原始JSON格式打印进程列表
pm2 prettylist                    # 以美化的JSON格式打印进程列表

pm2 describe [process_id]         # 显示指定进程的所有信息
pm2 show [id|name]                # 查看指定应用程序数据

pm2 monit                         # 监控所有进程

# Actions

pm2 restart [process_id]          # 重启指定进程id
pm2 restart [name]                # 重启指定名称的进程
pm2 restart all                   # 重启所有进程

pm2 stop [process_id]             # 停止指定进程id
pm2 stop [name]                   # 停止指定进程id
pm2 stop all                      # 停止所有进程


pm2 delete [process_id]           # 将进程从pm2列表中删除
pm2 delete [name]                 # 将进程从pm2列表中删除
pm2 delete all                    # 将从pm2列表中删除所有进程

# 与restart不同，restart会杀死进程并重启，而reload实现了0秒停机时间重新加载；但是需要注意的是该方式可能会报错，例如在部署next应用时如果使用reload则会报端口号被占用的错误，所以reload之前经常需要先停机（pm2 stop）,但是这样的话和restart一样了,pm2 stop + pm2 reload = pm2 restart
pm2 reload all                    # 将 0s 宕机机时间重新加载（对于 NETWORKED 应用程序）

# Logs
# 默认日志文件存放于 $home/.pm2/logs
# 可以通过安装 pm2-logrotate 插件设置使用有限的磁盘空间自动回滚并保留所有日志文件。
# 也可以通过配置文件，定义 error_file out_file log_date_format 等属性配置日志文件

pm2 logs [--raw]                # 在流中显示所有进程日志
pm2 flush                       # 清空所有日志文件
pm2 reloadLogs                  # 重新加载所有日志

#
pm2 puls

# Misc

pm2 reset <process>             # 重置元数据(重启时间…)
pm2 updatePM2                   # 在内存中更新pm2
pm2 ping                        # 确保pm2守护进程已经启动
pm2 sendSignal SIGUSR2 my-app   # 向脚本发送系统信号
pm2 start app.js --no-daemon
pm2 start app.js --no-vizion
pm2 start app.js --no-autorestart
```

## 配置文件

PM2 除了可以通过命令行管理应用，也可以通过配置文件来管理应用程序。

[PM2 configuration](https://pm2.fenxianglu.cn/docs/general/configuration-file)

[cluster 模式以及 PM2 工具的原理介绍](https://lagou.feishu.cn/docs/doccnyq5KSbMLfuu9y4bJVMKCKb)文章写的非常好，如果想了解PM2更多的原理，建议看一下这篇文章，其中总结出了一套最佳实战配置：

```js
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "nodejs-column", // 启动进程名
      script: "./app.js", // 启动文件
      instances: 2, // 启动进程数
      exec_mode: "cluster", // 多进程多实例
      env_development: {
        NODE_ENV: "development",
        watch: true, // 开发环境使用 true，其他必须设置为 false
      },
      env_testing: {
        NODE_ENV: "testing",
        watch: false, // 开发环境使用 true，其他必须设置为 false
      },
      env_production: {
        NODE_ENV: "production",
        watch: false, // 开发环境使用 true，其他必须设置为 false
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "~/data/err.log", // 错误日志文件，必须设置在项目外的目录，这里为了测试
      out_file: "~/data/info.log", //  流水日志，包括 console.log 日志，必须设置在项目外的目录，这里为了测试
      max_restarts: 10,
    },
  ],
}
```

## 重启策略

默认情况下， 应用程序会在自动退出、事件循环为空 (node.js) 或应用程序崩溃时自动重启。但您也可以配置额外的重启策略，例如：

- 在指定的 CRON 时间重启应用程序
- 文件更改后重启应用程序
- 当应用程序达到内存阈值时重启
- 延迟启动和自动重启
- 默认情况下，在崩溃或退出时禁用自动重启（应用程序始终使用 PM2 重启）
- 在特定的指数增长时间自动重启应用程序

具体配置参数见 [PM2 重启策略](https://pm2.fenxianglu.cn/docs/general/restart-strategies)

## PM2 原理

- [cluster 模式以及 PM2 工具的原理介绍](https://lagou.feishu.cn/docs/doccnyq5KSbMLfuu9y4bJVMKCKb)
- [Node的Cluster模块和PM2 的原理介绍](https://juejin.cn/post/6983596738451882014)
