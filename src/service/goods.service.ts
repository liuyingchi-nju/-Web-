import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Goods } from '../entity/goods.entity';

@Provide()
export class GoodsService {
  @InjectEntityModel(Goods)
  goodsModel: Repository<Goods>;

  /**
   * 创建商品
   * @param goodsData 商品数据
   */
  async createGoods(goodsData: Partial<Goods>): Promise<Goods> {
    const goods = new Goods();
    Object.assign(goods, goodsData);
    return await this.goodsModel.save(goods);
  }

  /**
   * 获取所有商品（带分页）
   * @param page 页码
   * @param limit 每页数量
   */
  async getAllGoods(page = 1, limit = 10): Promise<{ data: Goods[]; count: number }> {
    const [data, count] = await this.goodsModel.findAndCount({
      skip: (page - 1) * limit,
      take: limit
    });
    return { data, count };
  }

  /**
   * 根据ID获取商品详情
   * @param id 商品ID
   */
  async getGoodsById(id: number): Promise<Goods> {
    return await this.goodsModel.findOne({
      where: { id }
    });
  }

  /**
   * 更新商品信息
   * @param id 商品ID
   * @param updateData 更新数据
   */
  async updateGoods(id: number, updateData: Partial<Goods>): Promise<Goods> {
    await this.goodsModel.update(id, updateData);
    return this.getGoodsById(id);
  }

  /**
   * 删除商品
   * @param id 商品ID
   */
  async deleteGoods(id: number): Promise<void> {
    await this.goodsModel.delete(id);
  }

  /**
   * 批量创建商品
   * @param goodsList 商品数据列表
   */
  async batchCreateGoods(goodsList: Partial<Goods>[]): Promise<Goods[]> {
    const goodsEntities = goodsList.map(data => {
      const goods = new Goods();
      Object.assign(goods, data);
      return goods;
    });

    return await this.goodsModel.save(goodsEntities);
  }

  /**
   * 上传商品图片
   * @param id 商品ID
   * @param avatarPath 图片路径
   */
  async uploadGoodsAvatar(id: number, avatarPath: string): Promise<Goods> {
    return await this.updateGoods(id, { avatarPath });
  }

  /**
   * 根据名称搜索商品
   * @param keyword 搜索关键词
   * @param page 页码
   * @param limit 每页数量
   */
  async searchGoodsByName(
    keyword: string,
    page = 1,
    limit = 10
  ): Promise<{ data: Goods[]; count: number }> {
    const [data, count] = await this.goodsModel
      .createQueryBuilder('goods')
      .where('goods.name LIKE :keyword', { keyword: `%${keyword}%` })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, count };
  }
}
