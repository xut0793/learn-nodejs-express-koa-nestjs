import { Module } from '@nestjs/common';
import { EnvironmentCaseController } from './environment-case.controller';
import { EnvironmentCaseService } from './environment-case.service';

@Module({
  controllers: [EnvironmentCaseController],
  providers: [EnvironmentCaseService]
})
export class EnvironmentCaseModule {}
