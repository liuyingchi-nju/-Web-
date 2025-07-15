import { MidwayConfig } from '@midwayjs/core';
import * as path from "node:path";
import {User} from "../entity/user.entity";
import {Order} from "../entity/order.entity";
import {BlindBox} from "../entity/blindbox.entity";
import {Goods} from "../entity/goods.entity";
import {Comment} from "../entity/comment.entity";

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
        database: path.join(__dirname, '../data/data.sqlite'),
        synchronize: true,
        logging: true,
        entities: [User,Order,BlindBox,Goods,Comment], // 实体文件路径
        // ...
      }
    }
  },
  redis: {
    client: {
      host: 'localhost', // Redis 服务器地址
      port: 5173,       // Redis 端口
      db:0,
    },
  },
} as MidwayConfig;

