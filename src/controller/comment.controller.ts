import {Body, Controller, Files, Get, Inject, Options, Post, Query} from '@midwayjs/core';
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
  async creatComment(@Body() body: {userName:string,content:string,blindBoxId:number,},
  @Files() files){
    const user = await this.userService.getUserByName(body.userName);
    if (!user) {
      throw new Error('用户不存在');
    }
    const userId=user.id;
    let newPictureName =await this.picturesService.saveMultiplePictures(files);
    const basePath='http://127.0.0.1:7001/pictures/';
    /*for (let i=0;i<newPictureName.length;i++) {
      newPictureName[i]=basePath+newPictureName[i]
    }*/
    newPictureName = newPictureName.map(filename => basePath + filename);
    await this.commentService.createComment({userId:userId,blindboxId:body.blindBoxId,imagePaths:newPictureName});
  }

  @Get('/')
  async getComments(@Query('blindboxId') blindboxId: number) {
    return await this.commentService.getCommentsByBlindBoxId(blindboxId);
  }

}
