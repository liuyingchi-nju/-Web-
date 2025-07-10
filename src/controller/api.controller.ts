import {Inject, Controller, Get, Post} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { UserService } from '../service/user.service';

@Controller('/api')
export class APIController {
  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

  /*@Get('/get_user')
  async getUsers(@Query('uid') uid) {
    const user = await this.userService.getUser({ uid });
    return { success: true, message: 'OK', data: user };
  }*/

  @Get('/get_user')
  async getUser() {
    return [{id: 1, name: 'Alice'}];
  }

  @Post('/creat_user')
  async creatUser(){

  }
}
