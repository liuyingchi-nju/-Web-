import {Inject, Controller, Post, Body, Options, Get, Query, Patch} from '@midwayjs/core';
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
  async postOrder(@Body() body: { name: string, id: number ,price:number}) {
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
      let blindBoxPrice = 0;
      if (user.isVIP){
        blindBoxPrice = Math.round(body.price*0.9*100) / 100;
      }else {
        blindBoxPrice = Math.round(body.price*100) / 100;
      }
      if (user.balance < blindBoxPrice) throw new Error('余额不足');

      const order = await this.orderService.createOrder(user, blindBoxPrice,id);
      blindBox.num -= 1;
      await this.blindBoxService.blindBoxModel.save(blindBox);
      user.balance -= blindBoxPrice;
      await this.userService.userRepo.save(user);
      return {
        success: true,
        message: '购买成功',
        order:order,
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

  @Options('/')
  async creatOption(){
    return {success:true};
  }

  @Options('/unsentlist')
  async option(){
    return{success:true};
  }

  @Get('/unsentlist')
  async getUnfinishedOrders(
    @Query('page') page: number = 1,
  ) {
    try {
      // 添加分页参数，默认第一页，每页10条
      const result = await this.orderService.getUnsentOrders(page, 5);
      return {
        success: true,
        data: result.orders,
        total: result.total,
        page:page,
        pageSize:5,
        message: '获取未发货订单列表成功'
      };
    } catch (error) {
      this.ctx.status = 500;
      return {
        success: false,
        message: error.message || '获取未发货订单列表失败'
      };
    }
  }

  @Get('/detail')
  async getDetail(@Query('id') id: number){
    if (await this.orderService.getOrderById(id)!==null&&await this.orderService.getOrderById(id)!==undefined){
      return await this.orderService.getOrderById(id);
    }
    throw new Error("订单不存在")
  }

  @Options('/detail')
  async detailOptions(){
    return {success:true};
  }

  @Patch('/condition')
  async updateConditions(@Body() body: {  orderId: number,mode:string}){
    if (body.mode==='isSent'){
      await this.orderService.updateOrderStatus(body.orderId,{isSent:true});
      return {success:true};
    }else if (body.mode==='isReceived'){
      const order=await this.orderService.getOrderById(body.orderId);
      if (order&&order.isSent){
        await this.orderService.updateOrderStatus(body.orderId,{isReceived:true,isDone:true});
        return {success:true};
      }
      throw new Error("修改失败")
    }
    throw new Error("暂不支持其他订单状态修改模式")
  }

  @Options('/condition')
  async conditionOptions(){
    return {success:true};
  }


}
