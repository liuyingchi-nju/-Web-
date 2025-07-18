import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import * as upload from '@midwayjs/upload';
import * as typeorm from '@midwayjs/typeorm';
import { join } from 'path';
// import { DefaultErrorFilter } from './filter/default.filter';
// import { NotFoundFilter } from './filter/notfound.filter';
import { ReportMiddleware } from './middleware/report.middleware';


@Configuration({
  imports: [
    koa,
    validate,
    typeorm,
    upload,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  async onReady() {
    // add middleware
    this.app.useMiddleware([ReportMiddleware]);
    // add filter
    // this.app.useFilter([NotFoundFilter, DefaultErrorFilter]);
    // 添加 CORS 中间件
    this.app.use(async (ctx, next) => {
      ctx.set('Access-Control-Allow-Origin', 'http://localhost:5173'); // 允许前端域名
      ctx.set('Access-Control-Allow-Methods', 'GET, POST, PATCH,PUT, DELETE, OPTIONS');
      ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Name,X-User-Token');
      await next();
    });
  }
}
