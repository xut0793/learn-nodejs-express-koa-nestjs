/*
 * @Date         : 2023-12-23 12:08:55 星期6
 * @Author       : xut
 * @Description  :
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestCaseModule } from './request-case/request-case.module';
import { ResponseCaseModule } from './response-case/response-case.module';
// import { ZodSerializerInterceptor } from 'nestjs-zod';
// import { APP_INTERCEPTOR } from '@nestjs/core';
import { RenderCaseModule } from './render-case/render-case.module';
import { EnvironmentCaseModule } from './environment-case/environment-case.module';
import { envConfigValidate } from './common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: [
        './src/common/config/.env.local',
        `./src/common/config/.env.${process.env.NODE_ENV}`,
        './src/common/config/.env',
      ],
      validate: envConfigValidate,
    }),
    RequestCaseModule,
    ResponseCaseModule,
    RenderCaseModule,
    EnvironmentCaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
