import { Entity, Column,PrimaryGeneratedColumn,OneToMany} from 'typeorm';
import {Order} from "./order.entity";

@Entity()
export class BlindBox {
  @PrimaryGeneratedColumn({comment:'盲盒唯一ID'})
  id: number;

  @Column({ comment: '盲盒名称' })
  name: string;
  // 使用 Column 装饰器存储图片路径

  @Column({ nullable: true, comment: '用户头像路径' })
  avatarPath: string;

  @Column({ comment: '产品介绍' })
  introduction:string;

  @OneToMany(()=>Order,undefined,{nullable:true})
  orders:Order[]
}
