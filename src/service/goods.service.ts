import {Init, Provide} from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Goods } from '../entity/goods.entity';

@Provide()
export class GoodsService {
  @InjectEntityModel(Goods)
  goodsModel: Repository<Goods>;

  @Init()
  async initDefaultGoods() {
    if (await this.goodsModel.count() === 0) {
      await this.batchCreateGoods([
        {name: "芒果TV月卡",avatarPath:"http://127.0.0.1:7001/pictures/mangotv.jpg"},
        {name: "QQ音乐三天绿钻体验卡",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "bilibili大会员月卡",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "百度网盘不限速体验卡*50",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "三国杀移动版66宝珠兑换码",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "京东200元礼品卡",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "腾讯视频会员三折券",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "QQ音乐一天绿钻体验卡",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "QQ音乐绿钻月卡",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "原神1288原石兑换码",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "王者荣耀随机皮肤体验券*50",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "火影忍者手游神秘道具",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "星穹铁道神秘道具",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "QQ音乐绿钻月卡",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "腾讯视频月卡",avatarPath:"http://127.0.0.1:7001/pictures/"},
        {name: "优酷视频月卡",avatarPath:"http://127.0.0.1:7001/pictures/"},
      ]);
      console.log('默认商品数据初始化完成');
    }
  }

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
  async getAllGoods(page = 1, limit = 10): Promise<{ data: Goods[]; totalPages: number }> {
    const [data, total] = await this.goodsModel.findAndCount({
      skip: (page - 1) * limit,
      take: limit
    });
    return { data, totalPages: Math.ceil(total / limit) };
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
