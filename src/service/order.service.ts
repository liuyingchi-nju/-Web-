import {Inject, Provide} from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entity/order.entity';
import type { User } from '../entity/user.entity';
import {BlindBoxService} from "./blindbox.service";

@Provide()
export class OrderService {
  @InjectEntityModel(Order)
  orderModel: Repository<Order>;

  @Inject()
  blindBoxService:BlindBoxService;
  /**
   * 创建新订单
   * @param user 用户实体
   * @param money 订单金额
   * @param blindBoxId
   * @returns 新创建的订单
   */
  async createOrder(user: User, money: number, blindBoxId:number): Promise<Order> {
    const order = new Order();
    order.user = user;
    order.money = money;
    order.blindBoxId=blindBoxId;
    const blindBox=await this.blindBoxService.getBlindBoxById(blindBoxId,true);
    order.isDone = false;
    order.isReceived=false;
    order.isSent=false;
    const choice=Math.floor(Math.random()*blindBox.goods.length);
    order.goods=blindBox.goods[choice];
    return await this.orderModel.save(order);
  }

  /**
   * 根据ID获取订单
   * @param id 订单ID
   * @returns 订单实体或undefined
   */
  async getOrderById(id: number): Promise<Order | undefined | null> {
    return await this.orderModel.findOne({
      where: { id },
      relations: ['goods']
    });
  }

  /**
   * 获取用户的所有订单
   * @param user 用户实体
   * @returns 用户订单列表
   */
  async getUserOrders(user: User): Promise<Order[]> {
    return await this.orderModel.find({
      where: { user },
      relations: ['goods'],
      order: { createdAt: 'DESC' } // 按创建时间降序
    });
  }

  /**
   * 更新订单状态
   * @param id 订单ID
   * @param updates
   * @returns 更新后的订单
   */
  async updateOrderStatus(id: number, updates: Partial<Order>) {
    const order = await this.orderModel.findOne({ where: { id } });
    if (order===null||order===undefined){
      throw new Error("订单不存在")
    }
    await this.orderModel.update(id,updates);
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

  /**
   * 获取所有未发货的订单（带分页）
   * @param page 当前页码
   * @param pageSize 每页数量
   * @returns 分页结果
   */
  async getUnsentOrders(page: number = 1, pageSize: number = 10): Promise<{
    orders: Order[],
    total: number
  }> {
    const skip = (page - 1) * pageSize;
    const [orders, total] = await Promise.all([
      this.orderModel.find({
        where: { isSent: false },
        relations: ['user', 'goods'],
        order: { createdAt: 'ASC' },
        skip,
        take: pageSize
      }),
      this.orderModel.count({ where: { isSent: false } })
    ]);
    return {
      orders,
      total
    };
  }
}
