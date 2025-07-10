import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { BlindBox } from '../entity/blindbox.entity';
import { Order } from '../entity/order.entity';

@Provide()
export class BlindBoxService {
  @InjectEntityModel(BlindBox)
  blindBoxModel: Repository<BlindBox>;

  @InjectEntityModel(Order)
  orderModel: Repository<Order>;

  /**
   * 创建新盲盒
   * @param name 盲盒名称
   * @param introduction 产品介绍
   * @param avatarPath 图像路径(可选)
   * @returns 新创建的盲盒
   */
  async createBlindBox(
    name: string,
    introduction: string,
    avatarPath?: string
  ): Promise<BlindBox> {
    const blindBox = new BlindBox();
    blindBox.name = name;
    blindBox.introduction = introduction;
    if (avatarPath === undefined || avatarPath === null) {
      blindBox.avatarPath = '../data/pictures/nopicture.jpg';
    } else{
      blindBox.avatarPath = avatarPath;
    }
    return await this.blindBoxModel.save(blindBox);
  }

  /**
   * 根据ID获取盲盒
   * @param id 盲盒ID
   * @returns 盲盒实体或null
   */
  async getBlindBoxById(id: number): Promise<BlindBox | null> {
    return await this.blindBoxModel.findOne({
      where: { id },
      relations: ['orders'] // 可选：是否加载关联订单
    });
  }

  /**
   * 获取所有盲盒列表
   * @returns 盲盒列表
   */
  async getAllBlindBoxes(): Promise<BlindBox[]> {
    return await this.blindBoxModel.find({
      order: { id: 'ASC' } // 按ID升序排列
    });
  }

  /**
   * 更新盲盒信息
   * @param id 盲盒ID
   * @param updates 更新内容
   * @returns 更新后的盲盒
   */
  async updateBlindBox(
    id: number,
    updates: Partial<Pick<BlindBox, 'name' | 'introduction' | 'avatarPath'>>
  ): Promise<BlindBox | null> {
    const blindBox = await this.blindBoxModel.findOne({ where: { id } });
    if (!blindBox) return null;

    Object.assign(blindBox, updates);
    return await this.blindBoxModel.save(blindBox);
  }

  /**
   * 删除盲盒
   * @param id 盲盒ID
   * @returns 是否删除成功
   */
  async deleteBlindBox(id: number): Promise<boolean> {
    const result = await this.blindBoxModel.delete(id);
    return result.affected > 0;
  }

  /**
   * 获取盲盒的订单统计
   * @param blindBoxId 盲盒ID
   * @returns 订单总数和总金额
   */
  async getBlindBoxOrderStats(blindBoxId: number): Promise<{
    orderCount: number;
    totalAmount: number;
  }> {
    const result = await this.orderModel
      .createQueryBuilder('order')
      .select([
        'COUNT(order.id) as orderCount',
        'SUM(order.money) as totalAmount'
      ])
      .where('order.blindBoxId = :blindBoxId', { blindBoxId })
      .getRawOne();

    return {
      orderCount: parseInt(result?.orderCount) || 0,
      totalAmount: parseFloat(result?.totalAmount) || 0
    };
  }

  /**
   * 更新盲盒头像
   * @param id 盲盒ID
   * @param avatarPath 新头像路径
   * @returns 更新后的盲盒
   */
  async updateBlindBoxAvatar(
    id: number,
    avatarPath: string
  ): Promise<BlindBox | null> {
    return this.updateBlindBox(id, { avatarPath });
  }
}
