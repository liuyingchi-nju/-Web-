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

    // Test GET /blindboxs/list/:page
    describe('GET /blindboxes/list/:page', () => {
      it('should get blindbox list with pagination', async () => {
        const result = await request
          .get('/blindboxes/list/1')
          .expect(200);

        expect(result.body.data).toBeInstanceOf(Array);
        expect(result.body.totalPages).toBeDefined();
        expect(result.body.data.length).toBeGreaterThan(0);
      });
    });

    // Test GET /blindboxs/:id
    describe('GET /blindboxes/:id', () => {
      it('should get blindbox details by id', async () => {
        // First create a test blindbox
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        createdBlindBoxId = blindBox.id;

        const result = await request
          .get(`/blindboxes/${createdBlindBoxId}`)
          .expect(200);

        expect(result.body.id).toBe(createdBlindBoxId);
        expect(result.body.name).toBe(testBlindBox.name);
      });

      it('should return error for non-existent blindbox', async () => {
        await request
          .get('/blindboxes/999999')
          .expect(500);
      });
    });

    // Test GET /blindboxs/list/:keyword/:page
    describe('GET /blindboxes/list/:keyword/:page', () => {
      it('should search blindboxes by keyword', async () => {
        const result = await request
          .get('/blindboxes/list/none/1')
          .expect(200);

        expect(result.body.data).toBeInstanceOf(Array);
        expect(result.body.totalPages).toBeDefined();
      });

      it('should handle empty keyword', async () => {
        await request
          .get('/blindboxes/list//1')
          .expect(404);
      });
    });

    // Test POST /blindboxs/
    describe('POST /blindboxes/', () => {
      it('should create a new blindbox', async () => {
        const result = await request
          .post('/blindboxes')
          .field('name', testBlindBox.name)
          .field('price', testBlindBox.price.toString())
          .field('num', testBlindBox.num.toString())
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should create a blindbox with image', async () => {
        // This would need a real file upload test in a real scenario
        const result = await request
          .post('/blindboxes')
          .field('name', testBlindBox.name + '_with_image')
          .field('price', testBlindBox.price.toString())
          .field('num', testBlindBox.num.toString())
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle missing required fields', async () => {
        await request
          .post('/blindboxes')
          .field('name', testBlindBox.name)
          // Missing price and num
          .expect(500);
      });
    });

    // Test DELETE /blindboxs/:id
    describe('DELETE /blindboxes/:id', () => {
      it('should delete a blindbox', async () => {
        // First create a test blindbox to delete
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const blindBoxId = blindBox.id;

        const result = await request
          .del(`/blindboxes/${blindBoxId}`)
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle deleting non-existent blindbox', async () => {
        await request
          .del('/blindboxes/999999')
          .expect(500);
      });
    });

    // Test PATCH /blindboxs/:id/price
    describe('PATCH /blindboxes/:id/price', () => {
      it('should update blindbox price', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const newPrice = 200;

        const result = await request
          .patch(`/blindboxes/${blindBox.id}/price`)
          .send({ price: newPrice })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the update
        const updated = await blindBoxService.getBlindBoxById(blindBox.id);
        expect(updated.price).toBe(newPrice);
      });

      it('should handle invalid price update', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);

        await request
          .patch(`/blindboxes/${blindBox.id}/price`)
          .send({ price: -1 })
          .expect(500);
      });
    });

    // Test PATCH /blindboxs/:id/num
    describe('PATCH /blindboxes/:id/num', () => {
      it('should update blindbox quantity', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const newNum = 20;

        const result = await request
          .patch(`/blindboxes/${blindBox.id}/num`)
          .send({ num: newNum })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the update
        const updated = await blindBoxService.getBlindBoxById(blindBox.id);
        expect(updated.num).toBe(newNum);
      });
    });

    // Test PATCH /blindboxs/:id/name
    describe('PATCH /blindboxes/:id/name', () => {
      it('should update blindbox name', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const newName = 'Updated ' + testBlindBox.name;

        const result = await request
          .patch(`/blindboxes/${blindBox.id}/name`)
          .send({ name: newName })
          .expect(200);

        expect(result.body.success).toBe(true);

        // Verify the update
        const updated = await blindBoxService.getBlindBoxById(blindBox.id);
        expect(updated.name).toBe(newName);
      });
    });

    // Test GET /blindboxs/:id/goods
    describe('GET /blindboxes/:id/goods', () => {
      it('should get goods in a blindbox', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        // Add some goods to the blindbox
        await blindBoxService.addGoodToBlindBox(blindBox.id, 1);

        const result = await request
          .get(`/blindboxes/${blindBox.id}/goods`)
          .expect(200);

        expect(result.body.success).toBe(true);
        expect(result.body.data).toBeInstanceOf(Array);
      });
    });

    // Test PATCH /blindboxs/:id/goods
    describe('PATCH /blindboxes/:id/goods', () => {
      it('should add goods to blindbox', async () => {
        const blindBox = await blindBoxService.createBlindBox(testBlindBox);
        const goodsId = 1; // Assuming this goods exists from initialization

        const result = await request
          .patch(`/blindboxes/${blindBox.id}/goods`)
          .send({
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
          .patch(`/blindboxes/${blindBox.id}/goods`)
          .send({
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
          .patch(`/blindboxes/${blindBox.id}/goods`)
          .send({
            goodsId: goodsId,
            isExist: true // Trying to remove when not present
          })
          .expect(500);
      });
    });

    // Test OPTIONS routes
    describe('OPTIONS routes', () => {
      it('should handle OPTIONS /blindboxes/list/:page', async () => {
        const result = await request
          .options('/blindboxes/list/1')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindboxes/:id', async () => {
        const result = await request
          .options('/blindboxes/1')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindboxs/list/:keyword/:page', async () => {
        const result = await request
          .options('/blindboxes/list/test/1')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindboxes/', async () => {
        const result = await request
          .options('/blindboxes')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindboxes/:id/price', async () => {
        const result = await request
          .options('/blindboxes/1/price')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindboxes/:id/num', async () => {
        const result = await request
          .options('/blindboxes/1/num')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindboxes/:id/name', async () => {
        const result = await request
          .options('/blindboxes/1/name')
          .expect(200);

        expect(result.body.success).toBe(true);
      });

      it('should handle OPTIONS /blindboxes/:id/goods', async () => {
        const result = await request
          .options('/blindboxes/1/goods')
          .expect(200);

        expect(result.body.success).toBe(true);
      });
    });
  });
});
