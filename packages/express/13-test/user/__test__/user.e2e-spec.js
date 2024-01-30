/*
 * @Date         : 2024-01-23 19:49:22 星期2
 * @Author       : xut
 * @Description  :
 */
import supertest from "supertest"
import app from "../../app.js"

describe("user CURD", () => {
  let request
  beforeAll(() => {
    request = supertest(app)
  })
  afterAll(() => {
    request = null
  })

  it("Get /user", async () => {
    const res = await request.get("/user")

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty("code", 10000)
    expect(res.body.data).toHaveLength(2)
  })

  it("Get /user/query?pageSize=1&pageNum=1", async () => {
    const res = await request
      .get("/user/query")
      .query({ pageSize: 1 })
      .query({ pageNum: 1 })
    expect(res.status).toEqual(200)
    expect(res.body.data).toHaveProperty("total", 2)
    expect(res.body.data.list).toHaveLength(1)
  })

  it("Post /user createUserDto missing Params", async () => {
    const res = await request.post("/user").send({
      birthday: "1988-10-15",
      gender: "Male",
      desc: "this is LiLei description",
    })

    expect(res.status).toBe(400)
  })

  it("Post /user success", async () => {
    const res = await request.post("/user").send({
      name: "LiLei",
      age: 36,
      birthday: "1988-10-15",
      gender: "Male",
      desc: "this is LiLei description",
    })

    expect(res.ok).toBeTruthy()
    expect(res.type).toMatch("/json")
    expect(res.body).toBeDefined()
    expect(res.body.data).toHaveProperty("id", 3)
    expect(res.body.data).toHaveProperty("createTime")
  })

  it("Put /user/:userId userId = 10 not exist", async () => {
    const res = await request.patch("/user/10").send({ name: "LiLei" })

    expect(res.ok).toBeTruthy()
    expect(res.body.data).toBeNull()
    expect(res.body.msg).toMatch("用户不存在")
  })

  it("Put /user/:userId userId = 2 exist", async () => {
    const res = await request.patch("/user/2").send({ name: "LiLei" })

    expect(res.ok).toBeTruthy()
    expect(res.body).toBeDefined()
    expect(res.body.data).toHaveProperty("name", "LiLei")
    expect(res.body.data).toHaveProperty("updateTime")
  })

  it("Delete /user/:userId userId = 10 not exist", async () => {
    const res = await request.delete("/user/10")

    expect(res.ok).toBeTruthy()
    expect(res.body.data).toBeNull()
    expect(res.body.msg).toMatch("用户不存在")
  })

  it("Delete /user/:userId userId = 2 exist", async () => {
    const res = await request.delete("/user/2")

    expect(res.ok).toBeTruthy()
    expect(res.body).toBeDefined()
    expect(res.body.code).toBe(10000)
    expect(res.body.data).toHaveProperty("id", 2)
  })
})
