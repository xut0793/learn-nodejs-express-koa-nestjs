/*
 * @Date         : 2024-06-14 08:28:09 星期5
 * @Author       : xut
 * @Description  :
 */
import { greet } from "./b.js"

console.log("global === globalThis", global === globalThis) // true
console.log("---------------")
console.log("global.hello = ", global.hello) // world
console.log("global.some = ", global.some) // some
console.log("---------------")
console.log("globalThis.hello = ", globalThis.hello) // word
console.log("globalThis.some = ", globalThis.some) // some
console.log("---------------")
greet()
