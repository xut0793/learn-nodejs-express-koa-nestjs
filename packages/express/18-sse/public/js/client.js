/*
 * @Date         : 2024-03-30 09:10:59 星期6
 * @Author       : xut
 * @Description  :
 */
const receivedMsgWrapEl = document.getElementById("received-msg")
const connectBtnEl = document.getElementById("connect-btn")
const closeBtnEl = document.getElementById("close-btn")
const emitBtnEl = document.getElementById("emit-btn")
let es = null
const uid = window.crypto.randomUUID()

function startEventSource() {
  es = new EventSource(`/sse/client?uid=${uid}`)
  es.addEventListener("message", (evt) => {
    const line = evt.data
    const info = document.createElement("div")
    info.textContent = line
    receivedMsgWrapEl.appendChild(info)
  })
}

connectBtnEl.addEventListener("click", () => startEventSource())
closeBtnEl.addEventListener("click", () => es && es.close())
emitBtnEl.addEventListener("click", () => {
  fetch(`/sse/client/emit?uid=${uid}`).then(() => {
    console.log("事件已发送")
  })
})
