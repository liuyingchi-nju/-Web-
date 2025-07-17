import {Body, Controller, Get, Init, Inject, Options, Patch, Post, Query} from "@midwayjs/core";
import { UserService } from '../service/user.service';
import {Context} from "@midwayjs/koa";

@Controller('/user')
export class UserController{

  @Inject()
  ctx: Context;

  @Inject()
  userService: UserService;

  @Init()
  async initData() {
    await this.userService.createAdmin("root", "root");//创建管理员
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

  @Post('/admin')
  async check(@Body() body: { name: string, password: string }) {
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

  @Post('/token')
  async login(@Body() body: { name: string, password: string }) {
    const user=await this.userService.getUserByName(body.name);
    if (user!==undefined&&user!==null) {
      if (user.password===body.password){
          //传回用户信息
        const token=Math.random();
        await this.userService.updateUser(user.id, {token:token.toString()})
        return {
          success: true,
          data:{token:token},//前端后端数据沟通使用保存在前端的密钥
          message: '登录成功'
        };
      }else {
        throw new Error('用户密码错误');
      }
    }else {
      throw new Error('用户名不存在');
    }
  }

  @Options('/token')
  async handleOptionsLogIn() {
    return { success: true }; // 直接返回 200
  }

  @Get('/admin')
  async checkAdministrator(){
    const name = this.ctx.get('X-User-Name');
    const  token = this.ctx.get('X-User-Token');
    const user=await this.userService.getUserByName(name);
    if (user===null||user===undefined){
      throw new Error('用户不存在')
    }
    if (user.isAdministrator&&user.token===token){
      return {success:true}
    }else {
      throw new Error('验证失败')
    }
  }

  @Options('/admin')
  async handleOptionsAdmin() {
    return { success: true }; // 直接返回 200
  }

  @Patch('/balance')
  async changeBalance(@Body() body: {
    name: string;
    amount: number;
  },){
    const user=await this.userService.getUserByName(body.name);
    const newBalance=user.balance+body.amount;
    await this.userService.updateUser(user.id,{balance: newBalance})
    return {success:true,balance:newBalance}
  }

  @Get('/balance')
  async getBalance(@Query('name') name: string){
    const user=await this.userService.getUserByName(name);
    return {success:true,balance:user.balance}
  }

  @Options('/balance')
  async balance(){
    return {success: true}
  }
}
