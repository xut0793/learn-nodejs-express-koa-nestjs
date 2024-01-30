/*
 * @Date         : 2023-12-23 12:08:55 星期6
 * @Author       : xut
 * @Description  :
 */
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { create } from 'express-handlebars';
import { section } from './render-case/view/helper/index';
import { AppModule } from './app.module';
// import { CustomLogger } from './common/utils/custom-logger';
import { WinstonModule } from 'nest-winston';
import { winstonLogger } from './common/utils/winston-logger';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLogger }),
    // logger: winstonLogger,
    // logger: new CustomLogger(),
  });

  /************************************************
   * 配置 swagger
   ************************************************/
  const swaggerDocumentConfig = new DocumentBuilder()
    .setTitle('learn nestjs')
    .setDescription(
      'This is a simple CRUD API application made with Koa and documented with Swagger',
    )
    .setVersion('0.0.1')
    .addTag('API')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDocumentConfig);
  SwaggerModule.setup('/api/docs', app, document);

  /************************************************
   * 配置 cookie-parser
   ************************************************/
  app.use(cookieParser('__secret__'));

  /************************************************
   * 配置视图模板 handlebars
   ************************************************/
  const viewPath = resolve(process.cwd(), './src/render-case/view');
  const hbs = create({
    extname: 'hbs', // 默认值 .handlebars
    defaultLayout: 'main',
    layoutsDir: resolve(viewPath, 'layout'), // 默认基于 views 的路径 + layouts
    partialsDir: resolve(viewPath, 'partial'), // 默认基于views 的路径 + partials
    helpers: {
      section,
    },
  });
  app.setBaseViewsDir([resolve(viewPath, 'page')]);
  app.setViewEngine('hbs');
  app.engine('hbs', hbs.engine);

  /************************************************
   * 配置 static server
   ************************************************/
  app.useStaticAssets(resolve(process.cwd(), 'public'), {
    prefix: '/static/',
  });

  await app.listen(9003);
  console.log(`🚀 Server running at http://localhost:9003`);
}
bootstrap();
