/*
 * @Date         : 2024-01-24 17:14:07 星期3
 * @Author       : xut
 * @Description  :
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
} from '@nestjs/common';
import { TestCaseService } from './test-case.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserModel } from './entities/user.entity';

@Controller('/user')
@ApiTags('User 用户模块')
@UsePipes(ZodValidationPipe)
export class TestCaseController {
  constructor(private readonly testCaseService: TestCaseService) {}

  @Get('/query')
  query(@Query() queryUserDto: QueryUserDto) {
    return this.testCaseService.query(queryUserDto);
  }

  @Get()
  findAll() {
    return this.testCaseService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.testCaseService.findOne(+id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.testCaseService.create(createUserDto);
  }

  @Patch('/:id')
  @ApiOperation({ summary: '更新用户' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    required: true,
    description: '用户ID，必填',
    type: String,
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'user id 存在时，更新成功',
    type: UserModel,
  })
  @ApiResponse({
    status: 404,
    description: 'user id 不存在时',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.testCaseService.update(+id, updateUserDto);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.testCaseService.remove(+id);
  }
}
