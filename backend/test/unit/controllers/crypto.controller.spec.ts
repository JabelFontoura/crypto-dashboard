import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CryptoController } from '../../../src/modules/crypto/controllers/crypto.controller';
import { ICryptoService } from '../../../src/modules/crypto/interfaces/crypto-service.interface';
import { ICryptoWebSocketService } from '../../../src/modules/crypto/interfaces';

describe('CryptoController', () => {
  let controller: CryptoController;
  let cryptoService: ICryptoService;
  let webSocketService: ICryptoWebSocketService;

  const mockCryptoService = {
    getAllCurrentPrices: jest.fn(),
    getPriceHistory: jest.fn(),
    getHourlyAverages: jest.fn(),
    getAllHourlyAverages: jest.fn(),
    getStats: jest.fn(),
    addPriceUpdate: jest.fn(),
    getCurrentPrice: jest.fn(),
    calculateHourlyAverages: jest.fn(),
  };

  const mockWebSocketService = {
    getConnectionState: jest.fn(),
    updateApiKey: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    onMessage: jest.fn(),
    onConnectionStateChange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CryptoController],
      providers: [
        {
          provide: 'ICryptoService',
          useValue: mockCryptoService,
        },
        {
          provide: 'ICryptoWebSocketService',
          useValue: mockWebSocketService,
        },
      ],
    }).compile();

    controller = module.get<CryptoController>(CryptoController);
    cryptoService = module.get<ICryptoService>('ICryptoService');
    webSocketService = module.get<ICryptoWebSocketService>(
      'ICryptoWebSocketService'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentPrices', () => {
    it('should return current prices successfully', async () => {
      const mockPrices = [
        {
          id: 1,
          symbol: 'BINANCE:ETHUSDT',
          price: 2500.5,
          timestamp: Date.now(),
          createdAt: new Date(),
          updatedAt: new Date(),
          toJSON: () => ({
            id: 1,
            symbol: 'BINANCE:ETHUSDT',
            price: 2500.5,
            timestamp: Date.now(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      mockCryptoService.getAllCurrentPrices.mockResolvedValue(mockPrices);

      const result = await controller.getCurrentPrices();

      expect(result).toEqual({
        success: true,
        data: mockPrices.map((price) => price.toJSON()),
        timestamp: expect.any(Number),
      });
      expect(mockCryptoService.getAllCurrentPrices).toHaveBeenCalled();
    });

    it('should throw HttpException when service fails', async () => {
      const error = new Error('Service error');
      mockCryptoService.getAllCurrentPrices.mockRejectedValue(error);

      await expect(controller.getCurrentPrices()).rejects.toThrow(
        HttpException
      );
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history successfully', async () => {
      const query = { symbol: 'BINANCE:ETHUSDT', hours: 24 };
      const mockHistory = [
        {
          id: 1,
          symbol: query.symbol,
          price: 2500.5,
          timestamp: Date.now(),
          createdAt: new Date(),
          updatedAt: new Date(),
          toJSON: () => ({
            id: 1,
            symbol: query.symbol,
            price: 2500.5,
            timestamp: Date.now(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      mockCryptoService.getPriceHistory.mockResolvedValue(mockHistory);

      const result = await controller.getPriceHistory(query);

      expect(result).toEqual({
        success: true,
        data: mockHistory.map((price) => price.toJSON()),
        symbol: query.symbol,
        hours: query.hours,
        timestamp: expect.any(Number),
      });
      expect(mockCryptoService.getPriceHistory).toHaveBeenCalledWith(
        query.symbol,
        query.hours
      );
    });

    it('should use default hours when not provided', async () => {
      const query = { symbol: 'BINANCE:ETHUSDT' };
      const mockHistory = [];

      mockCryptoService.getPriceHistory.mockResolvedValue(mockHistory);

      await controller.getPriceHistory(query);

      expect(mockCryptoService.getPriceHistory).toHaveBeenCalledWith(
        query.symbol,
        24
      );
    });

    it('should throw HttpException when service fails', async () => {
      const query = { symbol: 'BINANCE:ETHUSDT', hours: 24 };
      const error = new Error('Service error');
      mockCryptoService.getPriceHistory.mockRejectedValue(error);

      await expect(controller.getPriceHistory(query)).rejects.toThrow(
        HttpException
      );
    });
  });

  describe('getHourlyAverages', () => {
    it('should return hourly averages for specific symbol', async () => {
      const query = { symbol: 'BINANCE:ETHUSDT', hours: 24 };
      const mockAverages = [
        {
          symbol: query.symbol,
          averagePrice: 2500.5,
          hour: '2025-09-29T17',
          count: 100,
          toJSON: () => ({
            symbol: query.symbol,
            averagePrice: 2500.5,
            hour: '2025-09-29T17',
            count: 100,
          }),
        },
      ];

      mockCryptoService.getHourlyAverages.mockResolvedValue(mockAverages);

      const result = await controller.getHourlyAverages(query);

      expect(result).toEqual({
        success: true,
        data: mockAverages.map((avg) => avg.toJSON()),
        symbol: query.symbol,
        hours: query.hours,
        timestamp: expect.any(Number),
      });
    });

    it('should return all hourly averages when no symbol provided', async () => {
      const query = { hours: 24 };
      const mockAllAverages = {
        'BINANCE:ETHUSDT': [
          {
            symbol: 'BINANCE:ETHUSDT',
            averagePrice: 2500.5,
            hour: '2025-09-29T17',
            count: 100,
            toJSON: () => ({
              symbol: 'BINANCE:ETHUSDT',
              averagePrice: 2500.5,
              hour: '2025-09-29T17',
              count: 100,
            }),
          },
        ],
      };

      mockCryptoService.getAllHourlyAverages.mockResolvedValue(mockAllAverages);

      const result = await controller.getHourlyAverages(query);

      expect(result).toEqual({
        success: true,
        data: {
          'BINANCE:ETHUSDT': mockAllAverages['BINANCE:ETHUSDT'].map((avg) =>
            avg.toJSON()
          ),
        },
        hours: query.hours,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status successfully', async () => {
      const mockStatus = {
        status: 'connected' as const,
        timestamp: Date.now(),
      };

      mockWebSocketService.getConnectionState.mockReturnValue(mockStatus);

      const result = controller.getConnectionStatus();

      expect(result).toEqual({
        success: true,
        data: mockStatus,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('getStats', () => {
    it('should return system stats successfully', async () => {
      const mockStats = {
        totalPricePoints: 1000,
        totalHourlyAverages: 48,
        symbols: ['BINANCE:ETHUSDT'],
        currentPrices: [
          {
            id: 1,
            symbol: 'BINANCE:ETHUSDT',
            price: 2500.5,
            timestamp: Date.now(),
            createdAt: new Date(),
            updatedAt: new Date(),
            toJSON: () => ({
              id: 1,
              symbol: 'BINANCE:ETHUSDT',
              price: 2500.5,
              timestamp: Date.now(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        ],
        lastUpdate: Date.now(),
        dataRetentionHours: 24,
      };

      mockCryptoService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(result).toEqual({
        success: true,
        data: {
          ...mockStats,
          currentPrices: mockStats.currentPrices.map((price) => price.toJSON()),
        },
        timestamp: expect.any(Number),
      });
    });
  });

  describe('updateApiKey', () => {
    it('should update API key successfully', async () => {
      const apiKey = 'test-api-key';
      mockWebSocketService.updateApiKey.mockResolvedValue(undefined);

      const result = await controller.updateApiKey(apiKey);

      expect(result).toEqual({
        success: true,
        message: 'API key updated successfully',
        timestamp: expect.any(Number),
      });
      expect(mockWebSocketService.updateApiKey).toHaveBeenCalledWith(apiKey);
    });

    it('should throw HttpException for invalid API key', async () => {
      await expect(controller.updateApiKey('')).rejects.toThrow(
        new HttpException(
          'API key is required and must be a string',
          HttpStatus.BAD_REQUEST
        )
      );
    });

    it('should throw HttpException when service fails', async () => {
      const apiKey = 'test-api-key';
      const error = new Error('Service error');
      mockWebSocketService.updateApiKey.mockRejectedValue(error);

      await expect(controller.updateApiKey(apiKey)).rejects.toThrow(
        HttpException
      );
    });
  });
});
