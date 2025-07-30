import { Entity, Column,PrimaryGeneratedColumn,OneToMany} from 'typeorm';
import  {Order} from "./order.entity";


@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  password:string;

  @Column({nullable:true})
  token:string//登录密钥

  @OneToMany(()=> Order,undefined,{nullable:true})
  orders: Order[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  balance:number;//用户余额

  @Column()
  isVIP:boolean;//vip功能（新增）

  @Column()
  isAdministrator:boolean;//管理员权限

  @Column()
  isSuperAdministrator:boolean;//超级管理员权限
}
