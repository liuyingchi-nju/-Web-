import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { UserService } from '../../src/service/user.service';
import { CommentService } from '../../src/service/comment.service';
import { OrderService } from '../../src/service/order.service';
import * as fs from 'fs';
import * as path from 'path';
import { BlindBoxService } from "../../src/service/blindbox.service";
import {GoodsService} from "../../src/service/goods.service";

describe('test/comment.controller.test.ts', () => {
  let app;
  let request;
  let userService: UserService;
  let commentService: CommentService;
  let orderService: OrderService;
  let blindBoxService: BlindBoxService;
  let goodsService:GoodsService;

  const testUser = {
    name: 'comment_test_user_' + Math.random().toString(36).substr(2, 5),
    password: 'test_password_' + Math.random().toString(36).substr(2, 5)
  };

  const testComment = {
    blindBoxId: 1,
    content: '这是一个测试评论' + Math.random().toString(36).substr(2, 5)
  };

  beforeAll(async () => {
    app = await createApp<Framework>();
    request = createHttpRequest(app);

    userService = await app.getApplicationContext().getAsync(UserService);
    commentService = await app.getApplicationContext().getAsync(CommentService);
    orderService = await app.getApplicationContext().getAsync(OrderService);
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
    goodsService=await app.getApplicationContext().getAsync(GoodsService);
    await blindBoxService.createBlindBox({name: 'testName', avatarPath: 'none', num: 10, price: 100});
    if (!await goodsService.getGoodsById(1)){
      await goodsService.createGoods({name:'testGood',avatarPath:"none"});
    }
    if(!await blindBoxService.isGoodsInBlindBox(testComment.blindBoxId,1)){
      await blindBoxService.addGoodToBlindBox(testComment.blindBoxId, 1);
    }
  });

  afterAll(async () => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    await close(app);
  });

  describe('评论功能', () => {
    let userId: number;

    beforeAll(async () => {
      // 注册测试用户
      if (!await userService.getUserByName(testUser.name)) {
        await request.post('/user').send(testUser).expect(200);
      }
      const user = await userService.getUserByName(testUser.name);
      userId = user.id;
      await orderService.createOrder(user, 100, testComment.blindBoxId);
    });

    it('应该成功创建纯文本评论', async () => {
      const result = await request
        .post('/comments')
        .field('name', testUser.name)  // 字段名改为name
        .field('blindBoxId', testComment.blindBoxId)
        .field('content', testComment.content)
        .expect(200);

      expect(result.body.success).toBe(true);
      expect(result.body.data.content).toBe(testComment.content);
    });

    it('应该成功创建带图片的评论', async () => {
      const result = await request
        .post('/comments')
        .field('name', testUser.name)  // 字段名改为name
        .field('blindBoxId', testComment.blindBoxId.toString())
        .field('content', testComment.content)
        .expect(200);

      expect(result.body.success).toBe(true);

    });

    it('应该获取盲盒的评论列表', async () => {
      // 先创建一条评论
      await commentService.createComment({
        userId,
        blindboxId: testComment.blindBoxId,
        content: testComment.content
      });

      const result = await request
        .get(`/comments/${testComment.blindBoxId}`)  // 使用路径参数
        .expect(200);

      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body.length).toBeGreaterThan(0);
    });

    it('应该检查用户是否有评论权限（已购买）', async () => {
      const result = await request
        .get(`/comments/${testUser.name}/${testComment.blindBoxId}/comment-permission`)  // 嵌套路径参数
        .expect(200);

      expect(result.body.success).toBe(true);
    });

    it('应该检查用户是否有评论权限（未购买）', async () => {
      const result = await request
        .get(`/comments/${testUser.name}/999/comment-permission`)  // 不存在的盲盒ID
        .expect(200);

      expect(result.body.success).toBe(false);
    });
  });
});
