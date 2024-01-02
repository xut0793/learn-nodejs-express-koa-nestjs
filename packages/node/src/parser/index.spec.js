/*
 * @Date         : 2023-12-28 13:35:16 星期4
 * @Author       : xut
 * @Description  :
 */
import { urlToHttpOptions, URL } from "node:url"
import { paramsParser, queryParser, cookieParser } from "./index.js"

describe.skip("URL 的路径参数、查询参数和 cookie 解析", () => {
  let TEST_URL = "http://127.0.0.1:9000/params/12?name=lisa&age=18"
  let urlOptions = null
  let req = {}

  beforeAll(() => {
    urlOptions = urlToHttpOptions(new URL(TEST_URL))
  })

  afterAll(() => {
    urlOptions = null
    TEST_URL = null
    req = null
  })

  test("queryParser", () => {
    const query = queryParser(req, urlOptions.search)
    expect(query).toBeDefined()
    expect(query.name).toBe("lisa")
    expect(query.age).toBe("18")
  })

  test("paramsParser", () => {
    const result = paramsParser(req, urlOptions.pathname, "/params/:id")
    expect(result.params).toBeDefined()
    expect(result.params.id).toBe("12")
  })

  test("cookieParser", () => {
    const cookieStr = "userId=123; token=abc"
    const cookies = cookieParser({ headers: { cookie: cookieStr } })
    expect(cookies).toEqual({ userId: "123", token: "abc" })
  })
})
