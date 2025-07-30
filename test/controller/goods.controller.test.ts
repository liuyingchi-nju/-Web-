import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { GoodsService } from '../../src/service/goods.service';
import * as fs from 'fs';
import * as path from 'path';

describe('test/goods.controller.test.ts', () => {
  let app;
  let request;
  let goodsService: GoodsService;

  // Test data with random strings to avoid conflicts
  const testGoods = {
    name: 'test_goods_' + Math.random().toString(36).substr(2, 8),
  };

  beforeAll(async () => {
    // Create app instance
    app = await createApp<Framework>();
    request = createHttpRequest(app);

    // Get service instance
    goodsService = await app.getApplicationContext().getAsync(GoodsService);
  });

  afterAll(async () => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    // Close app instance
    await close(app);
  });

  // Cleanup test goods
  async function cleanupTestGoods(name: string) {
    const goods = await goodsService.searchGoodsByName(name, 1, 1);
    if (goods.data.length > 0) {
      await goodsService.deleteGoods(goods.data[0].id);
    }
  }

  describe('GET /goods/:page', () => {
    it('should get all goods with pagination', async () => {
      const result = await request
        .get('/goods/1') // Using path parameter instead of query
        .expect(200);

      expect(result.body.data).toBeInstanceOf(Array);
      expect(result.body.data.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid page', async () => {
      const result = await request
        .get('/goods/999') // Very high page number
        .expect(200);

      expect(result.body.data).toBeInstanceOf(Array);
      expect(result.body.data.length).toBe(0);
    });
  });

  describe('GET /goods/:keyword/:page', () => {
    let testSearchGoods;

    beforeAll(async () => {
      // Create a specific test goods for search
      testSearchGoods = {
        name: 'SpecialSearchGoods_' + Math.random().toString(36).substr(2, 8)
      };
      await goodsService.createGoods({ name: testSearchGoods.name });
    });

    afterAll(async () => {
      await cleanupTestGoods(testSearchGoods.name);
    });

    it('should search goods by keyword', async () => {
      const result = await request
        .get(`/goods/${testSearchGoods.name}/1`) // Using path parameters
        .expect(200);

      expect(result.body.data).toBeInstanceOf(Array);
      expect(result.body.totalPages).toBeDefined();
      expect(result.body.data.some(g => g.name.includes(testSearchGoods.name))).toBe(true);
    });

  });

  describe('OPTIONS /goods/:page', () => {
    it('should handle OPTIONS request', async () => {
      const result = await request
        .options('/goods/1')
        .expect(200);

      expect(result.body.success).toBe(true);
    });
  });

  describe('POST /goods', () => {
    afterEach(async () => {
      await cleanupTestGoods(testGoods.name);
    });

    it('should create new goods without image', async () => {
      const result = await request
        .post('/goods')
        .field('name', testGoods.name)
        .expect(200);

      expect(result.body.success).toBe(true);

      // Verify the goods was created
      const goods = await goodsService.searchGoodsByName(testGoods.name, 1, 1);
      expect(goods.data.length).toBe(1);
      expect(goods.data[0].name).toBe(testGoods.name);
      expect(goods.data[0].avatarPath).toContain('nopicture.jpg'); // Default image
    });

    // Note: Actual file upload test would require more setup
    it('should create new goods with image', async () => {
      const result = await request
        .post('/goods')
        .field('name', testGoods.name + '_with_image')
        // In a real test, you would attach a file here
        // .attach('avatar', 'path/to/test/image.jpg')
        .expect(200);

      expect(result.body.success).toBe(true);

      // Verify the goods was created
      const goods = await goodsService.searchGoodsByName(testGoods.name + '_with_image', 1, 1);
      expect(goods.data.length).toBe(1);
    });
  });

  describe('Data Initialization', () => {
    it('should have initialized default goods', async () => {
      const result = await request
        .get('/goods/1')
        .expect(200);

      // Check that some default goods exist
      const defaultGoodsNames = [
        '芒果TV月卡',
        'QQ音乐三天绿钻体验卡',
        'bilibili大会员月卡'
      ];

      const hasDefaultGoods = defaultGoodsNames.some(name =>
        result.body.data.some(g => g.name.includes(name))
      );

      expect(hasDefaultGoods).toBe(true);
    });
  });
});
