import {Inject, Controller, Init} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import {GoodsService} from "../service/goods.service";
import {InjectEntityModel} from "@midwayjs/typeorm";
import {Repository} from "typeorm";

@Controller("/goods")
export class Goods{
  @Inject()
  ctx: Context;

  @Inject()
  goodsService:GoodsService

  @InjectEntityModel(Goods)
  goodsModel: Repository<Goods>;

  @Init()
  async initData(){
    if (await this.goodsModel.count()===0) {
      await this.goodsService.createGoods({name: "芒果TV月卡", avatarPath: "../data/pictures/mangotv.jpg"})
      await this.goodsService.createGoods({name: "QQ音乐三天绿钻体验卡"})
      await this.goodsService.createGoods({name: "bilibili大会员月卡"})
      await this.goodsService.createGoods({name: "百度网盘不限速体验卡50张"})
      await this.goodsService.createGoods({name: "三国杀移动版66宝珠兑换码"})
      await this.goodsService.createGoods({name: "京东200元礼品卡"})
      await this.goodsService.createGoods({name: "腾讯视频会员三折券"})
      await this.goodsService.createGoods({name: "QQ音乐一天绿钻体验卡"})
      await this.goodsService.createGoods({name: "QQ音乐绿钻月卡"})
    }
  }
}
