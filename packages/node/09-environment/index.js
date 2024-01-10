import { createServer } from "node:http"
import { resolve } from "node:path"
import { createRouter } from "../src/lib/router.js"
import { envParser, envConfigSchema } from "../src/parser/env-parser.js"

const router = createRouter()

router.use(
  envParser({
    envDir: resolve(process.cwd(), "./09-environment/config"),
    validationSchema: envConfigSchema,
    validationOptions: {
      allowUnknown: true,
    },
  })
)

router.get("/environment", (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" })
  res.end(
    JSON.stringify({
      NODE_ENV: process.env.NODE_ENV,
      ...req.locals.config,
    })
  )
})

const app = createServer(router)
app.listen(9000, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:9000`)
})
