import { Entity, Column,PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class Administrator {
  @PrimaryGeneratedColumn({comment:'系统管理员ID'})
  id: number;

  @Column({ comment: '管理员名称' })
  name: string;
  // 使用 Column 装饰器存储图片路径

  @Column({ comment: '管理员密码' })
  password: string;

  @Column({nullable:true})
  key:number//登录密钥
}
