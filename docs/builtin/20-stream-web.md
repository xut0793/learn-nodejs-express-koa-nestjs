# Web Stream

[MDN Web Stream 概念](https://developer.mozilla.org/zh-CN/docs/Web/API/Streams_API/Concepts)

在前面章节介绍了 web 标准下的二进制操作的相关类 ArrayBuffer / TypedArray / DataView / TextEncoder / TextDecoder。这里再介绍处理大数据量的 web Stream 流式相关的API。

以前，如果我们想要在浏览器环境中用 javascript 处理某种资源（如视频、文本文件等），我们必须下载完整的文件，等待它反序列化成适当的格式（Blob / string），然后在完整地接收到所有的内容后再进行处理。随着流在 JavaScript 中的使用，你就可以使用 Stream 按位处理它，而不再需要缓冲区、字符串或 blob。

Web Stream 包括三种类型的流：

- ReadableStream 可读流
- WritableStream 可写流
- TransformStream 转化流

## ReadableStream 可读流

ReadableStream 可读流抽象的是从一个数据源读取数据的过程。

这个底层的数据源 underlyingSource 分为两种：

- Push source 会在你访问了它们之后，不断地主动推送数据。你可以自行开始（start）、暂停（pause）或取消（cancel）对流的访问。例如视频流和 TCP/Web socket。
- Pull source 需要在你连接到它们后，显式地请求数据。例如通过 Fetch 或 XHR 请求访问一个文件。

ReadableStream 可读流处理的数据会被按划分成一个个块（chunk）进行读取，块（chunk）可以是单个字节，也可以是某种更大的数据类型，例如特定大小的 TypedArray 对象。已放入到流中的块chunk称作已入队（enqueued），流内部是有一个内置队列用来跟踪了那些尚未读取的块，这意味着它们已经在队列中排队等待被读取。

ReadableStream 可读流中的块数据由一个 reader 来处理，它一次只处理一个块，一个流一次只能被一个 reader 读取；当一个 reader 被创建并开始读一个流（一个活跃的 reader）时，我们说，它被锁定（locked）在该流上。如果你想让另一个 reader 读这个流，则通常需要先取消第一个 reader，再执行其他操作。

每个 reader 都有一个关联的 controller，在 reader 处理块数据过程中，用来控制流，比如可以将流关闭 close，将块推入流 enqueue。

尽管同一时刻只能有一个 reader 可以读取流，但我们可以把流复制成两个相同的副本，这样它们就可以用两个独立的 reader 读取。该过程称为拷贝（teeing）。比如说，你在 ServiceWorker 中可能会用到该方法，当你从服务器 fetch 资源，得到一个响应的可读流，你可能会想把这个流拆分成两个，一个流入到浏览器，另一个流入到 ServiceWorker 的缓存。由于响应的主体无法被消费两次，以及可读流无法被两个 reader 同时读取，所以你可以通过拷贝流的两个副本来实现需求（`ReadableStream.tee()`）。

```js
const readableStream = new ReadableStream([underlyingSource[, queuingStrategy]])

// 属性
locked // 返回可读流是否锁定到 reader

// 方法
cancel() // 返回一个 Promise，这个 promise 会在流被取消的时候兑现。该方法会立即结束一个流，当前仍在排除的数据块将丢失，并且不再可读。如果需要等排除的数据块处理完再关闭流，请用 controller.close()
getReader() // 创建一个 reader，并将流锁定。只有当前 reader 可以读取流队列中的数据块。
pipeThrough(transformStream[, options]) // 提供了一种链式的方式，将当前流通过转换流或者其他任何一对可写/可读的流进行管道传输。流在管道传输的时间内也是被锁定的，以阻止其他 reader 锁定它。
pipeTo(writableStream[, options]) // 通过管道将当前的 ReadableStream 中的数据传递给给定的 WritableStream 并且返回一个 Promise，promise 在传输成功完成时兑现，在遇到任何错误时则会被拒绝。并且流在传输的持续时间内锁定这个流，以阻止其他 reader 锁定它。
tee() // 对当前的可读流进行拷贝（tee），返回包含两个 ReadableStream 副本的数组。
```

参数中 underlyingSource 指的是底层的数据源，需要指定构造流行为的方法和属性。包括：

```js
const underlyingSource = {
  type, // 该属性控制正在处理的可读流的类型，缺省时默认 ReadableStreamDefaultController。如果设置为 bytes，则为字节流 BYOB（带你自己的缓冲区）字节流。controller 为 ReadableByteStreamController
  autoAllocateChunkSize, // 只适用于字节流，设置字节流缓冲区的大小。将分配一个具有给定整数大小的 ArrayBuffer，并调用底层源代码。
  start(controller) {}, // 当对象被构造时立刻调用的方法，可以返回一个 promise，表明成功或失败。传递给这个方法的 controller 是一个 ReadableStreamDefaultController 或 ReadableByteStreamController，具体取决于 type 属性的值。开发人员可以使用此方法在设立期间控制流。
  pull(controller) {}, // 当流的内部队列不满时，会重复调用这个方法，直到队列补满。同样的，controller 由 type 确定
  cancel(reason) {}, // 表示该流将被取消。该方法应该做任何必要的事情来释放对流的访问。 如果这个过程是异步的，它可以返回一个 promise，表明成功或失败。原因参数包含一个 DOMString，它描述了流被取消的原因。
}
```

上述方法中 controller 是 ReadableStreamDefaultController 的实例，默认控制器用于分块 chunk 流数据。包括关闭流 close、推入新的块 enqueue 和抛出错误 error

```js
readableByteStreamController
// 属性
desiredSize 只读属性，返回填充满流的内部队列需要的大小。如果是负数，代表当前块处理队列满，产生背压。
// 方法
close() // 关闭流，但此时 reader 仍然可以从流中读取任何先前入队的数据块，但是一旦读取这些数据块，流将被关闭。如果你想完全的丢弃这个流并且丢弃任何入队的数据块，你可以使用 ReadableStream.cancel() 或者 ReadableStreamDefaultReader.cancel()。
enqueue(chunk) // 给定数据块送入到关联的流中。
error(Error) // 导致未来任何与关联流的交互出错。
```

queuingStrategy 是 CountQueuingStrategy 的实例，指定提供了一个用于对块进行计数的队列策略（指定 highWaterMark 值），可以在构造流的时候使用。

```js
const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 });

// 属性
queuingStrategy.highWaterMark 即传入的 highWaterMark 值。
```

另外从可读流生成一个 reader，可以通过调用可读流的 `getReader()` 方法。

```js
const readableStreamDefaultReader = readableStream.getReader()

// reader 对象属性
closed // 是一个 Promise 对象，这个 promise 在流关闭时兑现，而在流抛出错误或者 reader 的锁被释放时拒绝。该属性使你能够编写在一个流结束时响应的代码。

// reader 对象方法
cancel([reason]) // 返回一个 Promise，这个 promise 在流被取消时兑现。消费者在流中调用该方法发出取消流的信号。
read() // 返回一个 Promise，这个 promise 提供流的内部队列中下一个分块（以供访问），兑现值是一个对象 {done, value}，当 done 为 true 时表示数据已全部读取。
releaseLock() // 方法用于释放 reader 对流的锁定。如果在 reader 仍有待处理的读取请求时释放了锁，那么 reader 的 read() 方法返回的 promise 将立刻使用 TypeError 拒绝。未读的分块将会保留在内部队列中，并且稍后可以通过获取一个新的 reader 读取。
```

示例一：

```js
let interval = null

const stream = new ReadableStream({
  start(controller) {
    // 每隔一秒产生一个随机灵敏，推入流的队列中等待处理
    interval = setInterval(() => {
      let string = randomChars()
      controller.enqueue(string)
    }, 1000)

    readStream(controller)
  },
  pull(controller) {
    // We don't really need a pull in this example
  },
  cancel() {
    // This is called if the reader cancels,
    // so we should stop generating strings
    clearInterval(interval)
  },
})

async function readStream(controller) {
  const reader = stream.getReader()
  let charsReceived = 0

  while (true) {
    if (charsReceived > 10) {
      clearInterval(interval)
      controller.close()
      console.log("Stream complete result: ", result)
      return
    }

    const { done, value } = reader.read()

    if (done) {
      console.log("Stream complete result: ", result)
      return
    }

    charsReceived += value.length
    const chunk = value

    console.log(
      "Read " + charsReceived + " characters so far. Current chunk = " + chunk
    )

    result += chunk
  }
}

// 生成一个随机数
function randomChars() {
  let string = ""
  let choices =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()"

  for (let i = 0; i < 8; i++) {
    string += choices.charAt(Math.floor(Math.random() * choices.length))
  }
  return string
}
```

示例二：从后端请求一个图片在网页上显示

```js
const image = document.getElementById("target")

fetch("./tortoise.png")
  // response.body 就是一个可读流
  .then((response) => response.body)
  .then((rs) => {
    const reader = rs.getReader()

    return new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read()

          // 数据全部读取完成后，退出
          if (done) {
            break
          }

          // 将下一个数据块排队到目标流中待读取
          controller.enqueue(value)
        }

        // 关闭流，并释放锁定
        controller.close()
        reader.releaseLock()
      },
    })
  })
  // Create a new response out of the stream
  .then((rs) => new Response(rs))
  // Create an object URL for the response
  .then((response) => response.blob())
  .then((blob) => URL.createObjectURL(blob))
  // Update image
  .then((url) => (image.src = url))
  .catch(console.error)
```

## WritableStream 可写流

WritableStream 是一个可以写入数据的流。它的终点是一个底层数据接收器 underlying sink。数据由一个 writer 写入流中，每次只写入一个块 chunk。

当 writer 被创建并开始向一个流写入数据（一个活跃的 writer）时，它被锁定（locked）在该流上。同一时刻，一个可写流只能由一个 writer 进行写入数据。如果你想要用其他 writer 向流中写入数据，在你将 writer 附着到该流之前，你必须先中止上一个 writer。

同样，可写流中有一个内置队列跟踪已经被写入流的块数据，但是仍然没有被底层接收器处理的块。

```js
const writableStream = new WritableStream(underlyingSink, queuingStrategy)

// 属性
locked // 返回一个布尔值，表示 WritableStream 是否锁定到一个 writer。

// 方法
getWriter() // 返回一个新的 WritableStreamDefaultWriter 实例并且将流锁定到该实例。当流被锁定时，直到这个流被释放之前，不能获取其他 writer。
abort() // 方法用于中止流，表示生产者不能再向流写入数据（会立刻返回一个错误状态），并丢弃所有已入队的数据。
close() // 返回一个 Promise，会等待队列数据写入完成后关闭流
```

其中 underlyingSink 对象用来定义流的具体写入行为：

```js
const underlyingSink = {
  start(controller){}, // 当对象被构造时立刻调用的方法。返回一个 promise，以表明异步操作成功或失败。传递给这个方法的 controller 参数是一个 WritableStreamDefaultController。开发人员可以在设置时使用它来控制流。
  write(chunk, controller){}, // 当一个新的数据块（指定为 chunk 参数传入）准备好写入底层接收器时，将调用此方法
  close(controller) {}, // 返回一个 promise，当所有等待的写入操作都成功后才会被调用。
  abort(reason), // 返回一个 promise，以表明操作成功或失败。reason 参数包含一个字符串，用于指定流被中止的原因。
}
```

另一个参数 queuingStrategy 是定义流的队列策略的对象，包含 highWaterMark 和 size 属性。可以是 ByteLengthQueuingStrategy 或 CountQueuingStrategy 的实例，默认值 `new CountQueuingStrategy({highWaterMark: 1})`

```js
queuingStrategy = {
  highWaterMark: 1, //非负整数——这定义了在应用背压之前可以包含在内部队列中的分块的最大数量。
  size(chunk): // 包含参数 chunk 的方法——这表示每个分块所需要使用的字节数。
}
```

writer 对象的属性和方法

```js
const writer = new WritableStreamDefaultWriter(stream)

// 属性
closed // 一个 promise 对象，当流关闭时，兑现为 true
ready // 返回一个 promise 对象，当流填充内部队列的所需大小从非正数变为正数时兑现，表明它不再应用背压。
desiredSize // 返回填充满流的内部队列所需要的大小，当负数时，产生背压。

// 方法
abort() // 中止流，表示生产者不能再向流写入数据（会立刻返回一个错误状态），并丢弃所有已入队的数据。
close() // 关闭流
releaseLock() // 释放 writer 对相应流的锁定。
write() // 将传递的数据块写入 WritableStream 和它的底层接收器，然后返回一个 Promise，promise 的状态由写入操作是否成功来决定。
```

示例：

```js
const decoder = new TextDecoder("utf-8")
const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 })

let result = ""
const writableStream = new WritableStream(
  {
    // Implement the sink
    write(chunk) {
      return new Promise((resolve, reject) => {
        const buffer = new ArrayBuffer(1) // 1 个字节
        const view = new Uint8Array(buffer)
        view[0] = chunk

        const decoded = decoder.decode(view, { stream: true })

        console.log(`Chunk decoded: ${decoded}`)

        result += decoded
        resolve()
      })
    },
    close() {
      console.log(`[MESSAGE RECEIVED] ${result}`)
    },
    abort(err) {
      console.log("Sink error:", err)
    },
  },
  queuingStrategy
)

async function sendMessage(message, writableStream) {
  const defaultWriter = writableStream.getWriter()

  const encoder = new TextEncoder()
  const encoded = encoder.encode(message)

  try {
    for (const chunk of encoded) {
      await defaultWriter.ready
      await defaultWriter.write(chunk)
      console.log("Chunk written to sink.")
    }
    // 在关闭之前，再次调用ready以确保所有块都被写入
    await defaultWriter.ready
    await defaultWriter.close()
    console.log("All chunks written")
  } catch (err) {
    console.log("Error:", err)
  }
}

sendMessage("Hello, world.", writableStream)
```

## TransformStream 传输流

Streams API 使用链式管道（pipe chain）的结构将流传输到另一个流。有两种方法可以作用于它：

- `ReadableStream.pipeThrough()`：通过转换流（transform stream）传输流，可能在传输过程中转换流。
- `ReadableStream.pipeTo()` 传输到可写流，并且作为链式管道传输的终点。

例如，将编码或解码视频帧、压缩或解压缩数据或以其他的方式从一种数据转换成另一种数据。一个转换流由一对流组成：一个读取数据的可读流和一个写入数据的可写流，它们以适当的机制确保新数据一旦写入后即可读取。TransformStream 是转换流的具体实现。

链式管道传输的起点称为原始源（original source），终点称为最终接收器（ultimate sink）。可以传输流的实例属性上获取

```js
TransformStream.readable // 只读 转换流的 readable 端。
TransformStream.writable // 只读 转换流的 writable 端。
```

示例：

```js
async function main() {
  // Create a transform stream with our transformer
  const ts = new TransformStream(new Uint8ArrayToStringsTransformer())
  // Fetch the text file
  const response = await fetch("goethe-faust-1.txt")
  // Get a ReadableStream on the text file's body
  const rs = response.body
  // Apply our Transformer on the ReadableStream to create a stream of strings
  const lineStream = rs.pipeThrough(ts)
  // Read the stream of strings
  const reader = lineStream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    // Write each string line to the document as a paragraph
    const p = document.createElement("p")
    p.textContent = value
    document.getElementById("section").appendChild(p)
  }
}

class Uint8ArrayToStringsTransformer {
  constructor() {
    this.decoder = new TextDecoder()
    this.lastString = ""
  }

  /**
   * Receives the next Uint8Array chunk from `fetch` and transforms it.
   * 将 fetch 中接收到的 Uint8Array 数据转为字符串
   * @param {Uint8Array} chunk The next binary data chunk.
   * @param {TransformStreamDefaultController} controller The controller to enqueue the transformed chunks to.
   */
  transform(chunk, controller) {
    console.log("Received chunk %o with %d bytes.", chunk, chunk.byteLength)

    // Decode the current chunk to string and prepend the last string
    const string = `${this.lastString}${this.decoder.decode(chunk)}`

    // Extract lines from chunk
    const lines = string.split(/\r\n|[\r\n]/g)

    // Save last line, as it might be incomplete
    this.lastString = lines.pop() || ""

    // Enqueue each line in the next chunk
    for (const line of lines) {
      controller.enqueue(line)
    }
  }

  /**
   * Is called when `fetch` has finished writing to this transform stream.
   *
   * @param {TransformStreamDefaultController} controller The controller to enqueue the transformed chunks to.
   */
  flush(controller) {
    // Is there still a line left? Enqueue it
    if (this.lastString) {
      controller.enqueue(this.lastString)
    }
  }
}
```

## back pressure 背压

背压是流的一个重要概念，这是调节流中读写速度匹配的过程。当下游的流的数据流入超过其处理速度时，开始超出流的缓冲区容量时，可以通过向上游的流发送一个信号，减少数据的推入。

这个背压信号，在 nodejs Stream 中，通过 `write()` 方法的返回值判断。在 web Stream 流中，通过 ` ReadableStreamDefaultController.desiredSize` 属性。如果该值太低或为负数，我们的 ReadableStream 可以告诉它的底层源停止往流中装载数据。

可读流在经历背压后，如果消费者再次想要接收数据，我们可以在构造可读流时提供 pull 方法来告诉底层源恢复往流中装载数据。

```
desiredSize = highWaterMark - total size of chunks in queue
```

desired size 是流中仍然可以接收的分块数量，如果 大于 0 时，块 chunk 的生成可以适度加速，以保持流尽可能快的运行。如果值降到 0（或者小于 0），这意味着块的产生快于流的处理，应该停止块的推入。
