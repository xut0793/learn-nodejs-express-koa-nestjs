/*
 * @Date         : 2023-11-19 16:51:26 星期0
 * @Author       : xut
 * @Description  : 向下兼容 xhr 方式，并开启长轮询
 *
 * 为兼容 xhr 方式，统一使用本地缓存 last-event-id
 */

const defaultOptions = {
  keepaliveSecond: 20, // 长连接间隔 20s
  globalMessageSelector: "global-msg",
  messageSelector: "received-msg",
  withCredentials: false,
}

class SSE {
  url = null
  globalMessageWrapper = null
  messageWrapper = null
  lastEventId = null

  // eventSource 方案
  es = null
  keepaliveTimer = null

  // 使用 xhr 长轮询 的兼容方案
  xhr = null
  longPollTimer = null

  constructor(url, options = {}) {
    this.url = url
    this.options = Object.keys(defaultOptions).reduce((ret, k) => {
      ret[k] = options[k] ?? defaultOptions[k]
      return ret
    }, {})

    this.globalMessageWrapper = document.getElementById(
      this.options.globalMessageSelector
    )
    this.messageWrapper = document.getElementById(this.options.messageSelector)
  }

  /**
   * 异常中断后，显式发起重连
   * 第一种：每次消息处理时都销毁旧定时器，然后开启新的定时器。
   * 第二种：要求服务端在消息中携带一个时间戳，浏览器在每次消息处理时进行更新。另外在本地开启一个每隔4、5秒左右的定时器 setInterval，去检查当前时间与缓存的时间戳比较有没有超过规定间隔，比如 20 秒。
   *
   * 第一种方式需要频繁的开启定时器，第二种需要维持一个长时间定时任务，但每次消息处理只需要更新一个变量值而已。
   * 就cpu 的开销时间，第一种是第二种的几百倍。但第一种的开销占cpu总开销比例也很小。所以并不会成为性能瓶颈，并且时间间隔更精确
   * 参考《HTML5数据推送应用开发》 P60
   */
  gotActivity() {
    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer)
    }
    console.log("🚀 启动长连接 gotActivity >>>")
    this.keepaliveTimer = setTimeout(() => {
      this.connect()
    }, this.options.keepaliveSecond * 1000)
  }

  /**
   * 使用 EventSource 开启 SSE 连接
   */
  startEventSource() {
    this.gotActivity()

    if (this.es) this.es.close()

    let url = this.url

    // 默认重连，浏览器自动会添加 last-event-id 请求。
    // 以下拼接查询参数主要为显示长连接的情形。
    const lastEventId = localStorage.getItem("LAST-EVENT-ID")
    if (lastEventId) {
      url = `${url}?last-event-id=${lastEventId}`
    }

    const es = (this.es = new EventSource(url, {
      withCredentials: this.options.withCredentials,
    }))
    es.addEventListener("open", this.handleOpen.bind(this))
    es.addEventListener("message", this.handleMessage.bind(this))
    es.addEventListener("error", this.handleError.bind(this))
    es.addEventListener("disconnect", this.disconnect.bind(this))
    es.addEventListener("custom_event", this.handleMessage.bind(this))
  }

  handleOpen() {
    console.log("event source open...")
  }

  handleError(evt) {
    console.log("event source error", evt.target)
    // 值是 CONNECTING（0）、OPEN（1）或 CLOSED（2）。
    if (evt.target.readState == 2 || evt.target.CLOSED) {
      this.gotActivity()
    }
  }

  handleMessage(evt) {
    if (evt.lastEventId) {
      this.lastEventId = evt.lastEventId
      localStorage.setItem("LAST-EVENT-ID", evt.lastEventId)
    }

    this.processOneLine(evt.data)
  }

  /**
   * 解析服务器推送过来的 json 消息
   * 约定格式：{acton, id, data}
   */
  processOneLine(line) {
    try {
      // 正常连接时，清除长连接检测的定时器
      this.gotActivity()

      const d = JSON.parse(line)

      switch (d.action) {
        case "info": {
          const info = document.createElement("li")
          info.textContent = `${d.id}: ${JSON.stringify(d.data)}`
          this.messageWrapper.appendChild(info)
          break
        }
        case "shutdown": {
          const msg = document.createElement("li")
          msg.textContent = `Scheduled shutdown from now. Come back at ${d.util} (in ${d.until_second} second)`
          this.globalMessageWrapper.appendChild(msg)

          this.temporarilyDisconnect(d.until_second)
          break
        }
        default:
          break
      }
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * 短暂休眠服务器指定时间后，重连
   * 要大于浏览器有默认的重连时间
   */
  temporarilyDisconnect(sec = 20000) {
    let millisecond = sec * 1000

    // 避免瞬时并发，这里客户端重连请求分散在 60s 内
    millisecond -= Math.ceil(Math.random() * 60000)

    if (millisecond < 0) return

    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer)
      this.keepaliveTimer = null
    }

    this.disconnect()
    this.keepaliveTimer = setTimeout(this.connect, millisecond)
  }

  /**
   * 向后兼容情况
   * - EventSource
   * - xhr
   */
  connect() {
    if (window.EventSource) {
      this.startEventSource()
    } else {
      this.startLongPoll()
    }
  }

  /**
   * 主动关闭连接
   */
  disconnect() {
    this.lastEventId = null

    if (this.keepaliveTimer) {
      clearTimeout(this.keepaliveTimer)
      this.keepaliveTimer = null
    }

    if (this.es) {
      this.es.close()
      this.es.removeEventListener("open", this.handleOpen)
      this.es.removeEventListener("message", this.handleMessage)
      this.es.removeEventListener("error", this.handleError)
      this.es.removeEventListener("disconnect", this.disconnect)
      this.es.removeEventListener("custom_event", this.handleMessage)
      this.es = null
    }

    if (this.xhr) {
      this.xhr.abort()
      this.xhr = null
    }

    if (this.longPollTimer) {
      clearTimeout(this.longPollTimer)
      this.longPollTimer = null
    }
  }

  /**
   * 长轮询的兼容方案
   * 这里 XMLHttpRequest 1.0 版本方式。如果浏览器实现了 XMLHttpRequest 2.0，那必然实现了 eventSource 。
   */
  startLongPoll() {
    if (this.xhr) this.xhr.abort()
    if (window.XMLHttpRequest) {
      this.xhr = new XMLHttpRequest()
    } else {
      this.xhr = new ActiveXObject("Msxml2.XMLHTTP") // IE 兼容性
    }

    this.xhr.onreadystatechange = this.longPollOnReadyStateChange.bind(this)

    const url = `${this.url}?longpoll=1&t=${Date.now()}` // longpoll 标识方便后端识别请求方式，如果是 xhr，服务器推送数据后需要关闭连接，浏览器才能接收响应数据。t 加时间戳是为了避免浏览器缓存请求
    this.xhr.open("GET", url)

    const lastEventId = localStorage.getItem("LAST-EVENT-ID")
    if (lastEventId) {
      this.xhr.setRequestHeader("Last-Event-ID", lastEventId)
    }
    this.xhr.send(null)
  }

  longPollOnReadyStateChange() {
    if (this.readyState != 4) return

    if (this.xhr.status == 200) {
      this.longPollTimer = setTimeout(this.startLongPoll, 1000)
      this.processNonSSE(this.xhr.responseText)
      this.xhr = null
    } else {
      console.log("Connection failure")
      this.disconnect()
      this.longPollTimer = setTimeout(this.startLongPoll, 3000) // 这个时间的原则 ？？
    }
  }

  processNonSSE(resText) {
    // SSE 总是返回一条消息，但长轮询可能返回多条消息
    const lines = resText.split(/\n/)

    for (let line of lines) {
      if (line.length === 0) continue

      // 脏数据防御 json 字符串必须以 { 开头， } 结尾。
      if (line[0] !== "{") {
        line = line.substring(line.indexOf("{"))

        if (line.length === 0) continue
      }
      this.processOneLine(line)
    }
  }
}

const sse = new SSE("/api/v1/sse")
sse.connect()

const startButton = document.getElementById("start")
const stopButton = document.getElementById("stop")
startButton.addEventListener("click", () => sse.connect())
stopButton.addEventListener("click", () => sse.disconnect())
