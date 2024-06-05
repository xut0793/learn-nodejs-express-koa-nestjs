/*
 * @Date         : 2024-06-05 08:18:07 星期3
 * @Author       : xut
 * @Description  :
 */
import express from "express"
import crypto from "node:crypto"

const app = express()

app.get("/crypto", (req, res) => {
  const salt = crypto.randomBytes(128).toString("base64")
  const hash = crypto
    .pbkdf2Sync("crypto_secret", salt, 10000, 64, "sha512")
    .toString("hex")

  res.status(200).json({ hash })
})

let reqCount = 0
app.get("/empty", (req, res) => {
  res.status(200).json({ hash: "empty", count: reqCount })
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
