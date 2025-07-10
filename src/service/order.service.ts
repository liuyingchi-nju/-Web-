import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entity/order.entity';
import type { User } from '../entity/user.entity';

@Provide()
export class OrderService {
  @InjectEntityModel(Order)
  orderModel: Repository<Order>;

  /**
   * 创建新订单
   * @param user 用户实体
   * @param money 订单金额
   * @returns 新创建的订单
   */
  async createOrder(user: User, money: number): Promise<Order> {
    const order = new Order();
    order.user = user;
    order.money = money;
    order.isDone = false; // 默认未完成
    return await this.orderModel.save(order);
  }

  /**
   * 根据ID获取订单
   * @param id 订单ID
   * @returns 订单实体或undefined
   */
  async getOrderById(id: number): Promise<Order|undefined|null> {
    return await this.orderModel.findOne({ where: { id } });
  }

  /**
   * 获取用户的所有订单
   * @param user 用户实体
   * @returns 用户订单列表
   */
  async getUserOrders(user: User): Promise<Order[]> {
    return await this.orderModel.find({
      where: { user },
      order: { createdAt: 'DESC' } // 按创建时间降序
    });
  }

  /**
   * 更新订单状态
   * @param id 订单ID
   * @param isDone 是否完成
   * @returns 更新后的订单
   */
  async updateOrderStatus(id: number, isDone: boolean): Promise<Order | undefined> {
    const order = await this.orderModel.findOne({ where: { id } });
    if (!order) return undefined;
    order.isDone = isDone;
    return await this.orderModel.save(order);
  }

  /**
   * 删除订单
   * @param id 订单ID
   * @returns 是否删除成功
   */
  async deleteOrder(id: number): Promise<boolean> {
    const result = await this.orderModel.delete(id);
    return result.affected > 0;
  }

  /**
   * 获取订单总金额统计
   * @param user 用户实体(可选)
   * @returns 订单总金额
   *///不使用
  async getTotalMoney(user?: User): Promise<number> {

    const query = this.orderModel.createQueryBuilder('order');
    query.where('order.userId = :userId', { userId: user.id }); // 无需 if 判断，强制关联用户

    const result = await query.select('SUM(order.money)', 'total').getRawOne();
    return parseFloat(result?.total || '0');
  }
  /**
   * 根据用户ID计算订单总金额
   * @param userId 用户ID（必选）
   * @returns 该用户的订单总金额
   */
  async getTotalMoneyByUserId(userId: number): Promise<number> {
    const result = await this.orderModel.createQueryBuilder('order')
      .select('SUM(order.money)', 'total')
      .where('order.userId = :userId', { userId })
      .getRawOne();
    return parseFloat(result?.total) || 0;
  }
}
