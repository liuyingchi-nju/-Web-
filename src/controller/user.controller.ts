import {Controller, Get} from "@midwayjs/core";

@Controller('/user')
export class UserController{

  @Get('/data')
  async getUserData(){

  }


}
