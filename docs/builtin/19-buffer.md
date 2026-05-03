# Buffer

在计算机科学中，"buffer" 通常指的是堆内存中的一段临时存储区域，也称为数据缓冲区，它用来临时读写二进制数据。

在 Node.js 的早期版本中，JavaScript 语言本身并没有对二进制数据的直接支持。为了解决这个问题，Node.js 提供了 Buffer 类来绑定底层的 C++ 接口，来实现二进制数据的读写。

但是，现在 JavaScript 的 ES6(es2015) 版本中发布了 ArrayBuffer 和 TypedArray 这样的原生构造函数来处理二进制数据，Nodejs 依赖的 V8 引擎自然也支持 ArrayBuffer 这类对象。所以现在的 Nodejs 中的 Buffer 类就结合了 V8 中 TypedArray 的和C++相关的接口。

在 Nodejs 中 Buffer 类上接口使用层面上，可以看作是 Uint8Array 类的子类，继承了它相关属性和方法，并且扩展了额外方法。

## Buffer 类

通过源码中 javascript 层面的代码，证明 Buffer 类是 Uint8Array 的子类。

```js
// lib/buffer.js
FastBuffer.prototype.constructor = Buffer
Buffer.prototype = FastBuffer.prototype
addBufferPrototypeMethods(Buffer.prototype)
```

然后在另一个文件中 `lib/internal/buffer.js` 实现 FastBuffer 类

```js
// lib/internal/buffer.js
// 这里的 Uint8Array 类就是 V8 提供的 Web 标准的 TypedArray 类。
class FastBuffer extends Uint8Array {
  constructor(bufferOrLength, byteOffset, length) {
    super(bufferOrLength, byteOffset, length)
  }
}
```

Buffer 类与 FastBuffer 类共享一个原型 Uint8Array，所以 Buffer 类原型链是 Uint8Array 类。

## Buffer 的内存管理

Nodejs 是依赖于 V8 引擎来解析和执行的，自然 js 中变量定义和使用的内存是由 V8 来管理的。并且从上面可知 Buffer 类是 V8 中 Uint8Array 类的子类，理论上讲 Buffer 类在使用过程中的内存也是由 V8 管理的。

但事实却不完全是这样的，在 Nodejs 中 Buffer 是一个典型的 JavaScript(V8) 与 C++ 结合的模块，它将性能相关部分用C++实现，将非性能相关的部分用JavaScript实现。

Buffer 的内存管理有几个特殊的概念：

- 8 KB 的内存池
- slab 机制
- 堆外内存

### 8 KB 的内存池

从 Buffer 源码 `/lib/buffer.js` 中，可以看以，Nodejs 应用程序启动时，就会通过 ArrayBuffer 对象申请一块固定大小 8 KB 的内存池。

```js
// nodejs@22.2.0 lib/buffer.js
Buffer.poolSize = 8 * 1024
let poolSize, poolOffset, allocPool

function createPool() {
  poolSize = Buffer.poolSize
  allocPool = createUnsafeBuffer(poolSize).buffer
  // 省略
  poolOffset = 0
}
createPool()

// lib/internal/buffer.js
function createUnsafeBuffer(size) {
  zeroFill[0] = 0
  try {
    // new FastBuffer(size) 就是 new Uint8Array(size)
    return new FastBuffer(size)
  } finally {
    zeroFill[0] = 1
  }
}
```

为什么要提前缓存这块内存区域呢？

Buffer 是 nodejs 非常基础的一个模块，很多内部其它模块都依赖于它，特别是网络相关、IO相关、加解密压缩等模块。由于 Buffer 需要处理大量的二进制数据，如果用一点就要向系统申请，则会造成频繁的向系统申请内存调用，对操作系统造成压力。所以在 nodejs 的 Buffer 模块中使用内存方式采用了 slab 机制：预先申请，事后分配。这样后续 buffer 进行内存操作会变得高效。

### slab 机制

slab 是一种动态的内存管理机制，它就是一块申请好的固定大小的内存区域，有 3 种状态

- full: 完全分配
- partial: 部分分配
- empty: 没有被分配

这种机制以 4kb 为界限决定当前分配的对象是大对象还是小对象。

- 小对象 (<= 4kb) 使用，直接提前从预先申请的 Buffer pool 池进行分配。
- 大对象 (> 4kb) 使用，直接通过 createUnsafeBuffer 接口，在C++层面申请堆外内存，然后在 JavaScript 中使用。

可以从 Buffer.from 和 Buffer.alloc 方法的具体源码实现来看下 buffer 内存申请的过程。 应用层代码都是 js 代码，都是一些条件判断，大致逻辑应该能看懂，一些异常处理的语句可以先忽略，主要是找到 Buffer 实例化的路径。

