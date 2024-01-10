import { resolve } from "node:path"
import express from "express"
import { envParser, envConfigSchema } from "../../node/src/parser/env-parser.js"

const app = express()
app.use(
  envParser({
    envDir: resolve(process.cwd(), "./09-environment/config"),
    validationSchema: envConfigSchema,
    validationOptions: {
      allowUnknown: true,
    },
  })
)

app.get("/environment", (req, res) => {
  res.json(req.app.locals.config)
})

app.listen(9001, () => {
  console.log(`🚀 Server running at http://localhost:9001`)
})
