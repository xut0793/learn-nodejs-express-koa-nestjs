# OS 操作系统

OS 模块提供了方法和属性，来获取目前主机操作系统级别的相关信息。

- `os.EOL` 获取当前操作系统的默认行尾符或换行符，EOL代表“End Of Line”，在不同的操作系统中，行尾符可能会有所不同。例如，在 Unix/Linux 系统中通常使用 `\n` 作为换行符，而 Windows 系统中通常使用 `\r\n`。
- `os.constants` 提供的操作系统相关常量的集合，包括操作系统的错误码（errno）、信号常量（signals）、优先级常量（priority）、文件系统标志（fs）、libuv 常量、dlopen 常量等。
- `os.devNull` 返回一个系统特定的路径，指向一个特殊的文件，这个文件称为“空设备”，不同的操作系统对空设备有不同的名称和用途。
- `os.arch()` 获取主机 cpu 系统架构，可能的输出：'ia32'（ 32 位的 Intel 或 AMD 处理器，现在不太常见，基本被 ’x64‘ 替代），'x64'(PC常用的 64 位的 Intel 或 AMD 处理器), 'arm'(移动设备常用处理器架构), 'arm64'（是 ARM 架构的 64 位版本）。
- `os.machine()` 返回一个字符串，表示你的计算机的架构。
- `os.hostname()` 获取当前机器的主机名称，主机名是指你的电脑在网络中的名字，通常是用来识别网络上各个不同的设备的。
- `os.platform()` 获取系统类型，可能的输出：'aix'：代表 IBM AIX 平台。'darwin'：代表 macOS 和 iOS 操作系统。'freebsd'：代表 FreeBSD 操作系统。'linux'：代表 Linux 操作系统。'openbsd'：代表 OpenBSD 操作系统。'sunos'：代表 SunOS 操作系统。'win32'：尽管名称中包含“32”，但它指的是 Microsoft Windows 系统，无论是 32 位还是 64 位。
- `os.cpus()` 输出关于系统CPU的详细信息，包括型号、速度（以MHz计）和每个核心的时间统计。
- `os.totalmem()` 获取系统的总内存，单位字节 byte
- `os.freemem()` 获取系统的空闲内存，单位字节 byte
- `os.homedir()` 获取当前用户的主目录，在不同的操作系统中，每个用户都有一个属于自己的文件夹，通常用来存放个人文档、设置、程序等。windows 系统通常是 `c:\Users\用户名`，linux/mac 通常是 `/home/用户名`。
- `os.tmpdir()` 获取操作系统的默认临时文件目录的路径。不同的操作系统有不同的临时文件目录，比如 Windows 上可能是 C:\Windows\Temp，而在 Linux 或 macOS 上通常是 /tmp。这个目录用来存放那些不需要永久保存的文件，比如临时数据处理过程中生成的中间文件。
- `os.availableParallelism()` 这个函数的主要作用是让你知道你的计算机在不增加硬件延迟的情况下，能够同时执行多少个操作或者任务。简单来说，它能告诉你你的电脑有多少个“工作单位”可以用来并行处理任务。
- `os.endianness()` 返回一个字符串，表明 Node.js 进程运行的操作系统的字节序，输出可能是 'LE' 或 'BE'
- `os.getPriority([pid])` 用于获取指定进程pid的调度优先级，优先级越高的进程会被操作系统更优先地处理。返回一个数组，代表进程的优先级。
- `os.loadavg()` 获取系统平均负载的函数，系统平均负载是指在特定时间间隔内，系统处于运行状态或不可中断睡眠状态的平均进程数。简单来说，它表明了系统工作的忙碌程度。平均负载有三个值，分别对应过去 1 分钟、5 分钟和 15 分钟的平均负载。通常用于系统的健康监测。
- `os.networkInterfaces()` 获取主机(os)上网络接口的详细信息。简单来说，它可以让你知道你的电脑或服务器上有哪些网络接口，比如 Wi-Fi、以太网等，以及这些网络接口的一些详细信息，包括 IP 地址、MAC 地址等。
- `os.release()` 返回一个字符串，表示你的操作系统的版本。
- `os.setPriority([pid, ]priority)` 它允许你设置给定进程的调度优先级。这个功能对于控制和管理不同进程所应该获取的 CPU 时间很有用，尤其是在多任务操作系统中，可以确保关键任务能够得到足够的处理资源。
- `os.type()` 返回一个字符串，表示操作系统的名称。不同的操作系统上，你可能会看到如下的一些返回值：在 Windows 系统上，它返回 "Windows_NT"。在 Linux 系统上，它返回 "Linux"。在 macOS 系统上，它返回 "Darwin"（macOS 基于 Darwin 操作系统）
- `os.uptime()` 获取系统的正常运行时间，即从最后一次启动到现在系统已经持续运行了多少秒。它作为系统稳定性的一个指标，在监控系统或进行故障排查时，了解系统的运行时间是非常有价值的。
- `os.userInfo([options])` 获取当前操作系统上的当前用户信息的，通常包括用户名、用户 ID、主目录路径和默认 shell 等。可选的参数允许你指定想要以何种字符串编码返回用户信息，比如`options = {encoding: 'utf8'}`。
- `os.version()` 获取操作系统的内核版本信息，返回一个字符串，其中包含了关于操作系统内核的详细版本信息，比如内核的版本号、构建日期和构建类型等。

