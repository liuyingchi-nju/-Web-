import {Inject, Controller, Get, Post, Body} from '@midwayjs/core';
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
  async register(@Body() body: { username: string, password: string }) {
    const checking=await this.userService.getUserByName(body.username);
    if (checking===undefined||checking===null) {
      await this.userService.createUser(body.username, body.password);
      return {success: true,message:"注册成功"}
    }
    throw new Error('用户名已存在');
  }
}
