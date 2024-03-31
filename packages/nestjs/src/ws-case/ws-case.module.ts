import { Module } from '@nestjs/common';
import { WsCaseGateway } from './ws-case.gateway';
import { WsCaseController } from './ws-case.controller';

@Module({
  providers: [WsCaseGateway],
  controllers: [WsCaseController],
})
export class WsCaseModule {}
