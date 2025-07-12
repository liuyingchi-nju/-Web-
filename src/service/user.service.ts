import { Provide } from '@midwayjs/core';
import {InjectEntityModel} from "@midwayjs/typeorm";
import {User} from "../entity/user.entity";
import {Repository} from "typeorm";

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userRepo: Repository<User>;

  //创建初始管理员，仅后端可用，前端活动无法调用
  async createAdmin(name:string,password:string) {
    const user = this.userRepo.create();//创建一个新的实体实例
    user.name=name;
    user.password=password;
    user.isVIP=false;
    user.balance=0.0;
    user.isAdministrator=true;
    return await this.userRepo.save(user);//将实体实例持久化到数据库，并返回保存后的完整实体
  }

  // 创建用户
  async createUser(name:string,password:string) {
    const user = this.userRepo.create();//创建一个新的实体实例
    user.name=name;
    user.password=password;
    user.isVIP=false;
    user.balance=0.0;
    user.isAdministrator=false;
    return await this.userRepo.save(user);//将实体实例持久化到数据库，并返回保存后的完整实体
  }

  async getUserById(id: number) {
    return await this.userRepo.findOne({
      where: {id},
    });
  }

  async getUserByName(name: string) {
    return await this.userRepo.findOne({
      where: {name},
    });
  }

  // 查询用户列表（带分页）
  async findUsers(page: number, limit: number) {
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: users, total };
  }

  // 更新用户
  async updateUser(id: number, updates: Partial<User>) {
    await this.userRepo.update(id, updates);
    return this.userRepo.findOne({ where: { id } });
  }

  // 删除用户（硬删除）
  async deleteUser(id: number) {
    if (await this.userRepo.findOne({where: {id}})!=null) {
      return await this.userRepo.delete(id);
    }else{
      throw new Error(`用户 ID ${id} 不存在，删除失败`);
    }
  }
}
