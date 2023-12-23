/*
 * @Date         : 2023-12-23 12:08:55 星期6
 * @Author       : xut
 * @Description  :
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

if (import.meta.env.PROD) {
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
  }
  bootstrap();
}

export const viteNestjsApp = NestFactory.create(AppModule);
