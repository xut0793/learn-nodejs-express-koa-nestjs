/*
 * @Date         : 2024-03-17 12:21:17 星期0
 * @Author       : xut
 * @Description  :
 */
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
