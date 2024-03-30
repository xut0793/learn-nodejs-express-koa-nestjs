/*
 * @Date         : 2024-03-30 09:10:59 星期6
 * @Author       : xut
 * @Description  :
 */
const receivedMsgWrapEl = document.getElementById("received-msg")
const connectBtnEl = document.getElementById("connect-btn")

function startEventSource() {
  const es = new EventSource("/sse/disconnect")
  es.addEventListener("message", (evt) => {
    const line = evt.data
    const info = document.createElement("div")
    info.textContent = line
    receivedMsgWrapEl.appendChild(info)
  })
  es.addEventListener("disconnect", () => {
    es.close()
    const info = document.createElement("div")
    info.textContent = "连接已关闭"
    receivedMsgWrapEl.appendChild(info)
  })
}

connectBtnEl.addEventListener("click", () => startEventSource())
