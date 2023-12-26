/*
 * @Date         : 2023-12-25 23:10:44 星期1
 * @Author       : xut
 * @Description  : 接收上传文件，并全局配置存储路径和保存文件名称
 */
import path from 'node:path';
import type { Express, Request } from 'express';
import { diskStorage } from 'multer';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { RequestCaseController } from './request-case.controller';
import { RequestCookieController } from './request-cookie.controller';
import { RequestFileController } from './request-file.controller';
import { RequestValidationController } from './request-validation.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: path.join(process.cwd(), '/src/request-case/uploads/'),
        filename(
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) {
          const extname = path.extname(file.originalname);
          const filename = file.originalname.replace(extname, '');
          const savedFilename = `global_${filename}_${Date.now()}${extname}`;
          cb(null, savedFilename);
        },
      }),
    }),
  ],
  controllers: [
    RequestCaseController,
    RequestCookieController,
    RequestFileController,
    RequestValidationController,
  ],
})
export class RequestCaseModule {}
