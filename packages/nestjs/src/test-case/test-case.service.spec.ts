/*
 * @Date         : 2024-01-24 17:14:07 星期3
 * @Author       : xut
 * @Description  :
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TestCaseService } from './test-case.service';
import { UserModel } from './entities/user.entity';
import { CreateUserDto, UserDto } from './dto/create-user.dto';
import { UserNotFoundBizException } from '../common/exception/biz.exception';

describe('TestCaseService', () => {
  let service: TestCaseService;
  const mockUserList: UserDto[] = [
    {
      id: 1,
      name: 'lisa',
      age: 18,
      birthday: '2000-10-01',
      gender: 'Female',
      password: '232@sfADF',
      createTime: '2024-01-22 18:02:32',
    },
    {
      id: 2,
      name: 'tom',
      age: 36,
      birthday: '1998-10-15',
      gender: 'Male',
      password: '232!dfADF',
      createTime: '2023-01-23 18:23:32',
    },
  ];

  const mockQuery = jest
    .spyOn(UserModel, 'query')
    .mockReturnValue(mockUserList);
  const mockFindOne = jest
    .spyOn(UserModel, 'findOne')
    .mockImplementation((id) => mockUserList.find((u) => u.id === id));
  const mockCreate = (UserModel.create = jest.fn());
  const mockUpdate = (UserModel.update = jest.fn());
  const mockDelete = (UserModel.delete = jest
    .fn()
    .mockReturnValueOnce(false)
    .mockReturnValueOnce([mockUserList[0]]));

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestCaseService],
    }).compile();

    service = module.get<TestCaseService>(TestCaseService);
  });

  afterAll(() => {
    mockQuery.mockRestore();
    mockCreate.mockReset();
    mockUpdate.mockReset();
    mockFindOne.mockRestore();
    mockDelete.mockReset();
  });

  it('findAll', () => {
    const resp = service.findAll();

    expect(mockQuery).toHaveBeenCalled();
    expect(resp).toHaveLength(2);
  });

  it('findOne id=10 user is not exist', () => {
    expect(() => service.findOne(10)).toThrow(UserNotFoundBizException);
    expect(mockFindOne).toHaveBeenCalledWith(10);
  });

  it('findOne id=1 success', () => {
    const resp = service.findOne(1);

    expect(mockFindOne).toHaveBeenCalledWith(1);
    expect(resp).toHaveProperty('id', 1);
  });

  it('query', () => {
    const resp = service.query({ pageNum: 1, pageSize: 1 });

    expect(mockQuery).toHaveBeenCalled();
    expect(resp).toHaveProperty('total', 2);
    expect(resp.list).toHaveLength(1);
  });

  it('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'LiLei',
      age: 36,
      birthday: '1988-10-15',
      gender: 'Male',
    };

    const resp = service.create(createUserDto);

    expect(mockQuery).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
    expect(resp).toHaveProperty('id', 3);
    expect(resp).toHaveProperty('createTime');
  });

  it('update userId=10 user is not exist', () => {
    // 异常错误断言，必须将代码包装在函数中，否则不会捕获错误，并且断言将失败。
    expect(() => service.update(10, { name: 'LiLei' })).toThrow(
      UserNotFoundBizException,
    );
    expect(mockFindOne.mock.calls[0][0]).toBe(10);
  });

  it('update userId=1 success', () => {
    const updateUserDto = {
      name: 'LiLei',
      age: 20,
    };
    const result = service.update(1, updateUserDto);

    expect(mockFindOne.mock.calls[1][0]).toBe(1);
    expect(mockUpdate).toHaveBeenCalled();
    expect(result).toHaveProperty('updateTime');
    expect(result).toHaveProperty('name', 'LiLei');
    expect(result).toHaveProperty('age', 20);
  });

  it('delete userId=10 user is not exist', () => {
    // 异常错误断言，必须将代码包装在函数中，否则不会捕获错误，并且断言将失败。
    expect(() => service.remove(10)).toThrow(UserNotFoundBizException);
    expect(mockDelete.mock.calls[0][0]).toBe(10);
  });

  it('delete userId=1 success', () => {
    const result = service.remove(1);

    expect(mockDelete.mock.calls[1][0]).toBe(1);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('id', 1);
  });
});
