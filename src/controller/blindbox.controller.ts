import {Inject, Controller, Init, Get, Options, Query} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import {BlindBoxService} from "../service/blindbox.service";
import {GoodsService} from "../service/goods.service";
import {InjectEntityModel} from "@midwayjs/typeorm";
import {Repository} from "typeorm";
import { BlindBox } from '../entity/blindbox.entity';

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

  @Init()
  async init() {
    await this.goodsService.initDefaultGoods();
    if (await this.blindBoxModel.count()===0) {
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒1',
        avatarPath: 'http://127.0.0.1:7001/pictures/nopicture.jpg',
        num: 3,
        price:100
      });
      await this.blindBoxService.addGoodToBlindBox(1,1);
      await this.blindBoxService.addGoodToBlindBox(1,2);
      await this.blindBoxService.addGoodToBlindBox(1,3);
      await this.blindBoxService.addGoodToBlindBox(1,4);
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒2',
        avatarPath: 'http://127.0.0.1:7001/pictures/1.jpg',
        num: 3,
        price:100,
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒3',
        avatarPath: 'http://127.0.0.1:7001/pictures/1.jpg',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒4',
        avatarPath: 'http://127.0.0.1:7001/pictures/1.jpg',
        num: 3,
        price:100,
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒5',
        avatarPath: 'http://127.0.0.1:7001/pictures/nopicture.jpg',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒6',
        avatarPath: 'http://127.0.0.1:7001/pictures/nopicture.jpg',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒7',
        avatarPath: 'http://127.0.0.1:7001/pictures/nopicture.jpg',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒8',
        avatarPath: 'http://127.0.0.1:7001/pictures/nopicture.jpg',
        num: 3,
        price:100
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒9',
        avatarPath: 'http://127.0.0.1:7001/pictures/nopicture.jpg',
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
  async getDetails(@Query('id') id: string) {
    if (!id) {
      return { success: false, message: '缺少id参数' };
    }
    return await this.blindBoxService.getBlindBoxById(Number(id),true);
  }


  @Options("/details")
  async gAllInformation(){
    return {success:true};
  }



}
