import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { UserService } from '../../src/service/user.service';
import { CommentService } from '../../src/service/comment.service';
import { OrderService } from '../../src/service/order.service';
import * as fs from 'fs';
import * as path from 'path';
import {BlindBoxService} from "../../src/service/blindbox.service";
import {GoodsService} from "../../src/service/goods.service";

describe('test/comment.controller.test.ts', () => {
  let app;
  let request;
  let userService: UserService;
  let commentService: CommentService;
  let orderService: OrderService;
  let blindBoxService:BlindBoxService;
  let goodsService:GoodsService;
  // 测试用户数据
  const testUser = {
    name: 'comment_test_user_' + Math.random().toString(36).substr(2, 5),
    password: 'test_password_' + Math.random().toString(36).substr(2, 5)
  };

  // 测试评论数据
  const testComment = {
    blindBoxId: 1, // 假设存在一个盲盒ID为1
    content: '这是一个测试评论' + Math.random().toString(36).substr(2, 5)
  };

  // 创建测试图片文件
  const createTestImage = () => {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const filePath = path.join(tempDir, `test_${Math.random().toString(36).substr(2, 5)}.jpg`);
    fs.writeFileSync(filePath, 'test image content');
    return filePath;
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
    goodsService=await app.getApplicationContext().getAsync(GoodsService);
    await blindBoxService.createBlindBox({name:'test_box',avatarPath:'none',num:1000,price:100})
    await goodsService.createGoods({name:'test_good'});
    if (await blindBoxService.isGoodsInBlindBox(1,1)){
      await blindBoxService.removeGoodsFromBlindBox(1,1);
    }
    await blindBoxService.addGoodToBlindBox(1,1);
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
    const user = await userService.getUserByName(testUser.name);
    const comments = await commentService.getCommentsByUserId(user?.id || 0);

    for (const comment of comments) {
      await commentService.deleteCommentById(comment.id);
    }
    if (user) {
      await userService.deleteUser(user.id);
    }

  }

  describe('评论功能', () => {
    let userId: number;
    let testImagePath: string;

    beforeAll(async () => {

      // 注册测试用户
      await request.post('/user').send(testUser).expect(200);


      // 获取用户ID
      const user = await userService.getUserByName(testUser.name);
      userId = user.id;

      // 创建测试图片
      testImagePath = createTestImage();

      // 模拟用户购买了盲盒
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
        .attach('images', testImagePath)
        .expect(200);

      expect(result.body.success).toBe(true);
      expect(result.body.data.imagePaths).toBeDefined();
      expect(result.body.data.imagePaths.length).toBeGreaterThan(0);
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
