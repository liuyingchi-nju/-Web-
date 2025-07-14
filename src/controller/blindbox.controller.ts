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
  async initData(){
    if (await this.blindBoxModel.count()===0) {
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒1',
        avatarPath: '/pictures/nopicture.jpg',
        num: 3
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒2',
        avatarPath: '/pictures/1.jpg',
        num: 3
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒3',
        avatarPath: '/pictures/1.jpg',
        num: 3
      });
      await this.blindBoxService.createBlindBox({
        name: '应用福利盲盒4',
        avatarPath: '/pictures/1.jpg',
        num: 3
      });
    }

  }

  @Get("/information")
  async getInformation(){
    const page=this.ctx.get('PAGE')
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
    return await this.blindBoxService.getBlindBoxById(Number(id));
  }


  @Options("/details")
  async gAllInformation(){
    return {success:true};
  }



}
