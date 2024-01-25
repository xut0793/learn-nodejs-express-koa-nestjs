/*
 * @Date         : 2024-01-24 17:14:07 星期3
 * @Author       : xut
 * @Description  :
 */
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserModel } from './entities/user.entity';
import { UserNotFoundBizException } from '../common/exception/biz.exception';

@Injectable()
export class TestCaseService {
  findOne(id: number) {
    const user = UserModel.findOne(id);

    if (!user) {
      throw new UserNotFoundBizException();
    }

    return user;
  }

  findAll() {
    const users = UserModel.query();
    return users;
  }

  query(queryUserDto: QueryUserDto) {
    const { pageSize = 2, pageNum = 1 } = queryUserDto;
    const start = (pageNum - 1) * pageSize;
    const end = pageNum * pageSize;
    const users = UserModel.query();
    return {
      total: users.length,
      list: users.slice(start, end),
    };
  }

  create(createUserDto: CreateUserDto) {
    const allUsers = UserModel.query();
    const newUser = {
      ...createUserDto,
      id: allUsers.length + 1,
      createTime: new Date(Date.now()).toISOString(),
    };
    UserModel.create(newUser);
    return newUser;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    const curUser = UserModel.findOne(id);

    if (!curUser) {
      throw new UserNotFoundBizException();
    }

    const newUser = {
      ...curUser,
      ...updateUserDto,
      updateTime: new Date(Date.now()).toISOString(),
    };

    UserModel.update(id, newUser);
    return newUser;
  }

  remove(id: number) {
    const result = UserModel.delete(id);

    if (!result) {
      throw new UserNotFoundBizException();
    }

    return result[0];
  }
}
