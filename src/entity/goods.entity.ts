import {Entity, Column, PrimaryGeneratedColumn, ManyToMany,} from 'typeorm';
import {BlindBox} from "./blindbox.entity";

@Entity()
export class Goods {
  @PrimaryGeneratedColumn({comment:'货物唯一ID'})
  id: number;

  @Column({ comment: '货物名称' })
  name: string;


  @Column({ nullable: true, comment: '图像路径' })
  avatarPath: string;

  @ManyToMany(() => BlindBox, blindBox => blindBox.goods,{nullable:true})
  blindBoxes: BlindBox[];
}
