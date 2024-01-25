/*
 * @Date         : 2023-12-23 12:08:55 星期6
 * @Author       : xut
 * @Description  :
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppModule (e2e)', () => {
  let app: INestApplication;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    request = supertest(app.getHttpServer());
  });

  afterAll(() => {
    app = null;
    request = null;
  });

  it.only('Get /', async () => {
    const res = await request.get('/');

    expect(res.ok).toBeTruthy();
    expect(res.text).toMatch(/Hello World/);
  });
});
