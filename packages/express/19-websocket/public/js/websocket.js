/*
 * @Date         : 2023-11-22 23:39:05 星期3
 * @Author       : xut
 * @Description  :
 */
class Socket {
  constructor(url, selector = "received-msg") {
    this.url = url
    this.ws = null
    this.messageBox = document.getElementById(selector)
  }

  start() {
    const ws = (this.ws = new WebSocket(this.url))

    ws.addEventListener("open", this.handleOpen.bind(this))
    ws.addEventListener("close", this.handleClose.bind(this))
    ws.addEventListener("error", this.handleError.bind(this))
    ws.addEventListener("message", this.handleMessage.bind(this))
    ws.addEventListener("browser_client", this.handleClient.bind(this))
  }

  handleOpen() {
    console.log("🚀 ~ Socket ~ handleOpen ~ CONNECTED")
  }
  handleClose(evt) {
    console.log("🚀 ~ Socket ~ handleClose ~ evt:", evt)
  }
  handleError(evt) {
    console.log("🚀 ~ Socket ~ handleError ~ evt:", evt)
  }
  handleMessage(evt) {
    this.messageBox.insertAdjacentHTML(
      "beforeend",
      `<li style="text-align: left">${evt.data}</li>`
    )
  }
  // 无效，替换方法是从 message 处理函数中自行解析 data.event 事件类型。
  handleClient(evt) {
    console.log("🚀 ~ Socket ~ handleClient ~ eve:", evt)
    this.messageBox.insertAdjacentHTML(
      "beforeend",
      `<li style="text-align: left">${evt.data}</li>`
    )
  }
  send(data) {
    /**
     * nestjs 消息格式实现 MessageEvent 格式，约定以 { event, data } 格式
     */
    this.ws.send(JSON.stringify(data))
    this.messageBox.insertAdjacentHTML(
      "beforeend",
      `<li style="text-align: right">${data.data}</li>`
    )
  }
  close() {
    this.ws.close()
    this.ws = null
  }
}

const ws = new Socket("ws://localhost:9001/ws")

const inputBox = document.getElementById("input")
const sendButton = document.getElementById("send")
const stopButton = document.getElementById("stop")
const startButton = document.getElementById("connect")
const eventSelect = document.getElementById("event-select")
const emitButton = document.getElementById("emit")
const loginButton = document.getElementById("login")
const logoutButton = document.getElementById("logout")

stopButton.addEventListener("click", () => ws.close())
startButton.addEventListener("click", () => {
  ws.start()
})
sendButton.addEventListener("click", () => {
  let msg = inputBox.value
  let event = eventSelect.value ?? "message"
  msg = msg ? msg.trim() : ""
  if (msg) {
    ws.send({ event, data: msg })
  } else {
    alert("不能发送空内容")
  }
})
emitButton.addEventListener("click", () => {
  fetch("http://localhost:9001/ws/emit")
})
loginButton.addEventListener("click", () => {
  fetch("http://localhost:9001/api/login", { method: "POST" })
})
logoutButton.addEventListener("click", () => {
  fetch("http://localhost:9001/api/logout")
})
