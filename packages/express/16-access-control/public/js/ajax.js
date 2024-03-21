/*
 * @Date         : 2024-02-28 14:36:28 星期3
 * @Author       : xut
 * @Description  : 表单请求
 */
const forms = document.forms
const registerMessageEl = document.querySelector("#register-message")
const loginMessageEl = document.querySelector("#login-message")

for (let i = 0; i < forms.length; i++) {
  const form = forms[i]

  // 这里手动提交，增加 evt.preventDefault() 避免表单提交后跳转新窗口
  form.addEventListener("submit", (evt) => {
    evt.preventDefault()

    const messageEl = form.name.startsWith("register")
      ? registerMessageEl
      : loginMessageEl

    const formData = new FormData(form)
    const data = {}

    for (const [k, v] of formData.entries()) {
      data[k] = v
    }

    fetch(form.action, {
      method: form.method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("form submit success >>>", data)
        messageEl.textContent = data.msg
      })
      .catch((err) => {
        console.error(err)
        messageEl.textContent = JSON.stringify(err)
      })
  })
}
/**
 * 获取邮箱验证码
 */
const mailCodeBtn = document.querySelector("#mail-code-btn")

mailCodeBtn.addEventListener("click", (evt) => {
  evt.preventDefault()

  const mail = document.forms["register-mail"].mail.value

  if (!mail) {
    alert("邮箱是必填项！")
    return
  }

  fetch(`/api/mail/code?mail=${mail}`, { method: "GET" })
    .then((res) => res.json())
    .then((data) => {
      console.log("/api/mail/code: ", data)

      mailCodeBtn.textContent = "验证码已发送"

      registerMessageEl.textContent = data.msg
    })
    .catch((err) => {
      console.error(err)
      registerMessageEl.textContent = err.message
    })
})

/**
 * 获取电话验证码
 */
const phoneCodeBtn = document.querySelector("#phone-code-btn")

phoneCodeBtn.addEventListener("click", (evt) => {
  evt.preventDefault()

  const phone = document.forms["register-phone"].phone.value

  if (!phone) {
    alert("电话号码是必填项！")
    return
  }

  fetch(`/api/phone/code?phone=${phone}`, { method: "GET" })
    .then((res) => res.json())
    .then((data) => {
      console.log("/api/phone/code: ", data)

      phoneCodeBtn.textContent = "验证码已发送"
      registerMessageEl.textContent = data.msg
    })
    .catch((err) => {
      console.error(err)
      registerMessageEl.textContent = err.message
    })
})

/**
 * 获取用户列表显示
 */
const requestUserBtnEl = document.querySelector("#request-users-btn")
const userListEl = document.querySelector("#user-list")

requestUserBtnEl.addEventListener("click", () => {
  let hash = location.hash.slice(1)

  if (!hash) hash = "account"

  fetch(`/api/${hash}/users`)
    .then((res) => res.json())
    .then((resData) => {
      const list = resData.data

      if (Array.isArray(list) && list.length) {
        let content = ""

        list.forEach((item, index) => {
          content += `<li>${index + 1}: ${
            item.account || item.mail || item.phone
          } ${item.password}</li>`
        })

        userListEl.innerHTML = content
      } else {
        userListEl.textContent = "暂无用户"
      }
    })
})

/**
 * api 形式调用第三方授权接口获取访问密钥 access_token
 */
const oauthLoginBtnEl = document.querySelector("#oauth-btn")
oauthLoginBtnEl.addEventListener("click", () => {
  fetch("/api/oauth/login")
    .then((res) => res.json())
    .then((data) => {
      console.log("/api/oauth/login response >>>", data)
    })
})
