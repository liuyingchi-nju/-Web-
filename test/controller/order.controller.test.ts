import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { UserService } from '../../src/service/user.service';
import { OrderService } from '../../src/service/order.service';
import { BlindBoxService } from '../../src/service/blindbox.service';
import * as fs from 'fs';
import * as path from 'path';

describe('test/order.controller.test.ts', () => {
  let app;
  let request;
  let userService: UserService;
  let orderService: OrderService;
  let blindBoxService: BlindBoxService;

  // Test data with random strings to avoid conflicts
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
    // Create app instance
    app = await createApp<Framework>();
    request = createHttpRequest(app);

    // Get service instances
    userService = await app.getApplicationContext().getAsync(UserService);
    orderService = await app.getApplicationContext().getAsync(OrderService);
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);

    // Create test blindbox
    const blindBox = await blindBoxService.createBlindBox(testBlindBox);
    await blindBoxService.addGoodToBlindBox(blindBox.id, 1); // Add default goods
  });

  afterAll(async () => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    // Close app instance
    await close(app);
  });

  describe('Order Functionality', () => {
    let blindBoxId: number;

    beforeAll(async () => {
      // Register test user
      await request.post('/user').send(testUser).expect(200);

      // Get test blindbox ID
      const blindBoxes = await blindBoxService.getBlindBoxesByPage(1, 1);
      blindBoxId = blindBoxes.data[0].id;

      // Login to get token
      await request
        .get('/user/token')
        .set('X-User-Name', testUser.name)
        .set('X-User-Password', testUser.password)
        .expect(200);

      // Add balance to user
      await request
        .patch('/user/balance')
        .send({ name: testUser.name, amount: 1000 })
        .expect(200);
    });

    describe('POST /order', () => {
      it('should successfully create an order', async () => {
        const result = await request
          .post('/order')
          .send({
            name: testUser.name,
            id: blindBoxId,
            price: testBlindBox.price
          })
          .expect(200);

        expect(result.body.success).toBe(true);
        expect(result.body.message).toBe('购买成功');
        expect(result.body.order).toBeDefined();
      });

      it('should fail when blindbox is sold out', async () => {
        // First make blindbox sold out
        await blindBoxService.updateBlindBox(blindBoxId, { num: 0 });

        const result = await request
          .post('/order')
          .send({
            name: testUser.name,
            id: blindBoxId,
            price: testBlindBox.price
          })
          .expect(400);

        expect(result.body.success).toBe(false);
        expect(result.body.message).toBe('该盲盒已售罄');

        // Restore blindbox quantity
        await blindBoxService.updateBlindBox(blindBoxId, { num: 10 });
      });

      it('should fail when user has insufficient balance', async () => {
        // First set user balance to 0
        const user = await userService.getUserByName(testUser.name);
        user.balance = 0;
        await userService.userRepo.save(user);

        const result = await request
          .post('/order')
          .send({
            name: testUser.name,
            id: blindBoxId,
            price: testBlindBox.price
          })
          .expect(400);

        expect(result.body.success).toBe(false);
        expect(result.body.message).toBe('余额不足');

        // Restore user balance
        user.balance = 1000;
        await userService.userRepo.save(user);
      });
    });

    describe('GET /order/unsentlist', () => {
      it('should get list of unsent orders with pagination', async () => {
        const result = await request
          .get('/order/unsentlist')
          .query({ page: 1 })
          .expect(200);

        expect(result.body.success).toBe(true);
        expect(result.body.data).toBeInstanceOf(Array);
        expect(result.body.total).toBeDefined();
        expect(result.body.page).toBe(1);
        expect(result.body.pageSize).toBe(5);
      });
    });

    describe('GET /order/detail', () => {
      it('should get order details by ID', async () => {
        // First create an order
        const order = await orderService.createOrder(
          await userService.getUserByName(testUser.name),
          testBlindBox.price,
          blindBoxId
        );

        const result = await request
          .get('/order/detail')
          .query({ id: order.id })
          .expect(200);

        expect(result.body.id).toBe(order.id);
        expect(result.body.goods).toBeDefined();
      });

      it('should return error for non-existent order', async () => {
        await request
          .get('/order/detail')
          .query({ id: 999999 })
          .expect(500);
      });
    });

    describe('PATCH /order/condition', () => {
      it('should update order status to sent', async () => {
        const order = await orderService.createOrder(
          await userService.getUserByName(testUser.name),
          testBlindBox.price,
          blindBoxId
        );

        const result = await request
          .patch('/order/condition')
          .send({
            orderId: order.id,
            mode: 'isSent'
          })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the update
        const updatedOrder = await orderService.getOrderById(order.id);
        expect(updatedOrder.isSent).toBe(true);
      });

      it('should update order status to received and done', async () => {
        // First create and send an order
        const order = await orderService.createOrder(
          await userService.getUserByName(testUser.name),
          testBlindBox.price,
          blindBoxId
        );
        await orderService.updateOrderStatus(order.id, { isSent: true });

        const result = await request
          .patch('/order/condition')
          .send({
            orderId: order.id,
            mode: 'isReceived'
          })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the update
        const updatedOrder = await orderService.getOrderById(order.id);
        expect(updatedOrder.isReceived).toBe(true);
        expect(updatedOrder.isDone).toBe(true);
      });

      it('should not mark as received if not sent', async () => {
        // First create an order (not sent)
        const order = await orderService.createOrder(
          await userService.getUserByName(testUser.name),
          testBlindBox.price,
          blindBoxId
        );

        await request
          .patch('/order/condition')
          .send({
            orderId: order.id,
            mode: 'isReceived'
          })
          .expect(500);

        // Verify the order is not marked as received
        const updatedOrder = await orderService.getOrderById(order.id);
        expect(updatedOrder.isReceived).toBe(false);
      });
    });

    describe('OPTIONS routes', () => {
      it('should handle OPTIONS /order', async () => {
        const result = await request
          .options('/order')
          .expect(200);
        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /order/unsentlist', async () => {
        const result = await request
          .options('/order/unsentlist')
          .expect(200);
        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /order/detail', async () => {
        const result = await request
          .options('/order/detail')
          .expect(200);
        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /order/condition', async () => {
        const result = await request
          .options('/order/condition')
          .expect(200);
        expect(result.body.success).toBe(true);
      });
    });
  });
});
