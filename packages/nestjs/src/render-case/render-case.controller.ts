/*
 * @Date         : 2024-01-07 15:43:13 星期0
 * @Author       : xut
 * @Description  :
 */
import { Controller, Get, Render } from '@nestjs/common';
import { mockList } from './db/index';

@Controller('render')
export class RenderCaseController {
  @Get()
  async blogHome() {
    return 'Hello World By Nestjs';
  }

  @Get('list')
  @Render('renderList')
  async blogListPage() {
    return {
      list: mockList,
    };
  }
}
