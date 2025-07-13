import {Inject, Controller, Init, Get, Options} from '@midwayjs/core';
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
  async initData(){
    if (await this.blindBoxModel.count()===0) {
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒1',
        avatarPath: '../data/pictures/nopicture.jpg',
        num: 3
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒2',
        avatarPath: '../data/pictures/nopicture.jpg',
        num: 3
      });
    }

  }

  @Get("/maininformation")
  async getMainInformation(){
    const page=this.ctx.get('PAGE')
    return await this.blindBoxService.getBlindBoxesByPage(Number(page), 7, false)
  }

  @Options('/maininformation')
  async MainInformation(){
    return {success:true};
  }

  @Get("/allinformation")
  async getAllInformation(){

  }


}
