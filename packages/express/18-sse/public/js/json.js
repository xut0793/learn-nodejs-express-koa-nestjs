/*
 * @Date         : 2024-03-30 09:10:59 星期6
 * @Author       : xut
 * @Description  :
 */
const receivedMsgWrapEl = document.getElementById("received-msg")
const connectBtnEl = document.getElementById("connect-btn")

function startEventSource() {
  const es = new EventSource("/sse/json")
  es.addEventListener("message", (evt) => {
    const line = evt.data

    if (line === "undefined") {
      es.close()
      return
    }

    try {
      const info = JSON.parse(line)
    } catch (error) {
      console.error(error)
    }

    const content = Array.from(Object.entries(info)).reduce((ret, cur) => {
      ret += `<span>${cur[0]}: ${cur[1]}</span>; `
      return ret
    }, "")

    const liEl = document.createElement("li")
    liEl.innerHTML = `<li>${content}</li>`
    receivedMsgWrapEl.appendChild(liEl)
  })

  es.addEventListener("error", (evt) => {
    // 值是 CONNECTING（0）、OPEN（1）或 CLOSED（2）。
    if (evt.target.readState == 2 || evt.target.CLOSED) {
      // 重新连接
    }
  })
}

connectBtnEl.addEventListener("click", () => startEventSource())
