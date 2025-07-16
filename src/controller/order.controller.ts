import { Inject, Controller, Post, Body } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { OrderService } from "../service/order.service";
import { BlindBoxService } from "../service/blindbox.service";
import { UserService } from "../service/user.service";
import { Mutex } from '../util/mutex';

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

  private mutex = new Mutex();

  @Post('/')
  async postOrder(@Body() body: { name: string, id: number }) {
    const { name, id } = body;

    await this.mutex.lock();

    try {
      const [user, blindBox] = await Promise.all([
        this.userService.getUserByName(name),
        this.blindBoxService.getBlindBoxById(id, true)
      ]);

      if (!user) throw new Error('用户不存在');
      if (!blindBox) throw new Error('盲盒不存在');
      if (blindBox.num <= 0) throw new Error('该盲盒已售罄');

      const blindBoxPrice = 100;
      if (user.balance < blindBoxPrice) throw new Error('余额不足');

      const order = await this.orderService.createOrder(user, blindBoxPrice);
      blindBox.num -= 1;
      await this.blindBoxService.blindBoxModel.save(blindBox);

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
      this.mutex.unlock();
    }
  }
}
