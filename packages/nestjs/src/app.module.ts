import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestCaseModule } from './request-case/request-case.module';

@Module({
  imports: [RequestCaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
