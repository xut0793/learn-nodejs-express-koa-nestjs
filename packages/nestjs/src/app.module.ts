/*
 * @Date         : 2023-12-23 12:08:55 星期6
 * @Author       : xut
 * @Description  :
 */
import { Global, Logger, Module } from '@nestjs/common';
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
import { ErrorCaseModule } from './error-case/error-case.module';
import { LogCaseModule } from './log-case/log-case.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './common/interceptor/logger.interceptor';
import { TestCaseModule } from './test-case/test-case.module';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { AllExceptionFilter } from './common/filter/all-exception.filter';
import { PrismaModule } from './prisma-case/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AuthZModule } from 'nest-authz';

@Global()
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
    ErrorCaseModule,
    LogCaseModule,
    TestCaseModule,
    PrismaModule,
    AuthModule,
    UserModule,
    AuthZModule.register({
      model: 'rbac.model.conf',
      policy: 'rbac.policy.csv',
      usernameFromContext: (ctx) => {
        const req = ctx.switchToHttp().getRequest();
        return req.user && req.user.uid;
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    Logger,
    AppService,
    // { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
  ],
  exports: [Logger],
})
export class AppModule {}
