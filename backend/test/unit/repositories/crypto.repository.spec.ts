import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { CryptoRepository } from '../../../src/modules/crypto/repositories/crypto.repository';
import { CryptoPair } from '../../../src/modules/crypto/models/crypto-pair.model';
import { HourlyAverage } from '../../../src/modules/crypto/models/hourly-average.model';

describe('CryptoRepository', () => {
  let repository: CryptoRepository;
  let cryptoPairModel: any;
  let hourlyAverageModel: any;

  const mockCryptoPairModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
  };

  const mockHourlyAverageModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    upsert: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoRepository,
        {
          provide: getModelToken(CryptoPair),
          useValue: mockCryptoPairModel,
        },
        {
          provide: getModelToken(HourlyAverage),
          useValue: mockHourlyAverageModel,
        },
      ],
    }).compile();

    repository = module.get<CryptoRepository>(CryptoRepository);
    cryptoPairModel = module.get(getModelToken(CryptoPair));
    hourlyAverageModel = module.get(getModelToken(HourlyAverage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('savePriceUpdate', () => {
    it('should save a price update successfully', async () => {
      const cryptoPair = {
        symbol: 'BINANCE:ETHUSDT',
        price: 2500.5,
        timestamp: Date.now(),
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockCryptoPairModel.create.mockResolvedValue({});

      await repository.savePriceUpdate(cryptoPair);

      expect(mockCryptoPairModel.create).toHaveBeenCalledWith({
        symbol: cryptoPair.symbol,
        price: cryptoPair.price,
        timestamp: cryptoPair.timestamp,
      });
    });

    it('should throw error when save fails', async () => {
      const cryptoPair = {
        symbol: 'BINANCE:ETHUSDT',
        price: 2500.5,
        timestamp: Date.now(),
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const error = new Error('Database error');
      mockCryptoPairModel.create.mockRejectedValue(error);

      await expect(repository.savePriceUpdate(cryptoPair)).rejects.toThrow(
        error
      );
    });
  });

  describe('getCurrentPrice', () => {
    it('should return current price for symbol', async () => {
      const symbol = 'BINANCE:ETHUSDT';
      const mockPrice = {
        symbol,
        price: 2500.5,
        timestamp: Date.now(),
      };

      mockCryptoPairModel.findOne.mockResolvedValue(mockPrice);

      const result = await repository.getCurrentPrice(symbol);

      expect(result).toBe(mockPrice);
      expect(mockCryptoPairModel.findOne).toHaveBeenCalledWith({
        where: { symbol },
        order: [['timestamp', 'DESC']],
      });
    });

    it('should return null when no price found', async () => {
      const symbol = 'BINANCE:ETHUSDT';
      mockCryptoPairModel.findOne.mockResolvedValue(null);

      const result = await repository.getCurrentPrice(symbol);

      expect(result).toBeNull();
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for symbol and time range', async () => {
      const symbol = 'BINANCE:ETHUSDT';
      const hours = 24;
      const mockPrices = [
        { symbol, price: 2500.5, timestamp: Date.now() - 3600000 },
        { symbol, price: 2510.75, timestamp: Date.now() },
      ];

      mockCryptoPairModel.findAll.mockResolvedValue(mockPrices);

      const result = await repository.getPriceHistory(symbol, hours);

      expect(result).toBe(mockPrices);
      expect(mockCryptoPairModel.findAll).toHaveBeenCalledWith({
        where: {
          symbol,
          timestamp: expect.any(Object),
        },
        order: [['timestamp', 'ASC']],
        limit: 1000,
      });
    });
  });

  describe('saveHourlyAverage', () => {
    it('should save hourly average successfully', async () => {
      const hourlyAverage = {
        symbol: 'BINANCE:ETHUSDT',
        averagePrice: 2500.5,
        hour: '2025-09-29T17',
        count: 100,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockHourlyAverageModel.upsert.mockResolvedValue([{}, true]);

      await repository.saveHourlyAverage(hourlyAverage);

      expect(mockHourlyAverageModel.upsert).toHaveBeenCalledWith({
        symbol: hourlyAverage.symbol,
        averagePrice: hourlyAverage.averagePrice,
        hour: hourlyAverage.hour,
        count: hourlyAverage.count,
      });
    });
  });

  describe('getHourlyAverages', () => {
    it('should return hourly averages for symbol and time range', async () => {
      const symbol = 'BINANCE:ETHUSDT';
      const hours = 24;
      const mockAverages = [
        { symbol, averagePrice: 2500.5, hour: '2025-09-29T16', count: 100 },
        { symbol, averagePrice: 2510.75, hour: '2025-09-29T17', count: 150 },
      ];

      mockHourlyAverageModel.findAll.mockResolvedValue(mockAverages);

      const result = await repository.getHourlyAverages(symbol, hours);

      expect(result).toBe(mockAverages);
      expect(mockHourlyAverageModel.findAll).toHaveBeenCalledWith({
        where: {
          symbol,
          hour: expect.any(Object),
        },
        order: [['hour', 'ASC']],
      });
    });
  });
});
