import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestCaseModule } from './request-case/request-case.module';
import { ResponseCaseModule } from './response-case/response-case.module';

@Module({
  imports: [RequestCaseModule, ResponseCaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
