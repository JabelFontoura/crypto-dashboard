import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import * as request from 'supertest';
import { CryptoModule } from '../../src/modules/crypto/crypto.module';
import { DatabaseModule } from '../../src/modules/database/database.module';
import { CryptoPair } from '../../src/modules/crypto/models/crypto-pair.model';
import { HourlyAverage } from '../../src/modules/crypto/models/hourly-average.model';

describe('Crypto API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          models: [CryptoPair, HourlyAverage],
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        }),
        CryptoModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await app.get('SEQUELIZE').sync({ force: true });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await CryptoPair.destroy({ where: {} });
    await HourlyAverage.destroy({ where: {} });
  });

  describe('/api/crypto/current-prices (GET)', () => {
    it('should return empty array when no prices exist', () => {
      return request(app.getHttpServer())
        .get('/api/crypto/current-prices')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            success: true,
            data: [],
            timestamp: expect.any(Number),
          });
        });
    });

    it('should return current prices when they exist', async () => {
      await CryptoPair.create({
        symbol: 'BINANCE:ETHUSDT',
        price: 2500.5,
        timestamp: Date.now(),
      });

      return request(app.getHttpServer())
        .get('/api/crypto/current-prices')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0]).toMatchObject({
            symbol: 'BINANCE:ETHUSDT',
            price: 2500.5,
          });
        });
    });
  });

  describe('/api/crypto/price-history (GET)', () => {
    it('should return price history for valid symbol', async () => {
      const now = Date.now();
      await CryptoPair.bulkCreate([
        {
          symbol: 'BINANCE:ETHUSDT',
          price: 2500.5,
          timestamp: now - 3600000,
        },
        {
          symbol: 'BINANCE:ETHUSDT',
          price: 2510.75,
          timestamp: now,
        },
      ]);

      return request(app.getHttpServer())
        .get('/api/crypto/price-history')
        .query({ symbol: 'BINANCE:ETHUSDT', hours: 24 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(2);
          expect(res.body.symbol).toBe('BINANCE:ETHUSDT');
          expect(res.body.hours).toBe(24);
        });
    });

    it('should return 400 for missing symbol', () => {
      return request(app.getHttpServer())
        .get('/api/crypto/price-history')
        .expect(400);
    });

    it('should use default hours when not provided', async () => {
      await CryptoPair.create({
        symbol: 'BINANCE:ETHUSDT',
        price: 2500.5,
        timestamp: Date.now(),
      });

      return request(app.getHttpServer())
        .get('/api/crypto/price-history')
        .query({ symbol: 'BINANCE:ETHUSDT' })
        .expect(200)
        .expect((res) => {
          expect(res.body.hours).toBe(24);
        });
    });
  });

  describe('/api/crypto/hourly-averages (GET)', () => {
    it('should return hourly averages for specific symbol', async () => {
      await HourlyAverage.create({
        symbol: 'BINANCE:ETHUSDT',
        averagePrice: 2500.5,
        hour: '2025-09-29T17',
        count: 100,
      });

      return request(app.getHttpServer())
        .get('/api/crypto/hourly-averages')
        .query({ symbol: 'BINANCE:ETHUSDT', hours: 24 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0]).toMatchObject({
            symbol: 'BINANCE:ETHUSDT',
            averagePrice: 2500.5,
            hour: '2025-09-29T17',
            count: 100,
          });
        });
    });

    it('should return all hourly averages when no symbol provided', async () => {
      await HourlyAverage.bulkCreate([
        {
          symbol: 'BINANCE:ETHUSDT',
          averagePrice: 2500.5,
          hour: '2025-09-29T17',
          count: 100,
        },
        {
          symbol: 'BINANCE:ETHUSDC',
          averagePrice: 2501.25,
          hour: '2025-09-29T17',
          count: 150,
        },
      ]);

      return request(app.getHttpServer())
        .get('/api/crypto/hourly-averages')
        .query({ hours: 24 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('BINANCE:ETHUSDT');
          expect(res.body.data).toHaveProperty('BINANCE:ETHUSDC');
        });
    });
  });

  describe('/api/crypto/connection-status (GET)', () => {
    it('should return connection status', () => {
      return request(app.getHttpServer())
        .get('/api/crypto/connection-status')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('status');
          expect(res.body.data).toHaveProperty('timestamp');
        });
    });
  });

  describe('/api/crypto/stats (GET)', () => {
    it('should return system statistics', async () => {
      await CryptoPair.create({
        symbol: 'BINANCE:ETHUSDT',
        price: 2500.5,
        timestamp: Date.now(),
      });

      return request(app.getHttpServer())
        .get('/api/crypto/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('totalPricePoints');
          expect(res.body.data).toHaveProperty('totalHourlyAverages');
          expect(res.body.data).toHaveProperty('symbols');
          expect(res.body.data).toHaveProperty('currentPrices');
          expect(res.body.data).toHaveProperty('dataRetentionHours');
        });
    });
  });

  describe('/api/crypto/update-api-key (POST)', () => {
    it('should update API key successfully', () => {
      return request(app.getHttpServer())
        .post('/api/crypto/update-api-key')
        .send({ apiKey: 'test-api-key' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('API key updated successfully');
        });
    });

    it('should return 400 for missing API key', () => {
      return request(app.getHttpServer())
        .post('/api/crypto/update-api-key')
        .send({})
        .expect(400);
    });

    it('should return 400 for empty API key', () => {
      return request(app.getHttpServer())
        .post('/api/crypto/update-api-key')
        .send({ apiKey: '' })
        .expect(400);
    });
  });
});
