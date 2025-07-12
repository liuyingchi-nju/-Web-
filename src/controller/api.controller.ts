import {Inject, Controller, Get, Body, Options, Post} from '@midwayjs/core';
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

  @Post('/register')
  async register(@Body() body: { name: string, password: string }) {
    const checking=await this.userService.getUserByName(body.name);
    if (checking===undefined||checking===null) {
      await this.userService.createUser(body.name, body.password);
      return {success: true,message:"注册成功"}
    }
    throw new Error('用户名已存在');
  }

  @Options('/register')
  async handleOptions() {
    return { success: true }; // 直接返回 200
  }

  @Get('/')
  async temp(){
    return 'it is a test'
  }
}
