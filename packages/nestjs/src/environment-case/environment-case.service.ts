/*
 * @Date         : 2024-01-10 18:23:55 星期3
 * @Author       : xut
 * @Description  :
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentCaseService {
  constructor(private readonly configService: ConfigService) {}

  getEnvironment() {
    return {
      BAR: this.configService.get<string>('BAR'),
      FOO: this.configService.get<string>('FOO_BAR'),
    };
  }
}
