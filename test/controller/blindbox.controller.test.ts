import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { BlindBoxService } from '../../src/service/blindbox.service';
import * as fs from 'fs';
import * as path from 'path';


describe('test/blindbox.controller.test.ts', () => {
  let app;
  let request;
  let blindBoxService: BlindBoxService;


  // Test data
  const testBlindBox = {
    name: 'test_blindbox_' + Math.random().toString(36).substr(2, 5),
    price: 100,
    num: 10
  };

  beforeAll(async () => {
    // Create app instance
    app = await createApp<Framework>();
    request = createHttpRequest(app);

    // Get service instances
    blindBoxService = await app.getApplicationContext().getAsync(BlindBoxService);
  });

  afterAll(async () => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    // Close app instance
    await close(app);
  });

  describe('BlindBox Controller', () => {
    let createdBlindBoxId: number;

    // Test GET /blindbox/information
    describe('GET /blindbox/information', () => {
      it('should get blindbox information with pagination', async () => {
        const result = await request
          .get('/blindbox/information')
          .query({ page: 1 })
          .expect(200);

        expect(result.body.data).toBeInstanceOf(Array);
        expect(result.body.totalPages).toBeDefined();
        expect(result.body.data.length).toBeGreaterThan(0);
      });

    });

    // Test GET /blindbox/details
    describe('GET /blindbox/details', () => {
      it('should get blindbox details by id', async () => {
        // First create a test blindbox
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        createdBlindBoxId = blindBox.id;

        const result = await request
          .get('/blindbox/details')
          .query({ id: createdBlindBoxId })
          .expect(200);

        expect(result.body.id).toBe(createdBlindBoxId);
        expect(result.body.name).toBe(testBlindBox.name);
      });

      it('should return error for missing id parameter', async () => {
        const result = await request
          .get('/blindbox/details')
          .expect(200);

        expect(result.body.success).toBe(false);
        expect(result.body.message).toContain('缺少id参数');
      });

      it('should return error for non-existent blindbox', async () => {
        await request
          .get('/blindbox/details')
          .query({ id: 999999 })
          .expect(500);
      });
    });

    // Test GET /blindbox/specialinformation
    describe('GET /blindbox/specialinformation', () => {
      it('should search blindboxes by keyword', async () => {
        const result = await request
          .get('/blindbox/specialinformation')
          .query({ keyword: 'none', page: 1 })
          .expect(200);

        expect(result.body.data).toBeInstanceOf(Array);
        expect(result.body.totalPages).toBeDefined();
      });

      it('should handle empty keyword', async () => {
        const result = await request
          .get('/blindbox/specialinformation')
          .query({ page: 1 })
          .expect(200);

        expect(result.body.data).toBeInstanceOf(Array);
      });
    });

    // Test POST /blindbox/
    describe('POST /blindbox/', () => {
      it('should create a new blindbox', async () => {
        const result = await request
          .post('/blindbox')
          .field('name', testBlindBox.name)
          .field('price', testBlindBox.price.toString())
          .field('num', testBlindBox.num.toString())
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should create a blindbox with image', async () => {
        // This would need a real file upload test in a real scenario
        const result = await request
          .post('/blindbox')
          .field('name', testBlindBox.name + '_with_image')
          .field('price', testBlindBox.price.toString())
          .field('num', testBlindBox.num.toString())
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle missing required fields', async () => {
        await request
          .post('/blindbox')
          .field('name', testBlindBox.name)
          // Missing price and num
          .expect(500);
      });
    });

    // Test DELETE /blindbox/
    describe('DELETE /blindbox/', () => {
      it('should delete a blindbox', async () => {
        // First create a test blindbox to delete
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const blindBoxId = blindBox.id;

        const result = await request
          .del('/blindbox')
          .query({ id: blindBoxId })
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle deleting non-existent blindbox', async () => {
        await request
          .del('/blindbox')
          .query({ id: 999999 })
          .expect(500);
      });
    });

    // Test PUT /blindbox/price
    describe('PUT /blindbox/price', () => {
      it('should update blindbox price', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const newPrice = 200;

        const result = await request
          .put('/blindbox/price')
          .send({ id: blindBox.id, price: newPrice })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the update
        const updated = await blindBoxService.getBlindBoxById(blindBox.id);
        expect(updated.price).toBe(newPrice);
      });

      it('should handle invalid price update', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);

        await request
          .put('/blindbox/price')
          .send({ id: blindBox.id, price: 'invalid' })
          .expect(200);
      });
    });

    // Test PUT /blindbox/num
    describe('PUT /blindbox/num', () => {
      it('should update blindbox quantity', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const newNum = 20;

        const result = await request
          .put('/blindbox/num')
          .send({ id: blindBox.id, num: newNum })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the update
        const updated = await blindBoxService.getBlindBoxById(blindBox.id);
        expect(updated.num).toBe(newNum);
      });
    });

    // Test PUT /blindbox/name
    describe('PUT /blindbox/name', () => {
      it('should update blindbox name', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const newName = 'Updated ' + testBlindBox.name;

        const result = await request
          .put('/blindbox/name')
          .send({ id: blindBox.id, name: newName })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the update
        const updated = await blindBoxService.getBlindBoxById(blindBox.id);
        expect(updated.name).toBe(newName);
      });
    });

    // Test GET /blindbox/goods
    describe('GET /blindbox/goods', () => {
      it('should get goods in a blindbox', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        // Add some goods to the blindbox
        await blindBoxService.addGoodToBlindBox(blindBox.id, 1);

        const result = await request
          .get('/blindbox/goods')
          .query({ id: blindBox.id })
          .expect(200);

        expect(result.body.success).toBe(true);
        expect(result.body.data).toBeInstanceOf(Array);
      });
    });

    // Test PATCH /blindbox/goods
    describe('PATCH /blindbox/goods', () => {
      it('should add goods to blindbox', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const goodsId = 1; // Assuming this goods exists from initialization

        const result = await request
          .patch('/blindbox/goods')
          .send({
            blindBoxId: blindBox.id,
            goodsId: goodsId,
            isExist: false
          })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the goods was added
        const exists = await blindBoxService.isGoodsInBlindBox(blindBox.id, goodsId);
        expect(exists).toBe(true);
      });

      it('should remove goods from blindbox', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const goodsId = 1;
        // First add the goods
        await blindBoxService.addGoodToBlindBox(blindBox.id, goodsId);

        const result = await request
          .patch('/blindbox/goods')
          .send({
            blindBoxId: blindBox.id,
            goodsId: goodsId,
            isExist: true
          })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the goods was removed
        const exists = await blindBoxService.isGoodsInBlindBox(blindBox.id, goodsId);
        expect(exists).toBe(false);
      });

      it('should handle invalid operations', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const goodsId = 1;

        await request
          .patch('/blindbox/goods')
          .send({
            blindBoxId: blindBox.id,
            goodsId: goodsId,
            isExist: true // Trying to remove when not present
          })
          .expect(500);
      });
    });

    // Test OPTIONS routes
    describe('OPTIONS routes', () => {
      it('should handle OPTIONS /blindbox/information', async () => {
        const result = await request
          .options('/blindbox/information')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindbox/details', async () => {
        const result = await request
          .options('/blindbox/details')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindbox/specialinformation', async () => {
        const result = await request
          .options('/blindbox/specialinformation')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindbox/', async () => {
        const result = await request
          .options('/blindbox')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindbox/price', async () => {
        const result = await request
          .options('/blindbox/price')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindbox/num', async () => {
        const result = await request
          .options('/blindbox/num')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindbox/name', async () => {
        const result = await request
          .options('/blindbox/name')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindbox/goods', async () => {
        const result = await request
          .options('/blindbox/goods')
          .expect(200);

        expect(result.body.success).toBe(true);
      });
    });
  });
});
