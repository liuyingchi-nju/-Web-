import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { UserService } from '../../src/service/user.service';
import { OrderService } from '../../src/service/order.service';
import { BlindBoxService } from '../../src/service/blindbox.service';
import * as fs from 'fs';
import * as path from 'path';
import {GoodsService} from "../../src/service/goods.service";

describe('test/order.controller.test.ts', () => {
  let app;
  let request;
  let userService: UserService;
  let orderService: OrderService;
  let blindBoxService: BlindBoxService;
  let goodsService:GoodsService;

  // 测试数据使用随机字符串避免冲突
  const testUser = {
    name: 'order_test_user_' + Math.random().toString(36).substr(2, 5),
    password: 'test_password_' + Math.random().toString(36).substr(2, 5)
  };

  const testBlindBox = {
    name: 'test_blindbox_' + Math.random().toString(36).substr(2, 8),
    price: 100,
    num: 10
  };

  beforeAll(async () => {
    // 创建应用实例
    app = await createApp<Framework>();
    request = createHttpRequest(app);

    // 获取服务实例
    userService = await app.getApplicationContext().getAsync(UserService);
    orderService = await app.getApplicationContext().getAsync(OrderService);
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
    goodsService=await app.getApplicationContext().getAsync(GoodsService);

    // 创建测试盲盒
   const goods=await goodsService.createGoods({name:"testGoods",avatarPath:"none"});
    const blindBox= await blindBoxService.createBlindBox(testBlindBox);
    if (!await blindBoxService.isGoodsInBlindBox(blindBox.id,goods.id)){
      await blindBoxService.addGoodToBlindBox(blindBox.id, goods.id); // 添加默认商品
    }
  });

  afterAll(async () => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    // 关闭应用实例
    await close(app);
  });

  describe('订单功能', () => {
    let blindBoxId: number;

    beforeAll(async () => {
      // 注册测试用户
      const user=await userService.createUser(testUser.name,testUser.password);

      // 获取测试盲盒ID
      const blindBoxes = (await blindBoxService.getBlindBoxesByPage(1, 1)).data;
      blindBoxId = blindBoxes[0].id;

      await userService.updateUser(user.id,{balance:10000});
    });

    describe('POST /orders', () => {
      it('应该成功创建订单', async () => {
        const result = await request
          .post('/orders')
          .send({
            name: testUser.name,
            id:blindBoxId,
          })
          .expect(200);

        expect(result.body.success).toBe(true);
        expect(result.body.message).toBe('购买成功');
        expect(result.body.order).toBeDefined();
      });

      it('当盲盒售罄时应失败', async () => {
        // 首先将盲盒设为售罄
        await blindBoxService.updateBlindBox(blindBoxId, { num: 0 });

        await request
          .post('/orders')
          .send({
            name: testUser.name,
            id: blindBoxId,
            price: testBlindBox.price
          })
          .expect(400);

        // 恢复盲盒数量
        await blindBoxService.updateBlindBox(blindBoxId, { num: 10 });
      });

      it('当用户余额不足时应失败', async () => {
        // 首先将用户余额设为0
        const user = await userService.getUserByName(testUser.name);
        user.balance = 0;
        await userService.userRepo.save(user);

        await request
          .post('/orders')
          .send({
            name: testUser.name,
            id: blindBoxId,
            price: testBlindBox.price
          })
          .expect(400);

        // 恢复用户余额
        user.balance = 1000;
        await userService.userRepo.save(user);
      });
    });

    describe('GET /orders/todo-list/:page', () => {
      it('应该获取未发货订单列表并分页', async () => {
        const result = await request
          .get('/orders/todo-list/1')
          .expect(200);

        expect(result.body.success).toBe(true);
        expect(result.body.data).toBeInstanceOf(Array);
        expect(result.body.total).toBeDefined();
        expect(result.body.page).toBe(1);
        expect(result.body.pageSize).toBe(5);
      });
    });

    describe('GET /orders/:id', () => {
      it('应该通过ID获取订单详情', async () => {
        // 首先创建一个订单
        const order = await orderService.createOrder(
          await userService.getUserByName(testUser.name),
          testBlindBox.price,
          blindBoxId
        );

        const result = await request
          .get(`/orders/${order.id}`)
          .expect(200);

        expect(result.body.id).toBe(order.id);
      });

      it('对于不存在的订单应返回错误', async () => {
        await request
          .get('/orders/999999')
          .expect(500);
      });
    });

    describe('PATCH /orders/:id/status', () => {
      it('应该更新订单状态为已发货', async () => {
        const order = await orderService.createOrder(
          await userService.getUserByName(testUser.name),
          testBlindBox.price,
          blindBoxId
        );

        const result = await request
          .patch(`/orders/${order.id}/status`)
          .send({
            mode: 'isSent'
          })
          .expect(200);

        expect(result.body.success).toBe(true);

        // 验证更新
        const updatedOrder = await orderService.getOrderById(order.id);
        expect(updatedOrder.isSent).toBe(true);
      });

      it('应该更新订单状态为已收货和已完成', async () => {
        // 首先创建并发送一个订单
        const order = await orderService.createOrder(
          await userService.getUserByName(testUser.name),
          testBlindBox.price,
          blindBoxId
        );
        await orderService.updateOrderStatus(order.id, { isSent: true });

        const result = await request
          .patch(`/orders/${order.id}/status`)
          .send({
            mode: 'isReceived'
          })
          .expect(200);

        expect(result.body.success).toBe(true);

        // 验证更新
        const updatedOrder = await orderService.getOrderById(order.id);
        expect(updatedOrder.isReceived).toBe(true);
        expect(updatedOrder.isDone).toBe(true);
      });

      it('如果订单未发货则不应标记为已收货', async () => {
        // 首先创建一个订单(未发货)
        const order = await orderService.createOrder(
          await userService.getUserByName(testUser.name),
          testBlindBox.price,
          blindBoxId
        );

        await request
          .patch(`/orders/${order.id}/status`)
          .send({
            mode: 'isReceived'
          })
          .expect(400);

        // 验证订单未被标记为已收货
        const updatedOrder = await orderService.getOrderById(order.id);
        expect(updatedOrder.isReceived).toBe(false);
      });
    });

    describe('OPTIONS路由', () => {
      it('应该处理OPTIONS /orders', async () => {
        const result = await request
          .options('/orders')
          .expect(200);
        expect(result.body.success).toBe(true);
      });

      it('应该处理OPTIONS /orders/todo-list/:page', async () => {
        const result = await request
          .options('/orders/todo-list/1')
          .expect(200);
        expect(result.body.success).toBe(true);
      });

      it('应该处理OPTIONS /orders/:id', async () => {
        const result = await request
          .options('/orders/1')
          .expect(200);
        expect(result.body.success).toBe(true);
      });

      it('应该处理OPTIONS /orders/:id/status', async () => {
        const result = await request
          .options('/orders/1/status')
          .expect(200);
        expect(result.body.success).toBe(true);
      });
    });
  });
});
