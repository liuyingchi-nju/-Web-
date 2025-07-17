import {Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable} from 'typeorm';
import {Order} from "./order.entity";
import {Goods} from "./goods.entity";

@Entity()
export class BlindBox {
  @PrimaryGeneratedColumn({comment:'盲盒唯一ID'})
  id: number;

  @Column({ comment: '盲盒名称' })
  name: string;
  // 使用 Column 装饰器存储图片路径

  @Column({ nullable: true, comment: '图像路径' })
  avatarPath: string;

  @Column({comment:'盲盒份数'})
  num:number

  @Column({comment:'价格'})
  price:number

  @ManyToMany(() => Goods)
  @JoinTable()
  goods: Goods[];

  @OneToMany(()=>Order,undefined,{nullable:true})
  orders:Order[]
}
