import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { UserService } from '../../src/service/user.service';


describe('test/user.controller.test.ts', () => {
  let app;
  let request;
  let userService: UserService;

  // 测试用户数据
  const testUser = {
    name: 'test_user_' + Math.random().toString(36).substr(2, 5),
    password: 'test_password'+ Math.random().toString(36).substr(2, 5)
  };

  const adminUser = {
    name: 'root',
    password: 'root'
  };

  beforeAll(async () => {
    // 创建应用实例
    app = await createApp<Framework>();
    request = createHttpRequest(app);

    // 获取UserService实例
    userService = await app.getApplicationContext().getAsync(UserService);
  });

  afterAll(async () => {
    // 关闭应用实例
    await close(app);
  });

  // 清理测试用户
  async function cleanupTestUser(name: string) {
    const user = await userService.getUserByName(name);
    if (user) {
      await userService.deleteUser(user.id);
    }
  }

  describe('用户注册', () => {
    afterEach(async () => {
      await cleanupTestUser(testUser.name);
    });

    it('应该成功注册新用户', async () => {
      const result = await request
        .post('/user')
        .send(testUser)
        .expect(200);

      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe('注册成功');
    });

    it('不应该注册已存在的用户', async () => {
      // 先注册用户
      await request.post('/user').send(testUser).expect(200);

      // 再次注册相同用户
      const result = await request.post('/user').send(testUser).expect(400);
      expect(result.text).toContain("用户名已存在");
    });
  });

  describe('用户登录', () => {

    beforeAll(async () => {
      // 注册测试用户
      await request.post('/user').send(testUser).expect(200);
    });

    afterAll(async () => {
      await cleanupTestUser(testUser.name);
    });

    it('应该成功登录', async () => {
      const result = await request.get('/user/token')
        .set('X-User-Name', testUser.name)
        .set('X-User-Password', testUser.password)
        .expect(200);

      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe('登录成功');
      expect(result.body.data.token).toBeDefined();

    });

    it('应该因密码错误而登录失败', async () => {
      const result = await request.get('/user/token')
        .set('X-User-Name', testUser.name)
        .set('X-User-Password','wrong_password')
        .expect(500);
      expect(result.text).toContain('Error');
    });

    it('应该因用户不存在而登录失败', async () => {
      const result = await request.get('/user/token')
        .set('X-User-Name', 'non_existent_user')
        .set('X-User-Password',  'password')
        .expect(500);
      expect(result.text).toContain('Error');
    });
  });

  describe('管理员功能', () => {
    let adminToken: string;
    let testUserId: number;

    beforeAll(async () => {
      // 管理员登录获取token
      const loginResult = await request.get('/user/token')
        .set('X-User-Name', 'root')
        .set('X-User-Password','root')
        .expect(200);
      adminToken = loginResult.body.data.token;
      // 创建测试用户
       await request
        .post('/user')
        .send(testUser)
        .expect(200);
      const user = await userService.getUserByName(testUser.name);
      testUserId = user.id;
    });

    afterAll(async () => {
      await cleanupTestUser(testUser.name);
    });

    it('应该成功验证管理员身份', async () => {
      const result = await request
        .get('/user/admin')
        .set('X-User-Name', adminUser.name)
        .set('X-User-Token', adminToken)
        .expect(200);
      expect(result.body.success).toBe(true);
    });

    it('应该因错误的token而验证失败', async () => {
      const result = await request
        .get('/user/admin')
        .set('X-User-Name', adminUser.name)
        .set('X-User-Token', 'wrong_token')
        .expect(500);
      expect(result.text).toContain('Error');
    });

    it('应该成功设置管理员角色', async () => {
      const result = await request
        .patch('/user/admin')
        .set('X-User-Name', adminUser.name)
        .set('X-User-Token', adminToken)
        .send({ userId: testUserId, isAdministrator: true })
        .expect(200);
      expect(result.body.success).toBe(true);
    });

    it('应该成功删除用户', async () => {
      const result = await request
        .del('/user')
        .set('X-User-Name', adminUser.name)
        .set('X-User-Token', adminToken)
        .query({ id: testUserId })
        .expect(200);
      expect(result.body.success).toBe(true);
    });
  });

  describe('用户余额和VIP功能', () => {
    let testToken: string;

    beforeAll(async () => {
      // 注册测试用户
      await request.post('/user').send(testUser).expect(200);

      // 登录获取token
      const loginResult = await request
        .get('/user/token')
        .set('X-User-Name',testUser.name )
        .set('X-User-Password',testUser.password )
        .expect(200);
      testToken = loginResult.body.data.token;
    });

    afterAll(async () => {
      await cleanupTestUser(testUser.name);
    });

    it('应该成功修改余额', async () => {
      const amount = 100;
      const result = await request
        .patch('/user/balance')
        .send({ name: testUser.name, amount:amount })
        .expect(200);
      expect(result.body.success).toBe(true);
      expect(result.body.balance).toBe(amount);
    });

    it('应该成功升级为VIP', async () => {
      // 先充值足够的余额
      await request
        .patch('/user/balance')
        .send({ name: testUser.name, amount: 288 })
        .expect(200);

      const result = await request
        .patch('/user/role')
        .send({ name: testUser.name, token: testToken })
        .expect(200);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe('操作成功,您已成为永久VIP!');
    });

    it('应该因余额不足而无法升级VIP', async () => {
      // 确保余额不足
      await request
        .patch('/user/balance')
        .send({ name: testUser.name, amount: -300 })
        .expect(200);

      const result = await request
        .patch('/user/role')
        .send({ name: testUser.name, token: testToken })
        .expect(200);
      expect(result.body.success).toBe(true);
      expect(result.body.message).toBe('余额不足，请先充值');
    });
  });

  describe('用户列表', () => {
    it('应该获取用户列表', async () => {
      const result = await request
        .get('/user/list')
        .expect(200);
      expect(result.body.data).toBeInstanceOf(Array);
      expect(result.body.totalPages).toBeGreaterThanOrEqual(1);
    });
  });
});
