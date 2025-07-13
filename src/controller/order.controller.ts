import {Inject, Controller, Init} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import {OrderService} from "../service/order.service";

@Controller("/order")
export class OrderController{
  @Inject()
  ctx: Context;

  @Inject()
  orderService: OrderService;

  @Init()
  async initData(){

  }
}
