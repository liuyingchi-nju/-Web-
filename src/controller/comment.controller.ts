import {Controller, Fields, Files, Get, Inject, Options, Param, Post} from '@midwayjs/core';
import {Context} from "@midwayjs/koa";
import {PicturesService} from "../service/pictures.service";
import {UserService} from "../service/user.service";
import {CommentService} from "../service/comment.service";
import {OrderService} from "../service/order.service";

@Controller('/comments')
export class CommentController {

  @Inject()
  ctx: Context;

  @Inject()
  picturesService:PicturesService

  @Inject()
  userService:UserService

  @Inject()
  commentService:CommentService

  @Inject()
  orderService:OrderService
  @Options('/')
  async creat(){
    return {success:true};
  }

  @Post('/')
  async createComment(
    @Files() files: Array<{ filename: string; data: Buffer; fieldName: string }>,
    @Fields() fields: { content?: string; name:string,blindBoxId: string },
  ) {
    const user=await this.userService.getUserByName(fields.name)
    if (!user){
      this.ctx.status=400;
    }
    let imagePaths: string[] = [];
    if (files && files.length > 0) {
      const images = files.filter(f => f.fieldName === 'images');
      imagePaths = await this.picturesService.savePictures(images);
    }
    const comment = await this.commentService.createComment({
      userId: (await this.userService.getUserByName(fields.name)).id,// 假设 userName 是用户ID
      blindboxId: parseInt(fields.blindBoxId),
      content: fields.content,
      imagePaths,
    });

    return { success: true, data: comment };
  }

  @Get('/:blindBoxId')
  async getComments(@Param('blindBoxId') blindBoxId:number ) {
    return await this.commentService.getCommentsByBlindBoxId(blindBoxId);
  }

  @Get('/:name/:blindBoxId/comment-permission')
  async getPermission(@Param('blindBoxId') blindBoxId: number,
                      @Param('name') name: string){
    const user=await this.userService.getUserByName(name);
    if (!user){
      this.ctx.status=400;
    }
    const orderList=await this.orderService.getUserOrders(user);
    for (let i=0;i<orderList.length;i++){
      if (orderList[i].blindBoxId===blindBoxId){
        return {success:true}
      }
    }
    return {success:false}
  }

  @Options('/:name/:blindBoxId/comment-permission')
  async Permission(){
    return {success :true}
  }

}
