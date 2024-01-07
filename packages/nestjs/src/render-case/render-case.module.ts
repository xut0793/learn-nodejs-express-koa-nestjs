import { Module } from '@nestjs/common';
import { RenderCaseController } from './render-case.controller';

@Module({
  controllers: [RenderCaseController]
})
export class RenderCaseModule {}
