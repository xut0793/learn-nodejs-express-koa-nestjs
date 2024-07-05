/*
 * @Date         : 2024-06-30 23:28:57 星期0
 * @Author       : xut
 * @Description  :
 * 1.声明一个2个字节大小的内存缓冲区
 * 2.假设要写的数值是 256，二进制表示 00000001 00000000
 * 3.内存的读和写的顺序默认是从低地址到高地址，比如申请的内存空间的两个字节开头地址分别为 a 和 a+1
 * 4. 如果采用大端序（大尾序) 写入 256，存入的内存数据表示：a[00000000] a+1[00000001]
 *    如果采用小端序（小尾序）写入 256，存入的内存数据表示：a[00000001] a+1[00000000]
 *
 */
import os from "node:os"

// nodejs 中通过 os.endianness() 查看当前系统采用的字节序，返回一个字符串，输出可能是 'LE' 或 'BE'
const endianness = os.endianness()
console.log("🚀 ~the platform's endianness:", endianness) // LE

// 声明一个2个字节大小的内存缓冲区
const buffer = new ArrayBuffer(2)
// 声明一个 dataView 视图
const dataView = new DataView(buffer)

// 使用大端序的格式写入 256，存入的内存数据表示：a[00000000] a+1[00000001]
// setInt16(byteOffset, value, littleEndian)
dataView.setInt16(0, 256, false) // littleEndian 入参为 false 或 undefined 时，即采用大端序
console.log("🚀 ~ dataView:", dataView)

// 使用与写入一样字节序，大端序格式读取当前内存缓冲区的二进制数据
// getInt16(byteOffset, littleEndian)
const beVal = dataView.getInt16(0, true)
console.log("🚀 ~dataView getInt16 littleEndian val:", beVal) // 1

// 使用小端序格式读取此时内存数据，
const leVal = dataView.getInt16(0, false)
console.log("🚀 ~dataView getInt16 bigEndian val:", leVal) // 256

// TypedArray 实例化时默认采用系统的字节序，即小端序 LE
const uint16 = new Uint16Array(buffer)
console.log("🚀 ~ Uint16Array:", uint16[0]) // 1

// const buffer = new ArrayBuffer(10)
// const dataview = new DataView(buffer)

// // 00000000 00000011
// dataview.setUint16(0, 3)
// console.log("🚀 ~ dataview:", dataview)
// const uint16 = dataview.getUint16(1) // 偏移一们，取出16个bit，即 00000011 00000000 = 768
// console.log("🚀 ~ uint16:", uint16) // 768
