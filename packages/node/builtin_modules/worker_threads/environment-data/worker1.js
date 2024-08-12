/*
 * @Date         : 2024-07-27 21:34:09 星期6
 * @Author       : xut
 * @Description  :
 */
import { getEnvironmentData, threadId, parentPort } from "node:worker_threads"

setTimeout(() => {
  const fooValue = getEnvironmentData("foo")
  const barValue = getEnvironmentData("bar")

  console.log(
    `Worker Thread ${threadId} get foo = ${fooValue}; bar = ${barValue}`
  )

  parentPort.postMessage({ foo: fooValue, bar: barValue })
}, 2000)
