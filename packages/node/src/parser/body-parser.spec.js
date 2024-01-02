/*
 * @Date         : 2023-12-28 13:35:28 星期4
 * @Author       : xut
 * @Description  :
 */
import supertest from "supertest"
import { app } from "../../02-request/index.js"

describe.skip("02-request", () => {
  let request
  beforeAll(() => {
    request = supertest(app)
  })
  afterAll(() => {
    request = null
  })

  test("/", async () => {
    const res = await request.get("/")
    expect(res.status).toEqual(200)
  })

  test("/url", async () => {
    const res = await request.get("/url")

    expect(res.headers["content-type"]).toMatch(/json/)
    expect(res.status).toEqual(200)
    expect(res.body).toBeDefined()
    expect(res.body.pathname).toEqual("/url")
  })

  test("/headers", async () => {
    const res = await request.get("/headers")
    expect(res.ok).toBeTruthy()
    expect(res.type).toMatch(/json/)
  })

  test("/query", async () => {
    const res = await request
      .get("/query")
      .query({ name: "lisa" })
      .query({ age: 18 })
    expect(res.status).toEqual(200)
    expect(res.body.name).toEqual("lisa")
    expect(res.body.age).not.toEqual(18)
  })

  test("/query nothing", async () => {
    const res = await request.get("/query")
    expect(res.body).toEqual({})
  })

  test("/params/:id", async () => {
    const res = await request.get("/params/12")
    expect(res.ok).toBeTruthy()
    expect(res.body).toBeDefined()
    expect(res.body.id).toEqual("12")
  })

  test("/params/ nothing", async () => {
    const res = await request.get("/params/")
    expect(res.ok).toBeTruthy()
    expect(res.body).toEqual({})
  })

  test("/body/text", async () => {
    const res = await request
      .post("/body/text")
      .set("Content-Type", "text/plain")
      .send("response text")
    expect(res.ok).toBeTruthy()
    expect(res.type).toMatch(/plain/)
    expect(res.text).toEqual("response text")
  })

  test("/body/urlencoded", async () => {
    const res = await request.post("/body/urlencoded").send("a=11&b=22")
    expect(res.ok).toBeTruthy()
    expect(res.type).toMatch(/json/)
    expect(res.body).toBeDefined()
    expect(res.body.a).toEqual("11")
    expect(res.body.b).toEqual("22")
  })

  test("/body/json", async () => {
    const res = await request
      .post("/body/json")
      .send({ name: "lisa" })
      .send({ age: 18 })
    expect(res.ok).toBeTruthy()
    expect(res.body).toBeDefined()
    expect(res.body.name).toEqual("lisa")
    expect(res.body.age).toEqual(18)
  })

  // TODO: supertest 如何发始数据
  // test.skip("/body/raw", async () => {
  //   const mockBuffer = Buffer.from("this is a test")
  //   const res = await request.post("/body/raw").attach("file", mockBuffer)
  //   expect(res.ok).toBeTruthy()
  //   expect(res.type).toEqual("received raw success")
  // })
})
