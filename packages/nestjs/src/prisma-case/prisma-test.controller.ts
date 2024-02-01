/*
 * @Date         : 2024-02-01 15:18:27 星期4
 * @Author       : xut
 * @Description  :
 */
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaTestService } from './prisma-test.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

@Controller('/prisma')
export class PrismaTestController {
  constructor(private readonly prismaTestService: PrismaTestService) {}
  @Get()
  greet() {
    return 'Hello Nestjs Prisma';
  }
  @Get('/user')
  findAll() {
    return this.prismaTestService.findAll();
  }

  @Post('/user')
  create(@Body() createUserDto: CreateUserDto) {
    return this.prismaTestService.create(createUserDto);
  }

  @Patch('/user/:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.prismaTestService.update(+id, updateUserDto);
  }

  @Delete('/user/:id')
  remove(@Param('id') id: string) {
    return this.prismaTestService.remove(+id);
  }
}