```js
// nodejs@22.2.0
/***********************************
 * 在 node 8.0之前，buffer主要通过构造函数使用 new Buffer(...) 的方式来创建。因为根据参数的不同，生成buffer的行为和结果都大不相同，
 * 从 node 8.0 版本开始，buffer 的创建被拆分到几个不同的方法(from, alloc, allocUnsafe)。
 ************************************/
function Buffer(arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === "number") {
    if (typeof encodingOrOffset === "string") {
      throw new ERR_INVALID_ARG_TYPE("string", "string", arg)
    }
    return Buffer.alloc(arg)
  }
  return Buffer.from(arg, encodingOrOffset, length)
}

/**
 * from 方法的几种入参形式
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 */
Buffer.from = function from(value, encodingOrOffset, length) {
  if (typeof value === "string") return fromString(value, encodingOrOffset)

  if (typeof value === "object" && value !== null) {
    if (isAnyArrayBuffer(value))
      return fromArrayBuffer(value, encodingOrOffset, length)

    const valueOf = value.valueOf && value.valueOf()
    if (
      valueOf != null &&
      valueOf !== value &&
      (typeof valueOf === "string" || typeof valueOf === "object")
    ) {
      return from(valueOf, encodingOrOffset, length)
    }

    const b = fromObject(value)
    if (b) return b

    if (typeof value[SymbolToPrimitive] === "function") {
      const primitive = value[SymbolToPrimitive]("string")
      if (typeof primitive === "string") {
        return fromString(primitive, encodingOrOffset)
      }
    }
  }

  throw new ERR_INVALID_ARG_TYPE(
    "first argument",
    ["string", "Buffer", "ArrayBuffer", "Array", "Array-like Object"],
    value
  )
}

/**
 * 上述 from 工厂方法，主要根据参数的形式，采用不同的实例化方法，包括
 * fromString / fromArrayBuffer / formObject
 */
function fromString(string, encoding) {
  let ops
  if (typeof encoding !== "string" || encoding.length === 0) {
    if (string.length === 0) return new FastBuffer()
    ops = encodingOps.utf8
  } else {
    ops = getEncodingOps(encoding)
    if (ops === undefined) throw new ERR_UNKNOWN_ENCODING(encoding)
    if (string.length === 0) return new FastBuffer()
  }

  return fromStringFast(string, ops)
}

function fromArrayBuffer(obj, byteOffset, length) {
  // Convert byteOffset to integer
  if (byteOffset === undefined) {
    byteOffset = 0
  } else {
    byteOffset = +byteOffset
    if (NumberIsNaN(byteOffset)) byteOffset = 0
  }

  const maxLength = obj.byteLength - byteOffset

  if (maxLength < 0) throw new ERR_BUFFER_OUT_OF_BOUNDS("offset")

  if (length === undefined) {
    length = maxLength
  } else {
    // Convert length to non-negative integer.
    length = +length
    if (length > 0) {
      if (length > maxLength) throw new ERR_BUFFER_OUT_OF_BOUNDS("length")
    } else {
      length = 0
    }
  }

  return new FastBuffer(obj, byteOffset, length)
}

function fromObject(obj) {
  if (obj.length !== undefined || isAnyArrayBuffer(obj.buffer)) {
    if (typeof obj.length !== "number") {
      return new FastBuffer()
    }
    return fromArrayLike(obj)
  }

  if (obj.type === "Buffer" && ArrayIsArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

// fromObject 依赖的 fromArrayLike
function fromArrayLike(obj) {
  if (obj.length <= 0) return new FastBuffer()

  // 8 * 1024 = 8096 右移 1 为 4096，即要分配的空间小于 4kb
  if (obj.length < Buffer.poolSize >>> 1) {
    // poolOffset 是已使用空间的偏移量，当此 slab 剩余空间不够分配，则 createPool 再申请一块 slab 的内存。
    if (obj.length > poolSize - poolOffset) createPool()

    // 重新申请后，或者本身就足够时，slab直接分配剩余空间，偏移量加上。
    const b = new FastBuffer(allocPool, poolOffset, obj.length)
    TypedArrayPrototypeSet(b, obj, 0)
    poolOffset += obj.length
    alignPool()
    return b
  }
  return new FastBuffer(obj)
}

// fromString 依赖的另一个 fromStringFast
function fromStringFast(string, ops) {
  const length = ops.byteLength(string)
  // 8 * 1024 = 8096 右移 1 为 4096，即要分配的空间大于 4kb，直接利用 C++ 接口直接申请堆外内存
  if (length >= Buffer.poolSize >>> 1)
    return createFromString(string, ops.encodingVal)

  // 当小于 4kb 时，并且当 slab 剩余空间不够分配，则 createPool 再申请一块 slab 的内存。
  if (length > poolSize - poolOffset) createPool()

  // 重新申请后，或者本身就足够时，slab直接分配剩余空间，偏移量加上。
  let b = new FastBuffer(allocPool, poolOffset, length)
  const actual = ops.write(b, string, 0, length)
  if (actual !== length) {
    // byteLength() may overestimate. That's a rare case, though.
    b = new FastBuffer(allocPool, poolOffset, actual)
  }
  poolOffset += actual
  // 字节对齐
  alignPool()
  return b
}

// 包括另一个实用方法 alloc
Buffer.alloc = function alloc(size, fill, encoding) {
  validateNumber(size, "size", 0, kMaxLength)

  if (fill !== undefined && fill !== 0 && size > 0) {
    const buf = createUnsafeBuffer(size)
    return _fill(buf, fill, 0, buf.length, encoding)
  }
  return new FastBuffer(size)
}

function createUnsafeBuffer(size) {
  zeroFill[0] = 0
  try {
    return new FastBuffer(size)
  } finally {
    zeroFill[0] = 1
  }
}
```

