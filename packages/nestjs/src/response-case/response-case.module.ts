import { Module } from '@nestjs/common';
import { ResponseCaseController } from './response-case.controller';
import { ResponseSerializationController } from './response-serialization.controller';

@Module({
  controllers: [ResponseCaseController, ResponseSerializationController],
})
export class ResponseCaseModule {}
