import {Body, Controller, Get, Init, Inject, Options, Param, Patch, Post,} from "@midwayjs/core";
import { UserService } from '../service/user.service';
import {Context} from "@midwayjs/koa";
import {OrderService} from "../service/order.service";
import {Mutex} from "../util/mutex";

@Controller('/users')
export class UserController{

  @Inject()
  ctx: Context;

  @Inject()
  orderService: OrderService;

  @Inject()
  userService: UserService;

  private mutex = new Mutex();

  @Init()
  async initData() {
    if (await this.userService.userRepo.count()===0){
      await this.userService.createAdmin("root", "root");//创建管理员
      await this.userService.createUser("1","1")
      await this.userService.createUser("2","2")
      await this.userService.createUser("3","3")
      await this.userService.createUser("4","4")
      await this.userService.createUser("5","5")
      await this.userService.createUser("6","6")
      await this.userService.createUser("7","7")
      await this.userService.createUser("8","8")
      await this.userService.createUser("9","9")
      await this.userService.createUser("10","10")
    }
  }

  @Post('/')
  async register(@Body() body: { name: string, password: string }) {
    await this.mutex.lock();
    try {
      const checking=await this.userService.getUserByName(body.name);
      if (checking===undefined||checking===null) {
        await this.userService.createUser(body.name, body.password);
        return {success: true,message:"注册成功"}
      }else {
        throw new Error("用户名已存在")
      }
    } catch (error) {
      this.ctx.status = 400;
      return {
        success: false,
        message: error.message
      };
    } finally {
      this.mutex.unlock();
    }
  }


  @Options('/')
  async handleOptions() {
    return { success: true }; // 直接返回 200
  }

  @Get('/:name/token')
  async login(@Param('name') name:string) {
    const  password = this.ctx.get('X-User-Password');
    const user=await this.userService.getUserByName(name);
    if (user!==undefined&&user!==null) {
      if (user.password===password){
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

  @Options('/:name/token')
  async handleOptionsLogIn() {
    return { success: true }; // 直接返回 200
  }

  @Get('/:name/admin')
  async checkAdministrator(@Param('name') name:string){
    const  token = this.ctx.get('X-User-Token');
    const user=await this.userService.getUserByName(name);
    if (user===null||user===undefined){
      throw new Error('用户不存在')
    }
    if (user.isAdministrator&&user.token===token){
      return {success:true}
    }else {
      return {success:false}
    }
  }

  @Options('/:name/admin')
  async handleOptionsAdmin() {
    return { success: true }; // 直接返回 200
  }

  @Patch('/:name/balance')
  async changeBalance(@Body() body: { amount: number; },
                      @Param('name') name:string){
    const user=await this.userService.getUserByName(name);
    const newBalance=parseFloat((user.balance +body.amount).toFixed(2));
    await this.userService.updateUser(user.id,{balance: newBalance})
    const newUser=await this.userService.getUserByName(name)
    return {success:true,balance:newUser.balance}
  }

  @Get('/:name')
  async getUser(@Param('name') name: string){
    return await this.userService.getUserByName(name);
  }

  @Options('/:name')
  async getOptions(){
    return {success:true};
  }


  @Options('/:name/balance')
  async balance(){
    return {success: true}
  }

  @Patch('/:name/role')
  async changeRole(@Body() body: {token: string},
                   @Param('name') name:string){
    const user=await this.userService.getUserByName(name);
    if (user.token.toString()!==body.token.toString()){
      console.log(`user.token：${user.token}`+` body.token: ${body.token}`)
      throw new Error("登录状态异常")
    }else {
      if (user.balance>=288){
        const balance=user.balance;
        await this.userService.updateUser(user.id,{balance:balance-288,isVIP:true})
        return {success: true,message:"操作成功,您已成为永久VIP!"}
      } else {
        return{success:true,message:"余额不足，请先充值"}
      }
    }
  }

  @Get('/list/:page')
  async getUserList(
    @Param('page') page: number = 1,
  ) {
    return await this.userService.findUsers(page, 5);
  }

  @Get('/list/:keyword/:page')
  async getSpecificUserList(
    @Param('page') page: number = 1,
    @Param('keyword') keyword: string
  ) {
    return await this.userService.findUsers(page, 5, keyword);
  }

  @Options('/list/:keyword/:page')
  async searchOptions(){
    return {success:true};
  }

  @Options('/list/:page')
  async listOptions(){
    return {success:true};
  }

  @Patch('/:id/admin')
  async setAdminRole(@Body() body: {  isAdministrator: boolean },
                     @Param('id') id:number) {
    // 验证当前操作者是否为超级管理员
    const name = this.ctx.get('X-User-Name');
    const  token = this.ctx.get('X-User-Token');
    const currentUser = await this.userService.getUserByName(name);
    if (!currentUser?.isSuperAdministrator || currentUser.token.toString()!==token.toString()||name.toString()!=='root') {
      throw new Error('权限不足');
    }
    const user=await this.userService.getUserById(id);
    if (user.isSuperAdministrator){
      return {success:false,message:"超级管理员管理权限不可移除！"}
    }
    await this.userService.updateUser(id, {
      isAdministrator: body.isAdministrator
    });
    return { success: true };
  }


  @Options('/:name/role')
  async role(){
    return{success:true}
  }

  @Get('/:name/orders')
  async getOrders(@Param('name') name:string){
    if (!name){
      return {success: false,message:'登录状态异常'};
    }
    const user=await this.userService.getUserByName(name)
    if (user===null||user===undefined){
      throw new Error("用户不存在");
    }
    return await this.orderService.getUserOrders(user)
  }

  @Options('/:name/orders')
  async orderOption(){
    return {success:true};
  }
}