其中特别的是 createUnsafeBuffer 函数。

```js
// lib/buffer.js

const {
  // 省略其它
  createFromString,
} = internalBinding("buffer")
```

> `internalBinding()` 是 nodejs 内部实现的C++程序接口的加载器，是用于将 Node 标准库中 C++ 端和 Javascript 端连接起来的桥梁。

C++ 代码在 `/src/node_buffer.cc` 中

```c++
// nodejs@22.2.0
void CreateFromString(const FunctionCallbackInfo<Value>& args) {
  CHECK(args[0]->IsString());
  CHECK(args[1]->IsString());

  enum encoding enc = ParseEncoding(args.GetIsolate(),
                                    args[1].As<String>(),
                                    UTF8);
  Local<Object> buf;

  if (New(args.GetIsolate(), args[0].As<String>(), enc).ToLocal(&buf))
    args.GetReturnValue().Set(buf);
}
```

总结 Buffer 实例化的路径：

```
+---+ Buffer.from(string[,encoding])                                                                    Buffer.alloc(size[,fill[,encoding]])
| |-| Buffer.from(array)                                                                                  +  Buffer.allocUnsafeSlow(size)
| |-| Buffer.from(buffer)                                                                                 |    +  Buffer.allocUnsafe(size)
| +-+ Buffer.from(arrayBuffer[,byteOffset[,length]])                                                      |    |         +
| |   Buffer.from(obj[,offsetOrEncoding[,length]]) +------------------------------+                       |    |         |
| |                                                                               |                       |    |         v
| +-------------------------------------------+                                   |                       |    |   allocate(size)
|                                             v                                   v                       |    |         +
+---> fromString(string,encoding)   fromArrayBuffer(obj,byteOffset,length)  fromObject(obj)               |    |         |createPool()
                +                                              +              +       +                   |    |         |
                +-----------------------------------+          |              |       +                   v    v         v
                |           string.length===0       |          |              |  obj.type==='Buffer'    createUnsafeBuffer(size)
                v                                   |  0<length<maxLength     |       |                    |
      fromStringFast(string, ops)                   |          |              |       v                    |
                +                                   |          |              |     fromArrayLike(obj)     |
                +-----------------------------------+          |              |       +                    |
                |           <4kb                    |          |              |       | createPool()       |
           >=4kb|                                   |          |              |       |                    |
                v                                   v          v              v       v                    |
     createFromString(string, ops.encodingVal)     new FastBuffer(obj,byteOffset,length) <-----------------+

```

内存分配总结：

- nodejs应用程序初次加载时就会初始化 1 个 8KB 的内存池
- 根据申请的内存大小分为 小对象 和 大对象，之所以要判断区别大对象还是小对象，就只是希望小对象不要每次申请时都去向系统申请内存调用。
  - 小对象 （小于 4kb ）情况，判断这个 slab 剩余空间是否足够容纳，若足够就去使用剩余空间分配，偏移量会增加；若不足，就调用 createPool 创建一个新的 slab 空间用来分配
  - 大对象（大于等于4kb）情况，主要是大段文本字符串时，直接调用 C++ 接口 createFromString 申请内存。

所以 Buffer 的内存管理由 V8 和 C++ 共同完成，以4kb为界限。当进行小而频繁的Buffer操作时，采用slab的机制进行预先申请和事后分配，使得JavaScript到操作系统之间不必有过多的内存申请方面的系统调用。对于大块的Buffer而言，则直接使用C++层面提供的内存，而无需细腻的分配操作。其中 C++ 分配的这部分内存我们称之为堆外内存。v8 的垃圾回收机制影响不了堆外内存，由 C++ 自行管理。

