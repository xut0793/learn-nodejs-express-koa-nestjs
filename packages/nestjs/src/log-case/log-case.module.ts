import { Module } from '@nestjs/common';
import { LogCaseController } from './log-case.controller';
import { LogCaseService } from './log-case.service';

@Module({
  controllers: [LogCaseController],
  providers: [LogCaseService]
})
export class LogCaseModule {}
