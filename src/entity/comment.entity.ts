import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne} from 'typeorm';
import { User } from './user.entity';
import {BlindBox} from "./blindbox.entity";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number; // 评论ID（自增主键）

  @ManyToOne(() => User )
  user: User;

  @Column( { type: 'simple-array',nullable: true })
  imagePaths: string[]; // 评论图片路径数组（允许为空）

  @ManyToOne(() => BlindBox)
  blindbox: BlindBox; // 添加与盲盒的关联

  @Column({nullable:true})
  content: string; // 评论文字内容（可选）

  @CreateDateColumn()
  createdAt: Date;//创建时间保存

}
