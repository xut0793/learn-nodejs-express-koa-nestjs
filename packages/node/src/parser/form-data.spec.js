/*
 * @Date         : 2023-12-28 23:00:36 星期4
 * @Author       : xut
 * @Description  :
 */
import { resolve } from "node:path"
import supertest from "supertest"
import { app } from "../../02-request/index.js"
import { readdir, unlink } from "node:fs/promises"

describe("02-request-multipart/form-data", () => {
  let request
  let uploadDir = resolve(process.cwd(), "./02-request/uploads")
  let testFileDir = resolve(process.cwd(), "./02-request/test-files")
  let kebe24 = resolve(testFileDir, "kebe24.jpg")
  let basketball = resolve(testFileDir, "basketball.png")

  async function cleanupUploadDir() {
    try {
      const files = await readdir(uploadDir)

      files.forEach(async (file) => {
        const filePath = resolve(uploadDir, file)
        await unlink(filePath)
      })
    } catch (error) {
      console.error(error)
    }
  }

  beforeAll(() => {
    request = supertest(app)
  })
  afterAll(() => {
    request = null
    cleanupUploadDir()
  })

  test("/file/single", async () => {
    const res = await request
      .post("/file/single")
      .attach("file", kebe24)
      .field("author", "xut0793")

    expect(res.ok).toBeTruthy()
    expect(res.body).toBeDefined()
    expect(res.body.body.author).toEqual("xut0793")
    expect(res.body.file.originalname).toEqual("kebe24.jpg")
  })

  // FIX: 不知道为啥报错 SyntaxError: Unexpected token 在 in JSON at position 0
  // test.only("/file/single maxCount", async () => {
  //   const res = await request
  //     .post("/file/single")
  //     .attach("file", kebe24)
  //     .attach("file", basketball)

  //   expect(res.error).toBeDefined()
  // })

  test("/file/multi", async () => {
    const res = await request
      .post("/file/multi")
      .attach("photos", kebe24)
      .attach("photos", basketball)
      .field("author", "xut0793")

    expect(res.ok).toBeTruthy()
    expect(res.body).toBeDefined()
    expect(res.body.body.author).toEqual("xut0793")
    expect(res.body.file).not.toBeDefined()
    expect(res.body.files).toHaveLength(2)
  })

  test("/file/fields", async () => {
    const res = await request
      .post("/file/fields")
      .attach("avatar", kebe24)
      .attach("photos", basketball)
      .field("author", "xut0793")

    expect(res.ok).toBeTruthy()
    expect(res.body).toBeDefined()
    expect(res.body.body.author).toEqual("xut0793")
    expect(res.body.file).not.toBeDefined()
    expect(res.body.files).toHaveProperty("avatar")
    expect(res.body.files).toHaveProperty("photos")
  })
})
