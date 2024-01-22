import { Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger: LoggerService = new Logger('AppService');

  getHello(): string {
    this.logger.debug('log debug message');
    return 'Hello World By Nestjs integrate vite and swc !!!';
  }
}