这就解释了为什么 Nodejs 对内存的使用能够突破 v8 的限制。V8 最初是为浏览器的打造的，在V8引擎的实现中，64位系统只可以操纵 1.4GB 堆内存，32位系统只可以操纵 0.7GB 堆内存。如果需要使用更多内存，可以参数启动参数 `--max-old-space-size`(单位 Mb) 手动把内存限制调高。

查看栈内存

```sh
node --v8-options
# 会输出一堆数据，找到 --stack_size
--stack_size (default size of stack region v8 is allowed to use (in kBytes))
    type: int  default: 984
```

要增加最大堆栈大小，可以如下操作：

```
$ node --stack_size=1200
```

查看堆内存

```js
import v8 from "node:v8"

const stat = v8.getHeapStatistics()
console.log("🚀 ~ stat:", stat)

// 输出，单位 byte , /1024 = k / 1024 = m / 1024 = G
🚀 ~ stat: {
  total_heap_size: 4915200,  // 4.6875M 当前分配的总堆大小
  total_heap_size_executable: 524288, // 0.5M 为编译字节代码分配的堆大小
  total_physical_size: 4915200, // 4.6875M 硬盘的总可用大小
  total_available_size: 4342102128, // 4140.951M / 1024 = 4.043G 总的可用堆大小
  used_heap_size: 4103072, // 3.91M  分配给应用程序的堆大小
  heap_size_limit: 4345298944, // 4144M / 1024 = 4.046G 堆大小的限制，默认值为 max_old_space_size
  malloced_memory: 262256, // 0.2501M. 当前已分配的内存
  peak_malloced_memory: 100384, // 0.0957M 峰值分配的内存
  does_zap_garbage: 0, // 设置为0或1，表示 选项已启用或未启用 zap_code_space
  number_of_native_contexts: 1, // 活跃的顶层本地上下文
  number_of_detached_contexts: 0 // 未被垃圾收集的分离上下文
}
```

要增加堆内存，可以如下操作

```sh
# 将内存限制值 heap_size_limit 更改为8G
node --max-old-space-size=8192 test.js
```

所以在 Nodejs 中运行程序，栈内存一般限制在 984 KB，堆内存使用限制大约是 4GB，不同的机器可能会有不同。为什么不再调高呢，主要因为内存多了之后，每次垃圾回收的时间也会增长，这也是为什么 v8 对内存使用有限制的原因。

但是 nodejs 中经常会有处理大文件或者大数据的场景，文件大小会超出堆内存限制，此时的一种解决办法是使用 Buffer，因为 Buffer 对大对象的内存申请由 C++ 管理，这部分内存在堆外，也称为堆外内存，所以也就没有 V8 堆内内存使用的限制。

### 堆外内存

关于这部分内存是怎么被管理的？垃圾回收回收的时候会不会去扫这部分内存造成阻塞？

> 以下内容由百度文心一言生成

在 Node.js 中使用 C++ 申请的堆外（或称为非托管）内存管理是一个需要特别注意的问题，因为 Node.js 的垃圾回收机制（V8 引擎的垃圾回收器）主要管理的是堆上的 JavaScript 对象和通过 Node.js 的原生模块（使用 V8 的外部接口，如 v8::Persistent）创建的 C++ 对象。对于直接通过 C++ 分配在堆外的内存（例如，使用 malloc、new 等 C++ 标准库函数），V8 的垃圾回收器无法直接管理。

所以 Node.js 中 C++ 申请的堆外内存管理需要仔细规划和设计。重要的是要确保内存被正确地分配和释放，以避免内存泄漏和其他与内存管理相关的问题。管理和回收 C++ 申请的堆外内存的策略：智能指针、显式释放、清理钩子、引用计数、封装和调试工具等。

1. 使用智能指针：在 C++ 中，可以使用智能指针（如 std::unique_ptr 或 std::shared_ptr）来自动管理内存。智能指针会在其生命周期结束时自动释放它们所管理的资源。然而，这要求你在 Node.js 和 C++ 之间的接口设计中确保智能指针的生命周期与 Node.js 的对象或操作的生命周期相匹配，所以这些指针通常存储在 V8 栈内存中，这样就与 js 变量的生命周期一致。
1. 显式释放：最直接的方式是在 C++ 代码中显式地释放内存。这通常涉及到在适当的时候调用 free 或 delete。然而，这种方法需要确保内存释放的代码在 Node.js 的某个特定生命周期点被调用，这通常涉及到 Node.js 的事件循环、回调函数或某种形式的清理逻辑。
1. 使用 Node.js 的原生模块和清理钩子：如果你正在编写一个 Node.js 的原生模块，你可以在模块中设置清理钩子（如使用 node::AddEnvironmentCleanupHook 或 node::AddGCPrologueCallback 和 node::AddGCEpilogueCallback）来在 Node.js 进程退出或垃圾回收发生时执行特定的清理代码。这些钩子可以用于释放堆外内存。
1. 引用计数：对于需要在多个地方共享的内存块，可以使用引用计数来管理内存的生命周期。每当有一个新的引用指向内存块时，引用计数增加；每当一个引用被销毁时，引用计数减少。当引用计数降至零时，释放内存。
1. 封装和抽象：将堆外内存的管理封装在一个类或模块中，并对外提供清晰的接口来分配和释放内存。这有助于减少错误，并确保内存的正确管理。
1. 监视和调试：使用工具如 Valgrind 或 AddressSanitizer 来监视和调试内存泄漏和错误。这些工具可以帮助你识别何时何地内存被错误地分配或释放。

