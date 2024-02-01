import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaTestController } from './prisma-test.controller';
import { PrismaTestService } from './prisma-test.service';

@Module({
  providers: [PrismaService, PrismaTestService],
  controllers: [PrismaTestController],
  exports: [PrismaService],
})
export class PrismaModule {}
