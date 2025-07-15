import {Inject, Controller, Post, Body} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import {OrderService} from "../service/order.service";
import {BlindBoxService} from "../service/blindbox.service";
import {UserService} from "../service/user.service";
import {RedisService} from '@midwayjs/redis';

@Controller("/order")
export class OrderController {
  @Inject()
  ctx: Context;

  @Inject()
  orderService: OrderService;

  @Inject()
  blindBoxService: BlindBoxService;

  @Inject()
  userService: UserService;

  @Inject()
  redisService: RedisService;

  @Post('/')
  async postOrder(@Body() body: {name: string, id: number}) {
    const {name, id} = body;
    const lockKey = `blindbox:lock:${id}`;
    const lockTimeout = 5000; // 锁超时时间5秒

    try {
      // 1. 获取分布式锁
      const lockAcquired = await this.redisService.set(
        lockKey,
        'locked',
        'PX',
        lockTimeout,
        'NX'
      );

      if (!lockAcquired) {
        throw new Error('系统繁忙，请稍后再试');
      }

      // 2. 查询用户和盲盒信息
      const [user, blindBox] = await Promise.all([
        this.userService.getUserByName(name),
        this.blindBoxService.getBlindBoxById(id, true)
      ]);

      if (!user) {
        throw new Error('用户不存在');
      }
      if (!blindBox) {
        throw new Error('盲盒不存在');
      }
      if (blindBox.num <= 0) {
        throw new Error('该盲盒已售罄');
      }

      // 3. 检查用户余额（假设盲盒价格为固定值或从盲盒实体获取）
      const blindBoxPrice = 100; // 示例价格，可根据实际需求调整
      if (user.balance < blindBoxPrice) {
        throw new Error('余额不足');
      }

      // 4. 创建订单并更新库存（事务操作）
      const order = await this.orderService.createOrder(user, blindBoxPrice);

      // 更新盲盒库存
      blindBox.num -= 1;
      await this.blindBoxService.blindBoxModel.save(blindBox);

      // 扣除用户余额
      user.balance -= blindBoxPrice;
      await this.userService.userRepo.save(user);

      return {
        success: true,
        message: '购买成功',
        data: {
          orderId: order.id,
          remaining: blindBox.num
        }
      };
    } catch (error) {
      this.ctx.status = 400;
      return {
        success: false,
        message: error.message
      };
    } finally {
      // 释放锁
      await this.redisService.del(lockKey);
    }
  }
}
