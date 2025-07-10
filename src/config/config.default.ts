import { MidwayConfig } from '@midwayjs/core';
import * as path from "node:path";

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1752053420718_9159',
  koa: {
    port: 7001,
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: path.join(__dirname, 'webapp.sqlite'),
        synchronize: true,
        logging: true,
        entities: ['**/entity/*.entity{.ts,.js}'], // 实体文件路径
        // ...
      }
    }
  }
} as MidwayConfig;

