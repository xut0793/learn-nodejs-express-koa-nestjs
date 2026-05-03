# release 发布

## 优雅启动：启动预热

### 什么是启动预热？

启动预热就是让刚启动的服务，不直接承担全部的流量，而是让它随着时间的移动慢慢增加调用次数，最终让流量缓和运行一段时间后达到正常水平。

### 如何实现？

如果这类服务是单一部署的，那必然一上线就要承接全部任务。所以通常这类服务肯定是集群部署，然后集群服务的前面还有一层负载均衡的网关服务器控制着流量分配。比如使用 nginx 的负载均衡配置：

```
worker_processes 4;
events{
    worker_connections 1024;
}
http{
    # 参与负载均衡的集群服务，通过 weight 权限的逐增加来缓和流量
    upstream  lb_servers{
        server 111.13.103.91 weight=90;
        server 111.13.179.222 weight=10;
    }
    server{
        listen 8080;
        # 匹配根路由，然后代理到虚拟服务池 lb_servers 网络上。
        location / {
            proxy_pass http://lb_servers;
        }
    }
}
```

nginx 实现负载均衡用到了 proxy_pass 代理模块核心配置, 它将客户端请求代理转发至一组 upstream 虚拟服务池，然后根据指定的负载均衡算法来确定具体由那个服务器处理客户端请求。

> 负载均衡和反向代理的区别是，反向代理由在代理服务器中直接指定特定的服务器去请求资源，而负载均衡中的代理服务器将请求转发给虚拟服务池，再根据指定的负载均衡算法来确定具体由那个服务器处理客户端请求。

上述过程，基本类同于灰度发布的流程，通过 nginx 负载均衡配置流量权重。

## 优雅关闭

### 为什么需要优雅关闭

在我们关闭一个 Node.js 进程时，如果该进程还在进行一些耗时任务，比如说正在处理一些请求，或操作数据库，这时候如果直接关闭进程，可能会导致存量的请求超时导致客户端报错，或者数据库操作数据丢失和异常情况的发生。

所谓优雅退出，就是在退出前，让进程处理完存量请求或数据库操作完等已经在进行的任务的完成后，安全地关闭进程。

### 如何实现优雅关闭

nodejs 应用程序实现优雅退出的关键就是 `server.close()` 方法。当我们使用close关闭一个server时，server会等所有的连接关闭后才会触发close事件。

看下 HTTP server 的 close 方法源码：

```js
Server.prototype.close = function(cb) {
  // 触发回调
  if (typeof cb === 'function') {
    if (!this._handle) {
      this.once('close', function close() {
        cb(new errors.Error('ERR_SERVER_NOT_RUNNING'));
      });
    } else {
      this.once('close', cb);
    }
  }
  // 关闭底层资源
  if (this._handle) {
    this._handle.close();
    this._handle = null;
  }
  // 判断是否需要立刻触发close事件
  this._emitCloseIfDrained();
  return this;
};

// server下的连接都close后触发server的close事件
Server.prototype._emitCloseIfDrained = function() {
  // 还有连接则先不处理
  if (this._handle || this._connections) {
     return;
  }

  const asyncId = this._handle ? this[async_id_symbol] : null;
  nextTick(asyncId, emitCloseNT, this);
};

Socket.prototype._destroy = function(exception, cb) {
  ...
  // socket所属的server
  if (this._server) {
    // server下的连接数减一
    this._server._connections--;
    /*
      是否需要触发server的close事件，
      当所有的连接（socket）都关闭时才触发server的是close事件
    */
    if (this._server._emitCloseIfDrained) {
      this._server._emitCloseIfDrained();
    }
  }
};
```

从源码中我们看到，nodejs会先关闭server对应的handle，所以server不会再接收新的请求了。但是server并没有触发close事件，而是等到所有连接断开后才触发close事件。

这个通知机制给了我们一些思路。我们可以监听 server 的 close 事件，等到触发 close 事件后才退出进程，这个 close 方法来源于 net 模块，因此所有基于 tcp 或者 tcp 上层的服务都可以使用它。

应用程序中实现优雅退出的代码：

```js
const http = require("http")
const server = http.createServer(app).listen(3000)

server.on("close", () => {
  // 在进程退出前执行必要的清理工作，比如断开数据库连接等

  //  退出代码用于表示进程退出的状态，0 表示正常退出，非 0 表示异常退出。
  process.exit(0)
})

// 防止进程提前挂掉，当一个未被捕获的异常（exception）被抛出时触发。
process.on("uncaughtException", () => {})

// 当一个 Promise 被 reject，并且没有对应的 catch() 时触发。
process.on("unhandledRejection", () => {})

// 注册退出事件处理函数
process.on("exit", (code) => {
  server.close()
})

// 用户按下了 Ctrl+C，进程需要火速退出时触发。
process.on("SIGINT", () => {
  server.close()
})

// 进程收到了终止信号
process.on("SIGTERM", () => {
  server.close()
})
```

首先监听SIGINT信号，当我们使用SIGINT信号杀死进程时，首先调用server.close，等到所有的连接断开，触发close时候时，再退出进程。

### cluster 集群方式下的优雅退出

如果应用使用了 cluster 模块的集群方式，那么需要分别处理 master 和 worker 进程下的异常监听

- worker 进程下监听异常退出后，需要 refork
- master 进程下监听异常退出后，需要在退出前 kill 所有 worker，然后 worker 退出前关闭 server。