总结：V8的堆内存只应该保存JIT的代码，用户创建的对象，以及少量的数据。对于数据操作，应该使用Stream的方式，对大块数据的加载和处理，应该使用Buffer。

### 字节对齐

> 引用自 [【Nodejs】448- 深入学习 Node.js Buffer ](https://www.cnblogs.com/pingan8787/p/13069561.html)

所谓的字节对齐，就是各种类型的数据按照一定的规则在空间上排列，而不是顺序的一个接一个的排放，这个就是对齐。我们经常听说的对齐在 N 上，它的含义就是数据的存放起始地址 `%N== 0`。首先还是让我们来看一下，为什么要进行字节对齐吧。

各个硬件平台对存储空间的处理上有很大的不同。一些平台对某些特定类型的数据只能从某些特定地址开始存取。比如有些架构的 CPU，诸如 SPARC 在访问一个没有进行对齐的变量的时候会发生错误，那么在这种架构上通过手动编程保证字节对齐，而有些平台对于没有进行对齐的数据进行存取时会产生效率的下降。

让我们来以 x86 为例看一下，如果在不进行对齐的情况下，会带来什么样子的效率低下问题，看下面的数据结构声明：

```c
struct A {
  char c;  // 字符占一个字节
  int i; // 整型占四个字节
};
struct A a;
```

假设变量 a 存放在内存中的起始地址为 0x00，那么其成员变量 c 的起始地址为 0x00，成员变量 i 的起始地址为0x01，变量 a 一共占用了 5 个字节。当 CPU 要对成员变量 c 进行访问时，只需要一个读的时钟周期即可。

然而如果要对成员变量 i 进行访问，那么情况就变得有点复杂了，首先 CPU 用了一个读周期，从 0x00 处读取了 4 个字节（注意由于是 32 位架构，指 CPU 一次可处理的字节数 4\*8=32），然后将 0x01-0x03 的 3 个字节暂存，接着又花费了一个读周期读取了从 0x04 - 0x07 的 4 字节数据，将 0x04 这个字节与刚刚暂存的 3 个字节进行拼接从而读取到成员变量 i 的值。

为了读取这个成员变量 i，CPU 花费了整整 2 个读周期。试想一下，如果数据成员 i 的起始地址被放在了 0x04 处，那么读取其所花费的周期就变成了 1，显然引入字节对齐可以避免读取效率的下降，但这同时也浪费了 3 个字节的空间 （0x01-0x03）。

了解完字节对齐的概念和使用字节对齐的原因，最后我们来看一下 Buffer.js 文件中的实现字节对齐的 `alignPool() ` 函数：

```js
/**
 * 如果不按照平台要求对数据存放进行对齐，会带来存取效率上的损失。
 * 比如32位的 Intel 处理器通过总线访问内存数据。每个总线周期从偶数地址开始访问32位内存数据，
 * 内存数据以字节为单位存放。如果一个32位的数据没有存放在4字节整除的内
 * 存地址处，那么处理器就需要2个总线周期对其进行访问，显然访问效率下降很多。
 */
function alignPool() {
  // Ensure aligned slices
  // 后四位：0001|0010|0011|0100|0101|0110|0111
  if (poolOffset & 0x7) {
    poolOffset |= 0x7
    poolOffset++
  }
}
```

## API

- 类 Buffer
  - `Buffer.from(string[, encoding])`
  - `Buffer.from(array)`
  - `Buffer.from(arrayBuffer[, byteOffset[, length]])`
  - `Buffer.from(buffer)`
  - `Buffer.from(object[, offsetOrEncoding[, length]])`
  - `Buffer.alloc(size[, fill[, encoding]])`
  - `Buffer.allocUnsafe(size)` 与 alloc 方法比，仅作内存分配，但没有重置内存中的原始数据。所以可能有遗留数据，导致数据不准确，所以不安全。
  - `Buffer.allocUnsafeSlow(size)`
  - `Buffer.byteLength(string[, encoding])`
  - `Buffer.compare(buf1, buf2)`
  - `Buffer.concat(list[, totalLength])`
  - `Buffer.copyBytesFrom(view[, offset[, length]])`
  - `Buffer.isBuffer(obj)`
  - `Buffer.isEncoding(encoding)` 如果 encoding 是 nodejs 支持的字符编码的名称，则返回 true，否则返回 false。
  - `Buffer.poolSize` 默认值 8192 字节，即 8kb。也可赋值修改。
- 实例属性
  - `buf.length` 元素个数，区别于继承的属性 byteLength （字节长度）。
  - `buf.byteOffset` 当前 buffer 对象相对原始 ArrayBuffer 对象的字节偏移量。
  - `buf.buffer` 此 Buffer 对象所基于的基础 ArrayBuffer 对象。并不保证与 buffer 完全对应，因为 buffer 实例时会根据 byteOffset 偏移。
- 读取为
  - 编码字符
    - `buf.toString([encoding[, start[, end]]])`
  - 有符号整数，仿 TypedArray 类接口的实现
  - `buf.readInt8([offset])`
  - `buf.readInt16BE([offset])`
  - `buf.readInt16LE([offset])`
  - `buf.readInt32BE([offset])`
  - `buf.readInt32LE([offset])`
  - `buf.readBigInt64BE([offset])`
  - `buf.readBigInt64LE([offset])`
  - `buf.readIntBE(offset, byteLength)`
  - `buf.readIntLE(offset, byteLength)`
  - 无符号整数
  - `buf.readUInt8([offset])`
  - `buf.readUInt16BE([offset])`
  - `buf.readUInt32BE([offset])`
  - `buf.readUInt32LE([offset])`
  - `buf.readBigUInt64BE([offset])`
  - `buf.readBigUInt64LE([offset])`
  - `buf.readUIntBE(offset, byteLength)`
  - `buf.readUIntLE(offset, byteLength)`
  - 浮点数
  - `buf.readDoubleBE([offset])`
  - `buf.readDoubleLE([offset])`
  - `buf.readFloatBE([offset])`
  - `buf.readFloatLE([offset])`
- 写入
  - 字符串
    - `buf.write(string[, offset[, length]][, encoding])`
  - 有符号整数
    - `buf.writeInt8(value[, offset])`
    - `buf.writeInt16BE(value[, offset])`
    - `buf.writeInt16LE(value[, offset])`
    - `buf.writeInt32BE(value[, offset])`
    - `buf.writeInt32LE(value[, offset])`
    - `buf.writeBigInt64BE(value[, offset])`
    - `buf.writeBigInt64LE(value[, offset])`
    - `buf.writeIntBE(value, offset, byteLength)`
    - `buf.writeIntLE(value, offset, byteLength)`
  - 无符号整数
    - `buf.writeUInt8(value[, offset])`
    - `buf.writeUInt16BE(value[, offset])`
    - `buf.writeUInt16LE(value[, offset])`
    - `buf.writeUInt32BE(value[, offset])`
    - `buf.writeUInt32LE(value[, offset])`
    - `buf.writeBigUInt64BE(value[, offset])`
    - `buf.writeBigUInt64LE(value[, offset])`
    - `buf.writeUIntBE(value, offset, byteLength)`
    - `buf.writeUIntLE(value, offset, byteLength)`
  - 浮点数
    - `buf.writeDoubleBE(value[, offset])`
    - `buf.writeDoubleLE(value[, offset])`
    - `buf.writeFloatBE(value[, offset])`
    - `buf.writeFloatLE(value[, offset])`
- 改变字节序：按无符号整型交换字节序
  - `buf.swap16()`
  - `buf.swap32()`
  - `buf.swap64()`
- 操作
  - `buf.compare(target[, targetStart[, targetEnd[, sourceStart[, sourceEnd]]]])`
  - `buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])`
  - `buf.equals(otherBuffer)`
  - `buf.fill(value[, offset[, end]][, encoding])`
  - `buf.includes(value[, byteOffset][, encoding])`
  - `buf.indexOf(value[, byteOffset][, encoding])`
  - `buf.lastIndexOf(value[, byteOffset][, encoding])`
  - `buf.subarray([start[, end]])`
  - `buf.keys()`
  - `buf.values()`
  - `buf.entries()`
  - `buf.toJSON()`

旧版本中，还有两个特殊的实例方法：`buf.atob(data)` 和 `buffer.btoa(data)`。

- atob 即“ASCII to Binary”，将 ASCII 字符串转为二进制，现在改用 `Buffer.from(string, 'base64')` 实现。
- btoa 即“Binary to ASCII”，将二进制数据读取为字符串，现在改用 `buf.toString('base64')`

个别 `readxx` 和 `wirtexx` 方法的源码

```js
// nodejs@v22.2.0 lib/internal/buffer.js
/***********************************
 * Read
 **********************************/
function readUInt16LE(offset = 0) {
  validateNumber(offset, "offset")
  const first = this[offset]
  const last = this[offset + 1]
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 2)

  return first + last * 2 ** 8
}

function readUInt8(offset = 0) {
  validateNumber(offset, "offset")
  const val = this[offset]
  if (val === undefined) boundsError(offset, this.length - 1)

  return val
}

function readInt16LE(offset = 0) {
  validateNumber(offset, "offset")
  const first = this[offset]
  const last = this[offset + 1]
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 2)

  const val = first + last * 2 ** 8
  return val | ((val & (2 ** 15)) * 0x1fffe)
}

function readInt8(offset = 0) {
  validateNumber(offset, "offset")
  const val = this[offset]
  if (val === undefined) boundsError(offset, this.length - 1)

  return val | ((val & (2 ** 7)) * 0x1fffffe)
}

/***********************************
 * Write
 **********************************/

function writeInt8(value, offset = 0) {
  return writeU_Int8(this, value, offset, -0x80, 0x7f)
}

function writeUInt8(value, offset = 0) {
  return writeU_Int8(this, value, offset, 0, 0xff)
}

function writeU_Int8(buf, value, offset, min, max) {
  value = +value
  // `checkInt()` can not be used here because it checks two entries.
  validateNumber(offset, "offset")
  if (value > max || value < min) {
    throw new ERR_OUT_OF_RANGE("value", `>= ${min} and <= ${max}`, value)
  }
  if (buf[offset] === undefined) boundsError(offset, buf.length - 1)

  buf[offset] = value
  return offset + 1
}

function writeUInt16LE(value, offset = 0) {
  return writeU_Int16LE(this, value, offset, 0, 0xffff)
}

function writeInt16LE(value, offset = 0) {
  return writeU_Int16LE(this, value, offset, -0x8000, 0x7fff)
}

function writeU_Int16LE(buf, value, offset, min, max) {
  value = +value
  checkInt(value, min, max, buf, offset, 1)

  buf[offset++] = value
  buf[offset++] = value >>> 8
  return offset
}
```

## 编码和解码

- 编码：将字符串或数值写入二进制 buffer
- 解码：将二进制 buffer 读取为字符串或数值

目前 Nodejs 支持编码规则（将字符串或数值写入二进制 buffer）

- utf8（别名：utf-8）：默认方式，将utf8编码的 Unicode 字符转为二进制写入内存。许多网页和其他文档格式都使用 UTF-8。
- utf16le（别名：utf-16le）：与 utf8 不同，字符串中的每个字符都将使用 2 或 4 个字节进行编码。Node.js 仅支持 UTF-16 的 little-endian 小端序方式。
- latin1：Latin-1 代表 ISO-8859-1。此字符编码仅支持 U+0000 至 U+00FF 的 Unicode 字符。每个字符都使用单个字节进行编码。不符合该范围的字符将被截断并映射到该范围内的字符。

解码过程中，你可以指定不同的字符编码来识别这个二进制数据，转换为人类可读的格式。

- utf8: 默认解码方式，按 utf8 规则读取二进制数据转为字符串，适用于大多数文本数据。
- base64: 以 ASCII 字符串的形式表示二进制数据时使用。base64 编码的字符串中包含的空白字符（例如空格、制表符和换行符）会被忽略。
- hex: 将每个字节编码为两个十六进制字符。当解码不完全由偶数个十六进制字符组成的字符串时，可能会发生数据截断。

> 旧版本支持的解码规则 ascii (utf8 一样效果) / binary (latin1 的别名) / ucs2(ucs-2 属于 utf16le 的别名)
> 关于 [Base64算法详解](./19-buffer-blob.md)

## alloc / allocUnsafe / allocUnsafeSlow 区别

先看下源码实现

`Buffer.alloc(size[, fill[, encoding]])`

```js
/**
 * Creates a new filled Buffer instance.
 * 创建一个新的被初始化过 Buffer 实例。
 */
Buffer.alloc = function alloc(size, fill, encoding) {
  validateNumber(size, "size", 0, kMaxLength)

  if (fill !== undefined && fill !== 0 && size > 0) {
    const buf = createUnsafeBuffer(size)
    return _fill(buf, fill, 0, buf.length, encoding)
  }
  return new FastBuffer(size)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer
 * instance. If `--zero-fill-buffers` is set, will zero-fill the buffer.
 *
 * 默认创建一个非零填充的Buffer 实例，但如果指定了 —zero-fill-buffers 选项，将对缓冲区进行零填充。
 * 比如 node --zero-fill-buffers your-script.js
 */
Buffer.allocUnsafe = function allocUnsafe(size) {
  validateNumber(size, "size", 0, kMaxLength)
  return allocate(size)
}

/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled
 * Buffer instance that is not allocated off the pre-initialized pool.
 * If `--zero-fill-buffers` is set, will zero-fill the buffer.
 *
 * 默认创建一个非零填充的Buffer 实例，但如果指定了 —zero-fill-buffers 选项，将对缓冲区进行零填充。
 * 比如 node --zero-fill-buffers your-script.js
 */
Buffer.allocUnsafeSlow = function allocUnsafeSlow(size) {
  validateNumber(size, "size", 0, kMaxLength)
  return createUnsafeBuffer(size)
}

function allocate(size) {
  if (size <= 0) {
    return new FastBuffer()
  }
  if (size < Buffer.poolSize >>> 1) {
    if (size > poolSize - poolOffset) createPool()
    const b = new FastBuffer(allocPool, poolOffset, size)
    poolOffset += size
    alignPool()
    return b
  }
  return createUnsafeBuffer(size)
}

// 来源于 /lib/internal/buffer.js
// 用于访问数组缓冲区分配器的零填充设置的开关
let zeroFill = getZeroFillToggle()
function createUnsafeBuffer(size) {
  // 关闭
  zeroFill[0] = 0
  try {
    return new FastBuffer(size)
  } finally {
    // 打开
    zeroFill[0] = 1
  }
}

function _fill(buf, value, offset, end, encoding) {
  if (typeof value === "string") {
    if (offset === undefined || typeof offset === "string") {
      encoding = offset
      offset = 0
      end = buf.length
    } else if (typeof end === "string") {
      encoding = end
      end = buf.length
    }

    const normalizedEncoding = normalizeEncoding(encoding)
    if (normalizedEncoding === undefined) {
      validateString(encoding, "encoding")
      throw new ERR_UNKNOWN_ENCODING(encoding)
    }

    if (value.length === 0) {
      // If value === '' default to zero.
      value = 0
    } else if (value.length === 1) {
      // 用字符的码位数值填充
      // Fast path: If `value` fits into a single byte, use that numeric value.
      if (normalizedEncoding === "utf8") {
        const code = StringPrototypeCharCodeAt(value, 0)
        if (code < 128) {
          value = code
        }
      } else if (normalizedEncoding === "latin1") {
        value = StringPrototypeCharCodeAt(value, 0)
      }
    }
  } else {
    encoding = undefined
  }

  if (offset === undefined) {
    offset = 0
    end = buf.length
  } else {
    validateOffset(offset, "offset")
    // Invalid ranges are not set to a default, so can range check early.
    if (end === undefined) {
      end = buf.length
    } else {
      validateOffset(end, "end", 0, buf.length)
    }
    if (offset >= end) return buf
  }

  if (typeof value === "number") {
    // OOB check
    const byteLen = TypedArrayPrototypeGetByteLength(buf)
    const fillLength = end - offset
    if (offset > end || fillLength + offset > byteLen)
      throw new ERR_BUFFER_OUT_OF_BOUNDS()
    // Uint8Array.prototype.fill
    TypedArrayPrototypeFill(buf, value, offset, end)
  } else {
    // C++ 提供的 fill 接口
    const res = bindingFill(buf, value, offset, end, encoding)
    if (res < 0) {
      if (res === -1) throw new ERR_INVALID_ARG_VALUE("value", value)
      throw new ERR_BUFFER_OUT_OF_BOUNDS()
    }
  }

  return buf
}
```

`Buffer.alloc(size)` 方法则总是返回一个初始化过的、清零的 Buffer。这确保新创建的 Buffer 不会包含任何旧数据，因此是安全的。但是，这种安全性是以性能为代价的，因为清零操作需要额外的时间。

当你使用 `Buffer.allocUnsafe()` 或 `Buffer.allocUnsafeSlow()` 创建一个新的 Buffer 时，Node.js 会给你一段原始的内存空间，而这个内存空间之前可能已经被其他应用程序使用过了。如果这块内存没有被清除（也就是说里面可能有残留数据），那么这些旧数据可能会被新创建的 Buffer 不小心读取到。

为什么 Node.js 要提供这样的方法呢？

答案是性能。这种未初始化的 Buffer 创建起来非常快，因为系统不需要去清零内存或者做其他的初始化工作。但是，这带来了一定的安全风险。所以你应该只在确定安全性不是首要考虑，并且紧接着会完全覆盖掉内存数据的情况下，才使用 `Buffer.allocUnsafe()` 或 `Buffer.allocUnsafeSlow()`。大多数情况下，出于安全考虑，你应该默认使用`Buffer.alloc(size)。`
