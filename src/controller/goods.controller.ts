import {Inject, Controller, Init, Get, Options, Post, Files, Fields, Param} from '@midwayjs/core';
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

  @Get('/:page')
  async getGoodsList(@Param('page') page: number = 1){
    return await this.goodsService.getAllGoods(page, 7);
  }

  @Options('/:page')
  async GoodsList(){
    return{success:true};
  }

  @Get('/:keyword/:page')
  async getGoodsByKeywords(@Param('page') page: number = 1, @Param('keyword') keyword: string){
    if (keyword.length>0) {
      const result = await this.goodsService.searchGoodsByName(keyword, page, 7);
      return {
        data: result.data,
        totalPages: Math.ceil(result.count / 7)
      };
    }else {
      return this.getGoodsList(page);
    }
  }

  @Options('/:keywords/:page')
  async searchOptions(){
    return {success: true};
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


  @Options('/')
  async creatOptions(){
    return {success: true};
  }


}
