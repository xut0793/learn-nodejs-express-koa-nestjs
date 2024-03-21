/*
 * @Date         : 2024-03-01 17:25:21 星期5
 * @Author       : xut
 * @Description  :
 */
const loginForm = document.forms[0]
const messageEl = document.querySelector("#login-message")
let authn = null

loginForm.addEventListener("submit", (evt) => {
  evt.preventDefault()

  authn = evt.submitter.dataset.authn
  console.log("🚀 ~ loginForm.addEventListener ~ authn:", authn)

  const url = `${loginForm.action}/${authn}/login`
  const method = loginForm.method.toUpperCase()
  const formData = new FormData(loginForm)
  const data = Array.from(formData.entries()).reduce((ret, cur) => {
    ret[cur[0]] = cur[1]
    return ret
  }, {})

  fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("form submit success >>>", data)
      messageEl.textContent = JSON.stringify(data)

      if (data?.data?.access_token) {
        localStorage.setItem(
          "TOKEN",
          `${data.data.type} ${data.data.access_token}`
        )
      }
    })
    .catch((err) => {
      console.error(err)
      messageEl.textContent = JSON.stringify(err)
    })
})

/**
 * 使用认证 access_token
 */
const userInfoEl = document.querySelector("#user-info")
const getUserBtnEl = document.querySelector("#request-user-btn")
getUserBtnEl.addEventListener("click", () => {
  if (!authn) {
    userInfoEl.textContent = "请确认一种认证方案"
    return
  }

  const token = localStorage.getItem("TOKEN")
  const options = {
    method: "GET",
  }
  if (token) {
    options.headers = {
      Authorization: token,
    }
  }

  fetch(`/api/authentication/${authn}/user`, options)
    .then((res) => res.json())
    .then((data) => {
      userInfoEl.textContent = JSON.stringify(data)
    })
})
