/*
 * @Date         : 2024-06-16 10:41:50 星期0
 * @Author       : xut
 * @Description  :
 */
import vm from "node:vm"
// import http from "node:http"

/**
 * 基本使用
 */
// // 假设用户输入的待执行的代码
// const code = `
//     http.createServer((req, res) => {
//         res.writeHead(200, {'Content-Type': 'text/plain'});
//         res.end('Hello World!');
//     }).listen(8000, () => {console.log('Service is running at http://localhost:8000')});
// `

// // 构建一个上下文对象
// const context = { http, console }

// // 创建一个沙箱环境
// const sandbox = vm.createContext(context)
// vm.runInContext(code, sandbox)

// const contextObject = {
//   animal: "cat",
//   count: 2,
// }

// const sandbox = vm.createContext(contextObject)

/**
 * runInContext / runInNewContext / runInThisContext 区别
 */
// vm.runInContext('count += 1; name = "kitty";', sandbox)
// console.log(contextObject)
// // Prints: { animal: 'cat', count: 3, name: 'kitty' }
// vm.runInContext('count += 1; gender = "Female";', sandbox)
// console.log(contextObject)
// Prints: { animal: 'cat', count: 4, name: 'kitty', gender: 'Female' }

// vm.runInNewContext('count += 1; name = "kitty";', contextObject)
// console.log(contextObject)
// // Prints: { animal: 'cat', count: 3, name: 'kitty' }

// vm.runInNewContext('count += 1; gender = "Female";', contextObject)
// console.log(contextObject)
// // Prints: { animal: 'cat', count: 4, name: 'kitty', gender: 'Female' }

// globalThis.a = 1
// let localVar = "initial value"

// const vmResult = vm.runInThisContext('localVar = "vm"; a++;')
// console.log(`vmResult: '${vmResult}', localVar: '${localVar}'`) // Prints: vmResult: 'vm', localVar: 'initial value'
// console.log(`vm.runInThisContext globalThis.a = ${globalThis.a}`) // 2

// const evalResult = eval('localVar = "eval"; a++;')
// console.log(`evalResult: '${evalResult}', localVar: '${localVar}'`) // Prints: evalResult: 'eval', localVar: 'eval'
// console.log(`eval globalThis.a = ${globalThis.a}`) // 3

/**
 * measureMemory
 * 实验性功能，需要参数开启
 */
async function runUserCode(userCode) {
  const sandbox = vm.createContext({})
  vm.runInContext(userCode, sandbox)

  const memoryUsage = await vm.measureMemory()
  console.log(`Memory used by user code:`, memoryUsage)
}

const userCode =
  `let fibonacci = (n) =` >
  ` n ` <
  `= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);`
runUserCode(userCode).catch(console.error)
