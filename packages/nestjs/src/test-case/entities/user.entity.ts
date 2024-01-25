/*
 * @Date         : 2024-01-24 17:14:07 星期3
 * @Author       : xut
 * @Description  :
 */
import { UserDto } from '../dto/create-user.dto';

export const userDB: UserDto[] = [
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

export class UserModel {
  static query() {
    return userDB;
  }

  static findOne(id: number) {
    return userDB.find((u) => u.id === id);
  }

  static create(user: UserDto) {
    userDB.push(user);
  }

  static update(id: number, user: UserDto) {
    const oldUser = userDB.find((u) => u.id === id);
    if (oldUser) {
      return Object.assign(oldUser, user);
    } else {
      return false;
    }
  }

  static delete(id: number) {
    const idx = userDB.findIndex((u) => u.id === id);
    if (idx > -1) {
      return userDB.splice(idx, 1);
    } else {
      return false;
    }
  }
}