```js
// 集群中某个 work 异常退出后，会发出 exit 事件，可以在 cluster 上进行监听
cluster.on("exit", (worker, code, signal) => {
  console.log(
    `Worker ${worker.process.pid} died, code: ${code}, signal: ${signal}`,
  )

  // 移除当前子进程内所有事件监听器，避免内存泄漏
  worker.removeAllListeners()

  // refork a new worker
  cluster.fork()
})
```

```js
// master 进程相当于主线程了，可以直接监听系统信号
async function onMasterSignal() {
  const killCalls = Object.keys(cluster.workers).map((id) => {
    const worker = cluster.workers[id]
    const pid = worker.process.pid
    return process.kill(parseInt(pid, 10), signal) // 通过 process.kill 杀死 worker 进程，只会触发 SIGTERM 信号，所以 worker 内只需要监听该信号事件即可
  })
  await Promise.all(killCalls)
}

;["SIGINT", "SIGQUIT", "SIGTERM"].forEach((signal) =>
  // 注意使用一次性事件监听 once
  process.once(signal, onMasterSignal),
)

// worker 监听 master 要求的退出信息
// master 中通过 process.kill 杀死 worker 进程，只会触发 SIGTERM 信号，所以 worker 内只需要监听该信号事件即可
process.on("SIGTERM", () => {
  console.info(`Only graceful shutdown, worker ${process.pid}`)
  close()
})

function close() {
  const worker = cluster.worker
  if (worker) {
    try {
      // 使用 server.close 方法保证 http 连接处理完毕后再退出
      server.close(() => {
        try {
          worker.send({ message: "disconnect" })
          // disconnect 方法让 master 不再向 worker 分配连接
          worker.disconnect()
        } catch (err) {
          console.error(err)
        }
      })
    } catch (err) {
      console.error(err)
    }
  }
}
```

> [graceful-shutdown-example](https://github.com/chay-xu/graceful-shutdown-example/blob/master/graceful.js)

## 延伸知识点

### process.exit 退出代码

- 0：表示进程成功完成。
- 1：表示进程发生了未知的错误。
- 2：表示进程调用了不正确的命令或参数。
- 3：表示进程发生了内部错误或异常。
- 4：表示进程被强制终止。

### 系统信号

系统信号是一种用于操作系统上进程间的通信方式。类比于 node 语境中的事件，一个信号是一个异步的消息通知，它会发送到一个进程后，进程内特定的线程会收到通信某个事件发生了。

总共有60个你可以使用的信号，windows 系统可以在 git bash 中运行命令 `kill -l`，列出了所有信号。

```
$ kill -l

 1) SIGHUP       2) SIGINT       3) SIGQUIT      4) SIGILL       5) SIGTRAP
 6) SIGABRT      7) SIGEMT       8) SIGFPE       9) SIGKILL     10) SIGBUS
11) SIGSEGV     12) SIGSYS      13) SIGPIPE     14) SIGALRM     15) SIGTERM
16) SIGURG      17) SIGSTOP     18) SIGTSTP     19) SIGCONT     20) SIGCHLD
21) SIGTTIN     22) SIGTTOU     23) SIGIO       24) SIGXCPU     25) SIGXFSZ
26) SIGVTALRM   27) SIGPROF     28) SIGWINCH    29) SIGPWR      30) SIGUSR1
31) SIGUSR2     32) SIGRTMIN    33) SIGRTMIN+1  34) SIGRTMIN+2  35) SIGRTMIN+3
36) SIGRTMIN+4  37) SIGRTMIN+5  38) SIGRTMIN+6  39) SIGRTMIN+7  40) SIGRTMIN+8
41) SIGRTMIN+9  42) SIGRTMIN+10 43) SIGRTMIN+11 44) SIGRTMIN+12 45) SIGRTMIN+13
46) SIGRTMIN+14 47) SIGRTMIN+15 48) SIGRTMIN+16 49) SIGRTMAX-15 50) SIGRTMAX-14
51) SIGRTMAX-13 52) SIGRTMAX-12 53) SIGRTMAX-11 54) SIGRTMAX-10 55) SIGRTMAX-9
56) SIGRTMAX-8  57) SIGRTMAX-7  58) SIGRTMAX-6  59) SIGRTMAX-5  60) SIGRTMAX-4
```

但是基本上你只需要知道 SIGTERM(15) 和 SIGKILL(9)。

- SIGINT(2) 用户在终端键入 INTR 字符，（通常是按下 Ctrl+C）发出的中断信号，表示要求进程退出。
- SIGQUIT(3) 用户在终端键入 QUIT 字符，（通常是按下 Ctrl+\）发出的中断信号，类似于 SIGINT 信号，但是会在进程退出前产生 core dump 文件。
- SIGTERM(15) 操作系统发出的一个友好要求终止进程信号，程序可以监听这个信号，清理资源后退出，或者也可以忽略这个信号。
- SIGKILL(9) 立即终止进程，与 SIGTERM 不同，进程不能响应或忽略这个信号，进程会立刻终止。

kill 命令语法 `kill [信号名称或数字选项] pid(s)`，当忽略了中间信号参数，该命令默认触发 `SIGTERM` 信号。

```sh
kill 1049 # 触发 SIGTERM 信号

kill SIGKILL 1049 # 触发 SIGKILL 信号
kill -9 1049 # 同上

kill 1045 1045 # 同时关闭多少进程
```

如果你不知道应用的PID，仅需要运行这个命令：`ps ux`

## 参考链接

- [如何让nodejs服务器优雅地退出](https://cloud.tencent.com/developer/article/1745562)
