/*
 * @Date         : 2024-01-22 14:09:47 星期1
 * @Author       : xut
 * @Description  :
 */
import { Injectable, LoggerService } from '@nestjs/common';
import { winstonLogger } from './winston-logger';

export type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug' | 'silly';

@Injectable()
export class CustomLogger implements LoggerService {
  private readonly logger = winstonLogger;

  child(options: object) {
    return this.logger.child(options);
  }

  log(message: string, level: LogLevel, meta?: any) {
    this.logger.log(level, message, meta);
  }
  error(message: string, meta?: any) {
    this.logger.error(message, meta);
  }
  warn(message: string, meta?: any) {
    this.logger.error(message, meta);
  }
  info(message: string, meta?: any) {
    this.logger.error(message, meta);
  }
  debug(message: string, meta?: any) {
    this.logger.error(message, meta);
  }
  silly(message: string, meta?: any) {
    this.logger.error(message, meta);
  }
}
