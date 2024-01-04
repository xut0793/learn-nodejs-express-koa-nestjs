import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestCaseModule } from './request-case/request-case.module';
import { ResponseCaseModule } from './response-case/response-case.module';
// import { ZodSerializerInterceptor } from 'nestjs-zod';
// import { APP_INTERCEPTOR } from '@nestjs/core';
@Module({
  imports: [RequestCaseModule, ResponseCaseModule],
  controllers: [AppController],
  providers: [
    AppService,
    // { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
