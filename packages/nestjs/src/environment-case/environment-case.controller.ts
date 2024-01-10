/*
 * @Date         : 2024-01-10 18:23:23 星期3
 * @Author       : xut
 * @Description  :
 */
import { EnvironmentCaseService } from './environment-case.service';
import { Controller, Get } from '@nestjs/common';

@Controller('environment')
export class EnvironmentCaseController {
  constructor(private readonly envCaseService: EnvironmentCaseService) {}

  @Get()
  getEnvironment() {
    return this.envCaseService.getEnvironment();
  }
}
