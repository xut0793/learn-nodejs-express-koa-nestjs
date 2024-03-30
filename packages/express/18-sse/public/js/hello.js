/*
 * @Date         : 2024-03-30 09:10:59 星期6
 * @Author       : xut
 * @Description  :
 */
const receivedMsgWrapEl = document.getElementById("received-msg")
const connectBtnEl = document.getElementById("connect-btn")

function startEventSource() {
  const es = new EventSource("/sse/hello")
  es.addEventListener("message", (evt) => {
    const line = evt.data
    console.log("🚀 ~ es.addEventListener ~ line:", line)
    if (/done/.test(line)) {
      es.close()
    }
    const info = document.createElement("span")
    info.textContent = line
    receivedMsgWrapEl.appendChild(info)
  })
}

connectBtnEl.addEventListener("click", () => startEventSource())
