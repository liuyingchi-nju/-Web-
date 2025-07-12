import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne} from 'typeorm';
import {User} from './user.entity'
@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;//订单号

  @ManyToOne(()=>User,undefined,{nullable:true})
  user: User//订单用户

  @CreateDateColumn()
  createdAt: Date;//创建时间保存

  @Column()
  isDone: boolean;//订单状态

  @Column()
  money: number//订单金额
}
