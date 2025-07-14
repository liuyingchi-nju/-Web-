import {Entity, Column, PrimaryGeneratedColumn, OneToOne} from 'typeorm';
import { User } from './user.entity';
import {BlindBox} from "./blindbox.entity";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number; // 评论ID（自增主键）

  @OneToOne(() => User, )
  user: User;

  @Column('text', { array: true, nullable: true })
  imagePaths: string[]; // 评论图片路径数组（允许为空）

  @OneToOne(() => BlindBox)
  blindbox: BlindBox; // 添加与盲盒的关联

  @Column({ type: 'text' })
  content: string; // 评论文字内容（可选）

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date; // 评论创建时间（自动设置为当前时间）

}
