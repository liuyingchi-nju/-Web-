import {Body, Controller, Inject, Options, Post} from "@midwayjs/core";
import { UserService } from '../service/user.service';
import {Context} from "@midwayjs/koa";

@Controller('/user')
export class UserController{

  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

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
  async handleOptionsRegister() {
    return { success: true }; // 直接返回 200
  }

  @Post('/login')
  async login(@Body() body: { name: string, password: string }) {
    const user=await this.userService.getUserByName(body.name);
    if (user!==undefined&&user!==null) {
      if (user.password===body.password){
          //传回用户信息
        const key=Math.random();
        user.key=key;
        return {
          success: true,
          data:{key:key},//前端后端数据沟通使用保存在前端的密钥
          message: '登录成功'
        };
      }else {
        throw new Error('用户密码错误');
      }
    }else {
      throw new Error('用户名不存在');
    }
  }

  @Options('/login')
  async handleOptionsLogIn() {
    return { success: true }; // 直接返回 200
  }

}
