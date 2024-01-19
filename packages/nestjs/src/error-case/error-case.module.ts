/*
 * @Date         : 2024-01-16 19:19:00 星期2
 * @Author       : xut
 * @Description  :
 */
import { Module } from '@nestjs/common';
import { ErrorCaseController } from './error-case.controller';

@Module({
  controllers: [ErrorCaseController],
})
export class ErrorCaseModule {}
