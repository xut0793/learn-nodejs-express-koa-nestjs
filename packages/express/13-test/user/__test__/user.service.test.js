/*
 * @Date         : 2024-01-23 19:48:11 星期2
 * @Author       : xut
 * @Description  :
 */
import * as userModel from "../user.model.js"
import { userService } from "../user.service.js"
import { UserNotFoundBizException } from "../../../../node/src/utils/biz.exception.js"

const jest = import.meta.jest
const mockUserList = [
  { id: 1, name: "lisa", age: 18, birthday: "2000-10-01", gender: "Female" },
  { id: 2, name: "tom", age: 38, birthday: "1988-10-15", gender: "Male" },
]
/**
 * 因为 userService 中依赖了 userModel 模块的方法，所以这里需要模拟对应方法的实现
 * 用 spyOn 即在实现 jest.fn 的同时，也可以断言该模拟函数被调用的情况。
 * 如果不需要监听模拟函数的调用情况，可以直接用 userModel.query = jest.fn().mockReturnValue(mockUserList)
 */
const mockQuery = jest
  .spyOn(userModel.userModel, "query")
  .mockReturnValue(mockUserList)
const mockCreate = (userModel.userModel.create = jest.fn())
const mockUpdate = (userModel.userModel.update = jest.fn())
const mockFindOne = jest
  .spyOn(userModel.userModel, "findOne")
  .mockReturnValueOnce(false)
  .mockReturnValueOnce(mockUserList[1])
const mockDelete = (userModel.userModel.delete = jest
  .fn()
  .mockReturnValueOnce(false)
  .mockReturnValueOnce([mockUserList[0]]))

afterAll(() => {
  mockQuery.mockRestore()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockFindOne.mockRestore()
  mockDelete.mockReset()
})

describe("UserService queryUsers", () => {
  it("没有查询参数，返回所有用户", () => {
    const resData = { total: 2, list: mockUserList }

    const result = userService.queryUsers({})

    expect(mockQuery).toHaveBeenCalled() // 断言依赖模拟的方法是否被调用了
    expect(result.total).toBe(2)
    expect(result).toEqual(resData)
  })

  it("传入分页参数，返回分页数据", () => {
    const pageSize = 1
    const pageNum = 1
    const start = (pageNum - 1) * pageSize
    const end = pageNum * pageSize
    const mockSlicedUsers = mockUserList.slice(start, end)
    const resData = { total: 2, list: mockSlicedUsers }

    const result = userService.queryUsers({ pageNum, pageSize })
    expect(result).toHaveProperty("total", 2)
    expect(result.list).toHaveLength(1)
    expect(result).toEqual(resData)
  })
})

describe("UserService createUser", () => {
  it("创建用户", () => {
    const createUserDto = {
      name: "LiLei",
      age: 36,
      birthday: "1988-10-15",
      gender: "Male",
    }

    const result = userService.createUser(createUserDto)

    expect(mockQuery).toHaveBeenCalled()
    expect(mockCreate).toHaveBeenCalled()
    expect(result).toHaveProperty("id", 3)
    expect(result).toHaveProperty("createTime")
  })
})

describe("UserService updateUser", () => {
  it("未传入 userId 时，报错 UserNotFoundBizException", () => {
    // 异常错误断言，必须将代码包装在函数中，否则不会捕获错误，并且断言将失败。
    expect(() => userService.updateUser()).toThrow(UserNotFoundBizException)
    expect(mockFindOne.mock.calls[0][0]).toBeUndefined()
  })

  it("正常传入 userId 时，更新用户", () => {
    const updateUserDto = {
      name: "LiLei",
      age: 20,
    }
    const result = userService.updateUser(1, updateUserDto)

    expect(mockFindOne.mock.calls[1][0]).toBe(1)
    expect(result).toHaveProperty("updateTime")
    expect(result).toHaveProperty("name", "LiLei")
    expect(result).toHaveProperty("age", 20)
  })
})

describe("UserService delUser", () => {
  it("未传入 userId 时，报错 UserNotFoundBizException", () => {
    // 异常错误断言，必须将代码包装在函数中，否则不会捕获错误，并且断言将失败。
    expect(() => userService.delUser()).toThrow(UserNotFoundBizException)
    expect(mockDelete.mock.calls[0][0]).toBeUndefined()
  })

  it("正常传入 userId 时，删除用户", () => {
    const result = userService.delUser(1)

    expect(mockDelete.mock.calls[1][0]).toBe(1)
    expect(result).toBeDefined()
    expect(result).toHaveProperty("id", 1)
  })
})
/**
 * TODO: userModel 模块被 mock 后如何恢复呢？
 */
// it("测试 userModel 模块恢复情况", () => {
//   const result = userService.queryUsers()
//   expect(result).toHaveProperty("total")
//   expect(result.data).toHaveLength(1)
// })