> 以下内容引用自 [樱桃茶 nodejs 平替文档](https://doc.cherrychat.org/node/node%E6%96%87%E6%A1%A3/OS.html)

## `os.devNull`

ode.js 的os.devNull是一个属性，它提供了一个系统特定的路径，指向一个特殊的文件，这个文件被称为"空设备"。

在不同的操作系统中，空设备有不同的名称和用途：

- 在 Unix 和类 Unix 系统（比如 Linux 和 macOS）中，这个空设备通常被称为/dev/null。
- 在 Windows 系统中，这个空设备被称为nul。

os.devNull属性的作用就是根据你运行 Node.js 的操作系统，自动给出对应的空设备路径。使用这个空设备可以有很多实际的用处，比如：

- 忽略不需要的输出

如果你有一个程序产生了很多输出，但你不想要这些输出显示在终端或者记录到文件中，你可以将输出重定向到os.devNull。例如，在 Node.js 的子进程模块（child_process）中，我们可以这样做：

```js
const { spawn } = require("child_process")
const { devNull } = require("os")

// 假设我们正在启动一个产生输出的子进程
const subprocess = spawn("some-command", {
  stdio: ["ignore", devNull, devNull], // stdin忽略，stdout和stderr都重定向到空设备
})

// 这样，some-command命令产生的所有标准输出（stdout）和标准错误（stderr）都会被丢弃，不会显示在终端中，也不会影响程序的其他部分。
```

- 创建一个永远为空的读取流

在某些情况下，你可能需要一个始终不包含任何数据的读取流作为其他操作的输入源。比如，当某个 API 期望一个读取流，但你没有实际的文件或数据提供时，可以使用os.devNull：

```js
const fs = require("fs")
const { devNull } = require("os")

// 创建一个指向空设备的读取流
const emptyReadStream = fs.createReadStream(devNull)

// 这个流可以传递给需要读取流的函数或API，而该流会像一个永不结束的空流一样表现
```

- 测试和基准

有时候开发者可能想要测试他们的程序在处理大量数据时的性能，但又不希望因为磁盘 IO 的限制而影响测试结果。此时，可以将输出重定向到os.devNull来模拟大量数据的写入而不实际占用磁盘空间：

```js
const fs = require("fs")
const { devNull } = require("os")

// 假设我们有一个巨大的数据源需要写入
const hugeDataStream = getHugeDataStream() // 这是一个示例函数，返回一个大数据流

// 将输出重定向到空设备，以避免磁盘IO的限制
const nullWriteStream = fs.createWriteStream(devNull)

hugeDataStream.pipe(nullWriteStream)
```

## `os.cpus`

`os.cpus()` 函数用来获取当前机器的 CPU 信息，包括每个 CPU 核心的详细信息，它会返回一个对象数组，每个对象代表一个 CPU 核心的信息。对象中包含了如下属性：

- model：字符串类型，表示 CPU 的型号。
- speed：数字类型，表示 CPU 的速度，单位是 MHz。
- times：对象类型，表示 CPU 花在不同类型任务上的时间，单位是毫秒。这个对象通常包含以下属性：
  - user：CPU 运行用户进程的时间。
  - nice：CPU 运行优先级较低（nice 值较高）的用户进程的时间。
  - sys：CPU 运行系统进程的时间。
  - idle：CPU 处于闲置状态的时间。
  - irq：CPU 处理硬件中断请求的时间。

```js
const os = require("os")

// 获取CPU信息
const cpus = os.cpus()

cpus.forEach((cpu, index) => {
  console.log(`CPU#${index + 1}:`)
  console.log(`Model: ${cpu.model}`)
  console.log(`Speed: ${cpu.speed}MHz`)

  // CPU时间统计
  console.log("Times:", cpu.times)
})
```

## `os.endianness`

`os.endianness()` 是一个方法，用于返回一个字符串，表明 Node.js 进程运行的操作系统的字节序。会返回'BE'或'LE'，分别代表大端序和小端序。

```js
const os = require("os")
console.log(os.endianness()) // 输出可能是 'LE' 或 'BE'
```

在计算机科学中，“字节序”（Byte Order）或“尾序”是指多字节数据在内存中存储的顺序。这主要有两种类型：大端序（Big-Endian）和小端序（Little-Endian）。

- 大端序（Big-Endian）：在大端序中，最重要的字节（即最高有效字节）保存在内存的最低地址处，而最不重要的字节（即最低有效字节）保存在最高地址处。简单来说，就像我们阅读英文一样，从左到右。
- 小端序（Little-Endian）：与大端序相反，在小端序中，最重要的字节保存在最高地址处，而最不重要的字节保存在最低地址处。可以把它想象成阅读某些从右向左阅读的文字时的顺序。

举例说：UTF16 编码基本平面的字符使用两个字节，在内存存储中，到底是高位字节+低位字节，还是低位字节+高位字节的呢？

```
字符“齐”，unicode 码位：U+2EEC
如果使用 UTF-16BE 大端序方式存储，码元表示为：2EEC （00101110 11101100）
如果使用 UTF-16LE 小端序方式存储，码元表示为：EC2E （11101100 00101110）
```

在以 UTF-16 编码的文件的编码开头，都会放置一个 `U+FEFF` 字符作为位顺序标识符（Byte Order Mark BOM）: 其中UTF-16LE 以 FFFE 代表，UTF-16BE 以 FEFF 代表，以显示这个文字是 UTF-16 编码以何种存储方式写入。

> U+FEFF 字符在 UNICODE 中代表的意义是ZERO WIDTH NO-BREAK SPACE，顾名思义，它是个没有宽度也没有断字的空白。刚好可以用来作为标识。

为什么需要知道字节序？

字节序在进行跨平台数据交换时非常重要。如果你的应用需要在网络上传输数据，或者需要读取由不同架构的系统写入的文件，那么正确处理字节序就变得尤为关键。

- 网络通讯: 在网络协议（如 TCP/IP）中，通常使用大端序来保证数据在不同的计算机间正确传输。如果你的 Node.js 应用负责处理这类网络协议的数据，那么理解并可能需要转换字节序就很重要。
- 文件处理: 假设你的应用需要读取由另一种架构的系统（可能使用不同的字节序）生成的二进制文件。在这种情况下，了解文件的字节序及如何在 Node.js 中处理它们是必需的。例如，如果你知道一个文件是用小端序编写的，但你的系统是大端序，你可能需要在读取文件数据之后，将其从小端序转换为大端序。
- 硬件交互: 在一些需要直接与硬件交互的应用中，比如读取从某个传感器发送的数据，了解硬件使用的字节序也是重要的。这样，你可以确保数据被正确解析和处理。

但是现在使用BOM来标识存储顺序很少用，因为现在 web 环境下广泛采用的都是 UTF-8 编码，它是变长编码方案，不需要 BOM。对于定长的编码方案都有各自指明的 UTF-16BE / UTF-16LE / UTF-32BE / UTF-32LE。所以BOM头也用不到。

> 关于字符编码相关内容可以进一步阅读 [String 字符](https://xut0793.github.io/FE-Language/ES/type-3-string.html)
