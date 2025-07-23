import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { BlindBox } from '../entity/blindbox.entity';
import { Goods } from '../entity/goods.entity';
import {Comment} from "../entity/comment.entity";

@Provide()
export class BlindBoxService {
  @InjectEntityModel(BlindBox)
  blindBoxModel: Repository<BlindBox>;

  @InjectEntityModel(Goods)
  goodsModel: Repository<Goods>;

  @InjectEntityModel(Comment)
  commentModel: Repository<Comment>;


  /**
   * 创建盲盒
   * @param blindBoxData 盲盒数据
   */
  async createBlindBox(blindBoxData: {
    name: string;
    avatarPath?: string;
    num: number;
    price:number;
  }): Promise<BlindBox> {
    const blindBox = new BlindBox();
    if (blindBoxData.avatarPath===undefined||blindBoxData.avatarPath===null){
      blindBox.avatarPath='/pictures/nopicture.jpg'
    }
    Object.assign(blindBox, blindBoxData);
    return await this.blindBoxModel.save(blindBox);
  }

  /**
   * 删除盲盒
   * @param id 盲盒ID
   */
  async deleteBlindBox(id: number): Promise<boolean> {
    // 1. 删除关联评论
    await this.commentModel.createQueryBuilder()
      .delete()
      .where("blindboxId = :id", { id })
      .execute();
    // 2. 清空商品关联
    await this.blindBoxModel.createQueryBuilder()
      .relation(BlindBox, 'goods')
      .of(id)
      .remove([]);
    // 3. 删除盲盒
    const result = await this.blindBoxModel.delete(id);
    return result.affected > 0;
  }

  /**
   * 根据ID获取盲盒
   * @param id 盲盒ID
   * @param withGoods 是否加载关联商品
   */
  async getBlindBoxById(
    id: number,
    withGoods: boolean = false
  ): Promise<BlindBox | null> {
    return await this.blindBoxModel.findOne({
      where: { id },
      relations: withGoods ? ['goods'] : []
    });
  }

  /**
   * 向盲盒添加单个商品
   * @param blindBoxId 盲盒ID
   * @param goodsId 商品ID
   */
  async addGoodToBlindBox(
    blindBoxId: number,
    goodsId: number
  ): Promise<BlindBox> {
    const [blindBox, goods] = await Promise.all([
      this.blindBoxModel.findOne({
        where: { id: blindBoxId },
        relations: ['goods']
      }),
      this.goodsModel.findOneBy({ id: goodsId })
    ]);

    if (!blindBox) throw new Error('盲盒不存在');
    if (!goods) throw new Error('商品不存在');
    const alreadyAdded = blindBox.goods.some(g => g.id === goodsId);
    if (alreadyAdded) {
      throw new Error('商品已存在于该盲盒中');
    }

    blindBox.goods = [...blindBox.goods, goods];
    return await this.blindBoxModel.save(blindBox);
  }

  async getBlindBoxesByPage(
    page: number = 1,
    pageSize: number = 7,
    withGoods: boolean = false
  ): Promise<{
    data: BlindBox[];
    currentPage: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }> {
    page = Math.max(1, page);
    const [data, total] = await this.blindBoxModel.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: withGoods ? ['goods'] : [],
      order: { id: 'ASC' } // 可以按需修改排序方式
    });
    return {
      data,
      currentPage: page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  }



  /**
   * 检查 Goods 是否在 BlindBox 中
   * @param blindBoxId 盲盒ID
   * @param goodsId 商品ID
   */
  async isGoodsInBlindBox(blindBoxId: number, goodsId: number): Promise<boolean> {
    const blindBox = await this.blindBoxModel.findOne({
      where: { id: blindBoxId },
      relations: ['goods'], // 加载关联的 goods
    });

    if (!blindBox || !blindBox.goods) {
      return false;
    }

    return blindBox.goods.some(g => g.id === goodsId);
  }

  /**
   * 搜索盲盒（按名称或包含的商品名称）
   * @param keyword 搜索关键词
   * @param page 页码
   * @param pageSize 每页数量
   */
  async searchBlindBoxes(
    keyword: string,
    page: number = 1,
    pageSize: number = 7
  ): Promise<{
    data: BlindBox[];
    currentPage: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }> {
    page = Math.max(1, page);
    const queryBuilder = this.blindBoxModel
      .createQueryBuilder('blindBox')
      .leftJoinAndSelect('blindBox.goods', 'goods')
      .where('blindBox.name LIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('goods.name LIKE :keyword', { keyword: `%${keyword}%` })
      .orderBy('blindBox.id', 'ASC');
    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();
    return {
      data,
      currentPage: page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  }


  async removeGoodsFromBlindBox(blindBoxId: number, goodsId: number): Promise<BlindBox> {
    // Find the blind box with the goods relation loaded
    const blindBox = await this.blindBoxModel.findOne({
      where: { id: blindBoxId },
      relations: ['goods'],
    });
    if (!blindBox) {
      throw new Error('BlindBox not found');
    }
    const goodsToRemove = await this.goodsModel.findOne({
      where: { id: goodsId },
    });
    if (!goodsToRemove) {
      throw new Error('Goods not found');
    }
    blindBox.goods = blindBox.goods.filter(goods => goods.id !== goodsId);
    return await this.blindBoxModel.save(blindBox);
  }

  /**
   * 更新盲盒属性
   * @param id 盲盒ID
   * @param updates
   */
  async updateBlindBox(id: number, updates: Partial<BlindBox>) {
    await this.blindBoxModel.update(id, updates);
  }
}


