import {
  getEnvironmentData,
  setEnvironmentData,
  threadId,
  parentPort,
} from "node:worker_threads"

setEnvironmentData("bar", "bar")
const fooValue = getEnvironmentData("foo")

fooValue.foo = "456"

const barValue = getEnvironmentData("bar")

console.log(
  `Worker Thread ${threadId} get foo = ${fooValue}; bar = ${barValue}`
)

parentPort.postMessage({ foo: fooValue, bar: barValue })
