import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CryptoDataService } from '../../../src/modules/crypto/services/crypto-data.service';
import { ICryptoRepository } from '../../../src/modules/crypto/interfaces/crypto-repository.interface';

// Mock the Sequelize Model to avoid initialization issues
jest.mock('sequelize-typescript', () => ({
  Table: () => (target: any) => target,
  Column: () => (target: any, propertyKey: string) => {},
  Model: class MockModel {
    public symbol: string = '';
    public price: number = 0;
    public timestamp: number = 0;
    public averagePrice: number = 0;
    public hour: string = '';
    public count: number = 0;
    public id: number = 0;
    public createdAt: Date = new Date();
    public updatedAt: Date = new Date();
  },
  DataType: {
    INTEGER: 'INTEGER',
    STRING: 'STRING',
    DOUBLE: 'DOUBLE',
    BIGINT: 'BIGINT',
  },
  PrimaryKey: () => (target: any, propertyKey: string) => {},
  AutoIncrement: () => (target: any, propertyKey: string) => {},
  AllowNull: () => (target: any, propertyKey: string) => {},
  Index: () => (target: any, propertyKey: string) => {},
  CreatedAt: () => (target: any, propertyKey: string) => {},
  UpdatedAt: () => (target: any, propertyKey: string) => {},
}));

describe('CryptoDataService', () => {
  let service: CryptoDataService;
  let repository: ICryptoRepository;
  let configService: ConfigService;

  const mockRepository = {
    savePriceUpdate: jest.fn(),
    getCurrentPrice: jest.fn(),
    getAllCurrentPrices: jest.fn(),
    getPriceHistory: jest.fn(),
    saveHourlyAverage: jest.fn(),
    getHourlyAverages: jest.fn(),
    getAllHourlyAverages: jest.fn(),
    cleanupOldData: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoDataService,
        {
          provide: 'ICryptoRepository',
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CryptoDataService>(CryptoDataService);
    repository = module.get<ICryptoRepository>('ICryptoRepository');
    configService = module.get<ConfigService>(ConfigService);

    mockConfigService.get.mockReturnValue({
      dataRetention: {
        priceHistoryHours: 24,
        hourlyAverageHours: 48,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addPriceUpdate', () => {
    it('should save price update successfully', async () => {
      const cryptoPair = {
        symbol: 'BINANCE:ETHUSDT',
        price: 2500.5,
        timestamp: Date.now(),
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockRepository.savePriceUpdate.mockResolvedValue(undefined);

      await service.addPriceUpdate(cryptoPair);

      expect(mockRepository.savePriceUpdate).toHaveBeenCalledWith(cryptoPair);
    });

    it('should throw error when repository fails', async () => {
      const cryptoPair = {
        symbol: 'BINANCE:ETHUSDT',
        price: 2500.5,
        timestamp: Date.now(),
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const error = new Error('Repository error');
      mockRepository.savePriceUpdate.mockRejectedValue(error);

      await expect(service.addPriceUpdate(cryptoPair)).rejects.toThrow(error);
    });
  });

  describe('getCurrentPrice', () => {
    it('should return current price for symbol', async () => {
      const symbol = 'BINANCE:ETHUSDT';
      const mockPrice = {
        symbol,
        price: 2500.5,
        timestamp: Date.now(),
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockRepository.getCurrentPrice.mockResolvedValue(mockPrice);

      const result = await service.getCurrentPrice(symbol);

      expect(result).toBe(mockPrice);
      expect(mockRepository.getCurrentPrice).toHaveBeenCalledWith(symbol);
    });

    it('should return null when no price found', async () => {
      const symbol = 'BINANCE:ETHUSDT';
      mockRepository.getCurrentPrice.mockResolvedValue(null);

      const result = await service.getCurrentPrice(symbol);

      expect(result).toBeNull();
    });
  });

  describe('getAllCurrentPrices', () => {
    it('should return all current prices', async () => {
      const mockPrices = [
        {
          symbol: 'BINANCE:ETHUSDT',
          price: 2500.5,
          timestamp: Date.now(),
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          symbol: 'BINANCE:ETHUSDC',
          price: 2501.25,
          timestamp: Date.now(),
          id: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any[];

      mockRepository.getAllCurrentPrices.mockResolvedValue(mockPrices);

      const result = await service.getAllCurrentPrices();

      expect(result).toBe(mockPrices);
      expect(mockRepository.getAllCurrentPrices).toHaveBeenCalled();
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for symbol', async () => {
      const symbol = 'BINANCE:ETHUSDT';
      const hours = 24;
      const mockHistory = [
        {
          symbol,
          price: 2500.5,
          timestamp: Date.now() - 3600000,
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          symbol,
          price: 2510.75,
          timestamp: Date.now(),
          id: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any[];

      mockRepository.getPriceHistory.mockResolvedValue(mockHistory);

      const result = await service.getPriceHistory(symbol, hours);

      expect(result).toBe(mockHistory);
      expect(mockRepository.getPriceHistory).toHaveBeenCalledWith(
        symbol,
        hours
      );
    });
  });

  describe('getStats', () => {
    it('should return system statistics', async () => {
      const mockCurrentPrices = [
        {
          symbol: 'BINANCE:ETHUSDT',
          price: 2500.5,
          timestamp: Date.now(),
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any[];

      const mockStats = {
        totalPricePoints: 1000,
        totalHourlyAverages: 48,
        symbols: ['BINANCE:ETHUSDT', 'BINANCE:ETHUSDC'],
        currentPrices: mockCurrentPrices,
        lastUpdate: Date.now(),
        dataRetentionHours: 24,
      };

      mockRepository.getAllCurrentPrices.mockResolvedValue(mockCurrentPrices);
      jest.spyOn(service, 'getStats').mockResolvedValue(mockStats);

      const result = await service.getStats();

      expect(result).toEqual(mockStats);
    });
  });
});
