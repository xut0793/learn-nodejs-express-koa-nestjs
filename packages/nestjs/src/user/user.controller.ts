import { UserService } from './user.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthPossession, AuthZGuard, UsePermissions } from 'nest-authz';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @UseGuards(AuthGuard('jwt'), AuthZGuard)
  @UsePermissions({
    action: 'get', // 对 action 可以定义一个 HTTP method 的枚举
    resource: 'user_list', // 对 resource 可以定义一个共享的 Resource 枚举
    possession: AuthPossession.OWN,
  })
  @Get()
  getUsers() {
    return this.userService.getUsers();
  }
}
