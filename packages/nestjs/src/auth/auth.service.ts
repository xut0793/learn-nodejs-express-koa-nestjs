import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserService } from 'src/user/user.service';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.userService.findOne(username);

    if (user && user.password === password) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    } else {
      return null;
    }
  }

  async login(user: SafeUser) {
    const payload = { username: user.username, role: user.role, sub: user.uid };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
