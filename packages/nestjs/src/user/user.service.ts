/*
 * @Date         : 2024-03-17 12:21:27 星期0
 * @Author       : xut
 * @Description  :
 */
import { Injectable } from '@nestjs/common';

export type User = {
  uid: number;
  username: string;
  role: string;
  password: string;
};

@Injectable()
export class UserService {
  private readonly users = [
    { uid: 1, username: 'root', password: '123', role: 'admin' },
    { uid: 2, username: 'tom', password: '123', role: 'user' },
  ];

  async findOne(username: string): Promise<User | null> {
    return this.users.find((u) => u.username === username);
  }

  async getUsers() {
    return this.users;
  }
}
