import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { CryptoPair } from '../../src/modules/crypto/models/crypto-pair.model';
import { HourlyAverage } from '../../src/modules/crypto/models/hourly-average.model';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    })
      .overrideModule(
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          models: [CryptoPair, HourlyAverage],
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        })
      )
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const sequelize = app.get('SEQUELIZE');
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await CryptoPair.destroy({ where: {} });
    await HourlyAverage.destroy({ where: {} });
  });

  describe('Application Health', () => {
    it('should be defined', () => {
      expect(app).toBeDefined();
    });

    it('should respond to health check', async () => {
      return request(app.getHttpServer())
        .get('/api/crypto/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });
  });

  describe('Full Workflow', () => {
    it('should handle complete crypto data workflow', async () => {
      const testData = {
        symbol: 'BINANCE:ETHUSDT',
        price: 2500.5,
        timestamp: Date.now(),
      };

      await CryptoPair.create(testData);

      const currentPricesResponse = await request(app.getHttpServer())
        .get('/api/crypto/current-prices')
        .expect(200);

      expect(currentPricesResponse.body.success).toBe(true);
      expect(currentPricesResponse.body.data).toHaveLength(1);
      expect(currentPricesResponse.body.data[0]).toMatchObject({
        symbol: testData.symbol,
        price: testData.price,
      });

      const priceHistoryResponse = await request(app.getHttpServer())
        .get('/api/crypto/price-history')
        .query({ symbol: testData.symbol, hours: 24 })
        .expect(200);

      expect(priceHistoryResponse.body.success).toBe(true);
      expect(priceHistoryResponse.body.data).toHaveLength(1);
      expect(priceHistoryResponse.body.symbol).toBe(testData.symbol);

      const statsResponse = await request(app.getHttpServer())
        .get('/api/crypto/stats')
        .expect(200);

      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.totalPricePoints).toBeGreaterThan(0);
      expect(statsResponse.body.data.symbols).toContain(testData.symbol);
    });

    it('should handle API key update workflow', async () => {
      const connectionStatusBefore = await request(app.getHttpServer())
        .get('/api/crypto/connection-status')
        .expect(200);

      expect(connectionStatusBefore.body.success).toBe(true);
      expect(connectionStatusBefore.body.data.status).toBeDefined();

      const updateApiKeyResponse = await request(app.getHttpServer())
        .post('/api/crypto/update-api-key')
        .send({ apiKey: 'test-api-key-12345' })
        .expect(200);

      expect(updateApiKeyResponse.body.success).toBe(true);
      expect(updateApiKeyResponse.body.message).toBe(
        'API key updated successfully'
      );

      const connectionStatusAfter = await request(app.getHttpServer())
        .get('/api/crypto/connection-status')
        .expect(200);

      expect(connectionStatusAfter.body.success).toBe(true);
    });

    it('should handle hourly averages workflow', async () => {
      const hourlyAverageData = {
        symbol: 'BINANCE:ETHUSDT',
        averagePrice: 2500.5,
        hour: '2025-09-29T17',
        count: 100,
      };

      await HourlyAverage.create(hourlyAverageData);

      const hourlyAveragesResponse = await request(app.getHttpServer())
        .get('/api/crypto/hourly-averages')
        .query({ symbol: hourlyAverageData.symbol, hours: 24 })
        .expect(200);

      expect(hourlyAveragesResponse.body.success).toBe(true);
      expect(hourlyAveragesResponse.body.data).toHaveLength(1);
      expect(hourlyAveragesResponse.body.data[0]).toMatchObject({
        symbol: hourlyAverageData.symbol,
        averagePrice: hourlyAverageData.averagePrice,
        hour: hourlyAverageData.hour,
        count: hourlyAverageData.count,
      });

      const allHourlyAveragesResponse = await request(app.getHttpServer())
        .get('/api/crypto/hourly-averages')
        .query({ hours: 24 })
        .expect(200);

      expect(allHourlyAveragesResponse.body.success).toBe(true);
      expect(allHourlyAveragesResponse.body.data).toHaveProperty(
        hourlyAverageData.symbol
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      await request(app.getHttpServer())
        .get('/api/crypto/price-history')
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/crypto/update-api-key')
        .send({})
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/crypto/update-api-key')
        .send({ apiKey: '' })
        .expect(400);
    });

    it('should return proper error structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/crypto/price-history')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across requests', async () => {
      const testData = {
        symbol: 'BINANCE:ETHUSDT',
        price: 2500.5,
        timestamp: Date.now(),
      };

      await CryptoPair.create(testData);

      const firstRequest = await request(app.getHttpServer())
        .get('/api/crypto/current-prices')
        .expect(200);

      expect(firstRequest.body.data).toHaveLength(1);

      const secondRequest = await request(app.getHttpServer())
        .get('/api/crypto/current-prices')
        .expect(200);

      expect(secondRequest.body.data).toHaveLength(1);
      expect(secondRequest.body.data[0]).toMatchObject({
        symbol: testData.symbol,
        price: testData.price,
      });
    });
  });
});
