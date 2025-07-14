import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entity/comment.entity';
import {User} from "../entity/user.entity";
import {BlindBox} from "../entity/blindbox.entity";

@Provide()
export class CommentService {
  @InjectEntityModel(Comment)
  commentModel: Repository<Comment>;

  // 1. 添加评论
  async createComment(commentData: {
    userId: number;
    blindboxId: number;
    content?: string;
    imagePaths?: string[];
  }) {
    const comment = new Comment();
    comment.user = { id: commentData.userId } as User;
    comment.blindbox = { id: commentData.blindboxId } as BlindBox;
    comment.content = commentData.content;
    comment.imagePaths = commentData.imagePaths || [];

    return await this.commentModel.save(comment);
  }

  // 2. 根据ID删除评论
  async deleteCommentById(id: number) {
    const result = await this.commentModel.delete(id);
    return result.affected > 0;
  }

  // 3. 获取盲盒的所有评论（不分页）
  async getCommentsByBlindBoxId(blindboxId: number) {
    return await this.commentModel.find({
      where: { blindbox: { id: blindboxId } },
      relations: ['user'], // 关联用户信息
      order: { createdAt: 'DESC' } // 按时间倒序
    });
  }

  // 4. 获取用户的所有评论（不分页）
  async getCommentsByUserId(userId: number) {
    return await this.commentModel.find({
      where: { user: { id: userId } },
      relations: ['blindbox'], // 关联盲盒信息
      order: { createdAt: 'DESC' }
    });
  }
}
