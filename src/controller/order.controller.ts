import {Inject, Controller, Post, Body, Options, Get, Patch, Param} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { OrderService } from "../service/order.service";
import { BlindBoxService } from "../service/blindbox.service";
import { UserService } from "../service/user.service";
import { Mutex } from '../util/mutex';

@Controller("/orders")
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
  async postOrder(@Body() body: { name: string, id: number}) {
        await this.mutex.lock();
    try {
      const user=await this.userService.getUserByName(body.name);
      const blindBox=await this.blindBoxService.getBlindBoxById(body.id);
      const price=blindBox.price;
      if (!user||!blindBox||blindBox.num<=0){
        this.ctx.status=400;
        return;
      }
      let blindBoxPrice = 0;
      if (user.isVIP){
        blindBoxPrice = Math.round(price*0.9*100) / 100;
      }else {
        blindBoxPrice = Math.round(price*100) / 100;
      }
      if (user.balance < blindBoxPrice) throw new Error('余额不足');
      const order = await this.orderService.createOrder(user, blindBoxPrice,body.id);
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

  @Options('/todo-list/:page')
  async option(){
    return{success:true};
  }

  @Get('/todo-list/:page')
  async getUnfinishedOrders(
    @Param('page') page: number = 1,
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
      this.ctx.status = 400;
      return {
        success: false,
        message: error.message || '获取未发货订单列表失败'
      };
    }
  }

  @Get('/:id')
  async getDetail(@Param('id') id: number){
    if (await this.orderService.getOrderById(id)!==null&&await this.orderService.getOrderById(id)!==undefined){
      return await this.orderService.getOrderById(id);
    }
    throw new Error("订单不存在")
  }

  @Options('/:id')
  async detailOptions(){
    return {success:true};
  }

  @Patch('/:id/status')
  async updateConditions(@Body() body: {mode:string},
  @Param('id') id:number){
    if (body.mode==='isSent'){
      try {
        await this.orderService.updateOrderStatus(id,{isSent:true});
        return {success:true};
      }catch (error){
        this.ctx.status=400;
        return {success:false}
      }
    }else if (body.mode==='isReceived'){
      const order=await this.orderService.getOrderById(id);
      if (order&&order.isSent){
        try {
          await this.orderService.updateOrderStatus(id,{isReceived:true,isDone:true});
          return {success:true};
        }catch (error){
          this.ctx.status=400;
          return {success:false}
        }
      }
      this.ctx.status=400;
    }
    //
    this.ctx.status=400
  }

  @Options('/:id/status')
  async conditionOptions(){
    return {success:true};
  }

  @Patch('/:id/address&contactNumber')
  async updateAddressAndContact(@Body() body: {address:string,contact:number},
                                @Param('id') id:number){
    const order=this.orderService.getOrderById(id);
    if (!order){
     this.ctx.status=400;
     return ;
    }
    if (!body.contact||!body.address){
      this.ctx.status=400;
      return ;
    }
    await this.orderService.updateOrderStatus(id,{address:body.address,contactNumber:body.contact});
    return {success:true,message:"修改成功"};
  }

  @Options('/:id/address&contactNumber')
  async theAddressContactOption(){
    return {success:true};
  }


}
