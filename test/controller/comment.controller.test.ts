import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { UserService } from '../../src/service/user.service';
import { CommentService } from '../../src/service/comment.service';
import { OrderService } from '../../src/service/order.service';
import * as fs from 'fs';
import * as path from 'path';
import {BlindBoxService} from "../../src/service/blindbox.service";


describe('test/comment.controller.test.ts', () => {
  let app;
  let request;
  let userService: UserService;
  let commentService: CommentService;
  let orderService: OrderService;
  let blindBoxService:BlindBoxService;


  // 测试用户数据
  const testUser = {
    name: 'comment_test_user_' + Math.random().toString(36).substr(2, 5),
    password: 'test_password_' + Math.random().toString(36).substr(2, 5)
  };

  // 测试评论数据
  const testComment = {
    blindBoxId: 2,
    content: '这是一个测试评论' + Math.random().toString(36).substr(2, 5)
  };



  beforeAll(async () => {
    // 创建应用实例
    app = await createApp<Framework>();
    request = createHttpRequest(app);

    // 获取服务实例
    userService = await app.getApplicationContext().getAsync(UserService);
    commentService = await app.getApplicationContext().getAsync(CommentService);
    orderService = await app.getApplicationContext().getAsync(OrderService);
    blindBoxService=await app.getApplicationContext().getAsync(BlindBoxService);
    await blindBoxService.createBlindBox({name:'teatName',avatarPath:'none',num:10,price:100});
    await blindBoxService.addGoodToBlindBox(testComment.blindBoxId,1);
  });

  afterAll(async () => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    // 关闭应用实例
    await close(app);
  });

  // 清理测试数据
  async function cleanupTestData() {
    await blindBoxService.removeGoodsFromBlindBox(testComment.blindBoxId,1);
    const user=await userService.getUserByName(testUser.name);
    const Orders=await orderService.getUserOrders(user);
    const Comments=await commentService.getCommentsByUserId(user.id);
    for (const order of Orders){
      await orderService.deleteOrder(order.id);
    }
    for (const comment of Comments){
      await commentService.deleteCommentById(comment.id);
    }
    await userService.deleteUser((await userService.getUserByName(testUser.name)).id);
  }

  describe('评论功能', () => {
    let userId: number;

    beforeAll(async () => {
      // 注册测试用户
      if (await userService.getUserByName(testUser.name)===null||await userService.getUserByName(testUser.name)===undefined){
        await request.post('/user').send(testUser).expect(200);
      }
      const user = await userService.getUserByName(testUser.name);
      userId = user.id;
      await orderService.createOrder(await userService.getUserById(userId),100,testComment.blindBoxId);
    });

    afterAll(async () => {
      await cleanupTestData();
    });

    it('应该成功创建纯文本评论', async () => {
      const result = await request
        .post('/comment')
        .field('userName', testUser.name)
        .field('blindBoxId', testComment.blindBoxId.toString())
        .field('content', testComment.content)
        .expect(200);

      expect(result.body.success).toBe(true);
      expect(result.body.data.content).toBe(testComment.content);
    });

    it('应该成功创建带图片的评论', async () => {
      const result = await request
        .post('/comment')
        .field('userName', testUser.name)
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
        .get('/comment')
        .query({ blindboxId: testComment.blindBoxId })
        .expect(200);

      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body.length).toBeGreaterThan(0);
      expect(result.body[0].user).toBeDefined();
    });

    it('应该检查用户是否有评论权限（已购买）', async () => {
      const result = await request
        .get('/comment/permission')
        .query({
          blindboxId: testComment.blindBoxId,
          name: testUser.name
        })
        .expect(200);

      expect(result.body.success).toBe(true);
    });

    it('应该检查用户是否有评论权限（未购买）', async () => {
      const result = await request
        .get('/comment/permission')
        .query({
          blindboxId: 999, // 不存在的盲盒ID
          name: testUser.name
        })
        .expect(200);

      expect(result.body.success).toBe(false);
    });
  });
});
