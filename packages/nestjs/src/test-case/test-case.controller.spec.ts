/*
 * @Date         : 2024-01-24 17:14:07 星期3
 * @Author       : xut
 * @Description  :
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TestCaseController } from './test-case.controller';
import { TestCaseService } from './test-case.service';
import { CreateUserDto, UserDto } from './dto/create-user.dto';

describe('TestCaseController', () => {
  let controller: TestCaseController;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestCaseController],
      providers: [TestCaseService],
    }).compile();

    controller = module.get<TestCaseController>(TestCaseController);
    service = module.get<TestCaseService>(TestCaseService);
  });

  it('findAll', () => {
    jest.spyOn(service, 'findAll').mockReturnValueOnce(mockUserList);

    expect(controller.findAll()).toHaveLength(2);
  });

  it('findOne', () => {
    jest
      .spyOn(service, 'findOne')
      .mockImplementation((id) => mockUserList.find((u) => u.id === id));

    expect(controller.findOne('1')).toHaveProperty('id', 1);
  });

  it('query', () => {
    jest
      .spyOn(service, 'query')
      .mockReturnValueOnce({ total: 2, list: [mockUserList[0]] });

    const resp = controller.query({ pageNum: 1, pageSize: 1 });
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
    service.create = jest.fn((params) => ({
      ...params,
      id: 3,
      createTime: '2023-1-23 23:12:34',
    }));
    const resp = controller.create(createUserDto);
    expect(resp).toHaveProperty('id', 3);
    expect(resp).toHaveProperty('createTime');
  });

  it('update', () => {
    service.update = jest.fn().mockReturnValueOnce(mockUserList[0]);
    expect(controller.update('1', { name: 'LiLei' })).toHaveProperty('id', 1);
  });
  it('delete', () => {
    service.remove = jest.fn().mockReturnValueOnce(mockUserList[0]);
    expect(controller.remove('1')).toHaveProperty('id', 1);
  });
});
