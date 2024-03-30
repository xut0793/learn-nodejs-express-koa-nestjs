/*
 * @Date         : 2024-03-30 09:10:59 星期6
 * @Author       : xut
 * @Description  :
 */
const receivedMsgWrapEl = document.getElementById("received-msg")
const connectBtnEl = document.getElementById("connect-btn")

function startEventSource() {
  const es = new EventSource("/sse/lastEventId")
  es.addEventListener("message", (evt) => {
    const lastEventId = evt.lastEventId
    const line = evt.data
    const info = document.createElement("div")
    info.textContent = `ID: ${lastEventId}; DATA: ${line}`
    receivedMsgWrapEl.appendChild(info)
  })
}

connectBtnEl.addEventListener("click", () => startEventSource())
