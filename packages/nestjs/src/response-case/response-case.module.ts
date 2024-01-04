import { Module } from '@nestjs/common';
import { ResponseCaseController } from './response-case.controller';

@Module({
  controllers: [ResponseCaseController]
})
export class ResponseCaseModule {}
