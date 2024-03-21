/*
 * @Date         : 2024-03-15 15:36:45 星期5
 * @Author       : xut
 * @Description  :
 */
const form = document.forms[0]
const resEl = document.querySelector("#resp")
form.addEventListener("submit", (evt) => {
  evt.preventDefault()
  const formData = new FormData(form)
  const formParams = Array.from(formData.entries()).reduce((ret, cur) => {
    ret[cur[0]] = cur[1]
    return ret
  }, {})
  fetch(form.action, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formParams),
  })
    .then((res) => res.json())
    .then((data) => {
      resEl.textContent = JSON.stringify(data)
    })
    .catch((err) => {
      resEl.textContent = JSON.stringify(err)
    })
})
