import {Inject, Controller, Init, Get, Query, Options, Post, Files, Fields} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import {GoodsService} from "../service/goods.service";
import {InjectEntityModel} from "@midwayjs/typeorm";
import {Repository} from "typeorm";
import {Goods} from "../entity/goods.entity";
import {PicturesService} from "../service/pictures.service";
@Controller("/goods")
export class GoodsController{
  @Inject()
  ctx: Context;

  @Inject()
  goodsService:GoodsService

  @Inject()
  picturesService:PicturesService

  @InjectEntityModel(Goods)
  goodsModel: Repository<Goods>;

  @Init()
  async initData(){
    await this.goodsService.initDefaultGoods();
  }

  @Get('')
  async getAllGoods(@Query('page') page: number = 1, @Query('keyword') keyword?: string){
    if(keyword) {
      const result = await this.goodsService.searchGoodsByName(keyword, page, 7);
      return {
        data: result.data,
        totalPages: Math.ceil(result.count / 7)
      };
    } else {
      return await this.goodsService.getAllGoods(page, 7);
    }
  }

  @Options('/')
  async AllGoods(){
    return{success:true};
  }

  @Post('/')
  async creatGoods(@Files() files: Array<{ filename: string; data: Buffer; fieldName: string }>,
                   @Fields() fields: { name: string}){
    let avatarPath = 'http://127.0.0.1:7001/pictures/nopicture.jpg';
    if (files && files.length > 0) {
      const avatarFile = files.find(f => f.fieldName === 'avatar');
      if (avatarFile) {
        const [savedFileName] = await this.picturesService.savePictures([avatarFile]);
        avatarPath = `http://127.0.0.1:7001/pictures/${savedFileName}`;
      }
    }
    await this.goodsService.createGoods({name:fields.name,avatarPath:avatarPath});
    return {success:true};
  }


}
