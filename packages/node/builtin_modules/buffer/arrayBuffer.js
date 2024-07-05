/*
 * @Date         : 2024-06-30 19:55:37 星期0
 * @Author       : xut
 * @Description  :
 */
// 申请一块2个字节大小的连续内存区域，也就是 8*2=16 比特位大小
// const buffer = new ArrayBuffer(2)

// console.log("--------------Uint8Array---------------")
// // 将这块内存区域按8比特的元符号整数格式进行读和写，那么此时 view 可以读和写两个元素 element
// const view1 = new Uint8Array(buffer)

// console.log(view1.byteLength) // 2
// console.log(view1.length) // 2
// console.log(view1.BYTES_PER_ELEMENT) // 1

// // uint8 无符号整数值的区间 0-255
// view1[0] = 45
// view1[1] = 255
// // view[1] = 256 // 会溢出，输出为 0
// // view[1] = "a"
// console.log(view1.toString()) // 45，255

// console.log("--------------Uint16Array---------------")
// 将这块内存区域按16比特的元符号整数格式进行读和写，那么此时 view 可以读和写1个元素 element
// const view2 = new Uint16Array(buffer)

// console.log(view2.byteLength) // 2
// console.log(view2.length) // 1
// console.log(view2.BYTES_PER_ELEMENT) // 2

// view2[0] = 65
// view2[1] = 255 // 超出忽略

// console.log(view2.toString())

// const textDecoder = new TextDecoder()
// const str = textDecoder.decode(view2)
// console.log("🚀 ~ str:", str)

// const buf = Buffer.from(buffer)
// console.log(buf.readUint8())
// console.log(buf.toString("utf8"))

// // 创建一个 8 字节缓冲区，该缓冲区可调整大小到的最大长度是 16 字节
// const buffer = new ArrayBuffer(8, { maxByteLength: 16 })

// // 然后检查其 resizable 属性，如果 resizable 返回 true 则调整其大小：
// if (buffer.resizable) {
//   console.log("缓冲区大小是可调整的！")
//   buffer.resize(12)
// }

// console.log("byteLength: ", buffer.byteLength)
// console.log("maxByteLength: ", buffer.maxByteLength)

const buffer = new ArrayBuffer(2)

const uint8 = new Uint8Array(buffer)
uint8[0] = 65
uint8[1] = 66
console.log("🚀 ~ uint8:", uint8) // [65, 66]
console.log(uint8[0].toString(2), uint8[1].toString(2)) // 01000001 01000010 (2^6+1, 2^6+2)
const uint16 = new Uint16Array(buffer)
console.log("🚀 ~ uint16:", uint16) // [16961]

const textDecoder = new TextDecoder("utf-16")
const str = textDecoder.decode(buffer)
console.log("🚀 ~ str:", str) //  䉁
