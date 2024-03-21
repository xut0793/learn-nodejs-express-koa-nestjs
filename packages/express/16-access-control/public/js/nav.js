/*
 * @Date         : 2024-02-27 15:39:32 星期2
 * @Author       : xut
 * @Description  : 页面导航逻辑: 账号密码、邮箱、手机号、第三方授权登录
 */

const navEl = document.querySelector("#nav-tabs")

navEl.addEventListener("click", (evt) => {
  const triggerEl = evt.target

  if (triggerEl.tagName !== "A") return

  /**
   * nav 导航切换
   */
  const children = navEl.children
  const defaultCls = ["text-gray-500"]
  const activeCls = ["bg-gray-900", "text-white"]

  for (let i = 0; i < children.length; i++) {
    const ele = children[i]

    if (ele === triggerEl) {
      ele.classList.remove(...defaultCls)
      ele.classList.add(...activeCls)
    } else {
      ele.classList.remove(...activeCls)
      ele.classList.add(...defaultCls)
    }
  }

  /**
   * 内容随导航切换
   */
  const hash = triggerEl.hash.slice(1)
  const forms = document.forms

  for (let i = 0; i < forms.length; i++) {
    const form = forms[i]
    form.classList.add("hidden")
  }
  forms[`register-${hash}`].classList.remove("hidden")
  forms[`login-${hash}`].classList.remove("hidden")

  // 清空内容
  const registerMessageEl = document.querySelector("#register-message")
  const loginMessageEl = document.querySelector("#login-message")
  const userListEl = document.querySelector("#user-list")

  registerMessageEl.textContent = ""
  loginMessageEl.textContent = ""
  userListEl.textContent = ""
})
