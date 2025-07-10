import {Controller, Get, Inject} from "@midwayjs/core";
import {Context} from "@midwayjs/koa";

@Controller('/log')
export class LogController {

  @Inject()
  ctx: Context;

  @Get('/')
  async User():Promise<string> {
    return "you are in log viewing"
  }
}
