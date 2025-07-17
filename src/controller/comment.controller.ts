import { Controller, Fields, Files, Get, Inject, Options, Post, Query} from '@midwayjs/core';
import {Context} from "@midwayjs/koa";
import {PicturesService} from "../service/pictures.service";
import {UserService} from "../service/user.service";
import {CommentService} from "../service/comment.service";

@Controller('/comment')
export class CommentController {

  @Inject()
  ctx: Context;

  @Inject()
  picturesService:PicturesService

  @Inject()
  userService:UserService

  @Inject()
  commentService:CommentService


  @Options('/')
  async creat(){
    return {success:true};
  }

  @Post('/')
  async createComment(
    @Files() files: Array<{ filename: string; data: Buffer; fieldName: string }>,
    @Fields() fields: { content?: string; userName: string; blindBoxId: string }
  ) {
    // 1. 处理图片上传
    let imagePaths: string[] = [];
    if (files && files.length > 0) {
      const images = files.filter(f => f.fieldName === 'images');
      imagePaths = await this.picturesService.savePictures(images);
    }
    // 2. 创建评论
    const comment = await this.commentService.createComment({
      userId: (await this.userService.getUserByName(fields.userName)).id,// 假设 userName 是用户ID
      blindboxId: parseInt(fields.blindBoxId),
      content: fields.content,
      imagePaths,
    });

    return { success: true, data: comment };
  }

  @Get('/')
  async getComments(@Query('blindboxId') blindboxId: number) {
    return await this.commentService.getCommentsByBlindBoxId(blindboxId);
  }

}
