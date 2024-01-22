/*
 * @Date         : 2024-01-21 12:40:37 星期0
 * @Author       : xut
 * @Description  :
 */
import { Controller, Get } from '@nestjs/common';
import { LogCaseService } from './log-case.service';

@Controller('log')
export class LogCaseController {
  constructor(private readonly logCaseService: LogCaseService) {}
  @Get()
  logMsg() {
    return this.logCaseService.logMsg();
  }
}
