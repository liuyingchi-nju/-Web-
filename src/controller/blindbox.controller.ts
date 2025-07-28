import {
  Inject,
  Controller,
  Init,
  Get,
  Options,
  Query,
  Body,
  Put,
  Patch,
  Post,
  Files,
  Fields,
  Del
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import {BlindBoxService} from "../service/blindbox.service";
import {GoodsService} from "../service/goods.service";
import {InjectEntityModel} from "@midwayjs/typeorm";
import {Repository} from "typeorm";
import { BlindBox } from '../entity/blindbox.entity';
import {PicturesService} from "../service/pictures.service";

@Controller("/blindbox")
export class BlindBoxController{
  @Inject()
  ctx: Context;

  @Inject()
  blindBoxService:BlindBoxService

  @Inject()
  goodsService:GoodsService

  @InjectEntityModel(BlindBox)
  blindBoxModel: Repository<BlindBox>;

  @Inject()
  picturesService:PicturesService

  @Init()
  async init() {
    await this.goodsService.initDefaultGoods();
    if (await this.blindBoxModel.count()===0) {
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒',
        avatarPath: 'http://127.0.0.1:7001/pictures/1.png',
        num: 1500,
        price:20
      });
      await this.blindBoxService.addGoodToBlindBox(1,1);
      await this.blindBoxService.addGoodToBlindBox(1,2);
      await this.blindBoxService.addGoodToBlindBox(1,3);
      await this.blindBoxService.addGoodToBlindBox(1,4);
      await this.blindBoxService.addGoodToBlindBox(1,6);
      await this.blindBoxService.createBlindBox({
        name: '游戏道具盲盒',
        avatarPath: 'http://127.0.0.1:7001/pictures/2.png',
        num: 10,
        price:88,
      });
      await this.blindBoxService.addGoodToBlindBox(2,5);
      await this.blindBoxService.addGoodToBlindBox(2,10);
      await this.blindBoxService.addGoodToBlindBox(2,11);
      await this.blindBoxService.addGoodToBlindBox(2,12);
      await this.blindBoxService.addGoodToBlindBox(2,13);
      await this.blindBoxService.createBlindBox({
        name: '福利盲盒',
        avatarPath: 'http://127.0.0.1:7001/pictures/1.jpg',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '福利盲盒',
        avatarPath: 'http://127.0.0.1:7001/pictures/3.png',
        num: 3,
        price:100,
      });
      await this.blindBoxService.createBlindBox({
        name: '福利盲盒',
        avatarPath: 'http://127.0.0.1:7001/pictures/4.png',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '福利盲盒',
        avatarPath: 'http://127.0.0.1:7001/pictures/5.png',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '福利盲盒',
        avatarPath: 'http://127.0.0.1:7001/pictures/6.png',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '福利盲盒',
        avatarPath: 'http://127.0.0.1:7001/pictures/7.png',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '福利盲盒',
        avatarPath: 'http://127.0.0.1:7001/pictures/8.png',
        num: 3,
        price:100
      });
    }
  }

  @Get("/information")
  async getInformation(@Query('page') page:number){
    return await this.blindBoxService.getBlindBoxesByPage(Number(page), 7, false)
  }

  @Options('/information')
  async MainInformation(){
    return {success:true};
  }

  @Get('/details')
  async getDetails(@Query('id') id: number) {
    if (!id) {
      return { success: false, message: '缺少id参数' };
    }
    const blindBox=await this.blindBoxService.getBlindBoxById(id,true);
    if (blindBox===undefined||blindBox===null){
      throw new Error("盲盒信息不存在");
    }else{
      return blindBox;
    }
  }



  @Options("/details")
  async gAllInformation(){
    return {success:true};
  }

  @Get("/specialinformation")
  async searchBlindBoxes(
    @Query('keyword') keyword: string,
    @Query('page') page: number,
  ) {
    return await this.blindBoxService.searchBlindBoxes(keyword, Number(page));
  }

  @Options('/specialinformation')
  async searchOptions() {
    return { success: true };
  }

  @Post('/')
  async createBlindBox(
    @Files() files: Array<{ filename: string; data: Buffer; fieldName: string }>,
    @Fields() fields: { name: string; price: string; num: string }
  ) {
    let avatarPath = 'http://127.0.0.1:7001/pictures/nopicture.jpg';
    if (files && files.length > 0) {
      const avatarFile = files.find(f => f.fieldName === 'avatar');
      if (avatarFile) {
        const [savedFileName] = await this.picturesService.savePictures([avatarFile]);
        avatarPath = `http://127.0.0.1:7001/pictures/${savedFileName}`;
      }
    }
    await this.blindBoxService.createBlindBox({
      name: fields.name,
      price: Number(fields.price),
      num: Number(fields.num),
      avatarPath
    });
    return { success: true };
  }

  @Options('/')
  async creatOptions() {
    return { success: true };
  }

  @Del('/')
  async deleteBlindBox(@Query('id') id:number){
    const blindBox=await this.blindBoxService.getBlindBoxById(id);
    if (blindBox===null||blindBox===undefined){
      throw new Error("找不到该id的盲盒")
    }
    await this.blindBoxService.deleteBlindBox(id);
    return {success: true};
  }

  @Put('/price')
  async editPrice(@Body() body: {id: number ,price:number}){
    const blindBox=await this.blindBoxService.getBlindBoxById(body.id);
    if (blindBox===null||blindBox===undefined){
      throw new Error("找不到该id的盲盒")
    }
    await this.blindBoxService.updateBlindBox(body.id,{price:body.price})
    return {success:true};
  }

  @Options('/price')
  async priceOptions() {
    return { success: true };
  }


  @Put('/num')
  async editNum(@Body() body: {id: number ,num:number}){
    const blindBox=await this.blindBoxService.getBlindBoxById(body.id);
    if (blindBox===null||blindBox===undefined){
      throw new Error("找不到该id的盲盒")
    }
    await this.blindBoxService.updateBlindBox(body.id,{num:body.num})
    return {success:true};
  }

  @Options('/num')
  async numOptions() {
    return { success: true };
  }

  @Put('/name')
  async editName(@Body() body: {id: number ,name:string}){
    const blindBox=await this.blindBoxService.getBlindBoxById(body.id);
    if (blindBox===null||blindBox===undefined){
      throw new Error("找不到该id的盲盒")
    }
    await this.blindBoxService.updateBlindBox(body.id,{name:body.name})
    return {success:true};
  }

  @Options('/name')
  async nameOptions() {
    return { success: true };
  }

  @Get('/goods')
  async getGoods(@Query('id') id:number){
    const blindBox=await this.blindBoxService.getBlindBoxById(id,true);
    return {success:true,data:blindBox.goods}
  }

  @Options('/goods')
  async goodsOptions() {
    return { success: true };
  }

  @Patch('/goods')
  async removeGoods(@Body() body:{blindBoxId:number,goodsId:number,isExist:boolean}){
    const blindBox=await this.blindBoxService.getBlindBoxById(body.blindBoxId);
    if (blindBox===null||blindBox===undefined){
      throw new Error("盲盒不存在");
    }
    const result=await this.blindBoxService.isGoodsInBlindBox(body.blindBoxId,body.goodsId);
    if (body.isExist!==result){
      throw new Error("非法参数")
    }else {
      if (body.isExist){
        await this.blindBoxService.removeGoodsFromBlindBox(body.blindBoxId,body.goodsId);
      }else {
        await this.blindBoxService.addGoodToBlindBox(body.blindBoxId,body.goodsId);
      }
      return {success:true};
    }
  }
}
