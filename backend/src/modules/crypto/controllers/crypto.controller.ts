import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Inject,
} from '@nestjs/common';
import { ICryptoService, ICryptoWebSocketService } from '../interfaces';
import { AppLogger } from '../../../shared/utils/logger.util';
import { GetPriceHistoryDto, GetHourlyAveragesDto } from '../dto';

@Controller('api/crypto')
@UsePipes(new ValidationPipe({ transform: true }))
export class CryptoController {
  private readonly logger = new AppLogger(CryptoController.name);

  constructor(
    @Inject('ICryptoService') private readonly cryptoService: ICryptoService,
    @Inject('ICryptoWebSocketService')
    private readonly webSocketService: ICryptoWebSocketService
  ) {}

  @Get('current-prices')
  async getCurrentPrices() {
    try {
      this.logger.log('Fetching current prices');
      const data = await this.cryptoService.getAllCurrentPrices();

      return {
        success: true,
        data: data.map((price) => price.toJSON()),
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to fetch current prices', error.stack);
      throw new HttpException(
        'Failed to fetch current prices',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('price-history')
  async getPriceHistory(@Query() query: GetPriceHistoryDto) {
    try {
      const { symbol, hours = 24 } = query;

      this.logger.log(`Fetching price history for ${symbol} (${hours}h)`);
      const data = await this.cryptoService.getPriceHistory(symbol, hours);

      return {
        success: true,
        data: data.map((price) => price.toJSON()),
        symbol,
        hours,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch price history for ${query.symbol}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch price history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('hourly-averages')
  async getHourlyAverages(@Query() query: GetHourlyAveragesDto) {
    try {
      const { symbol, hours = 24 } = query;

      this.logger.log(
        `Fetching hourly averages${symbol ? ` for ${symbol}` : ''} (${hours}h)`
      );

      if (symbol) {
        const data = await this.cryptoService.getHourlyAverages(symbol, hours);
        return {
          success: true,
          data: data.map((avg) => avg.toJSON()),
          symbol,
          hours,
          timestamp: Date.now(),
        };
      }

      const data = await this.cryptoService.getAllHourlyAverages(hours);
      const transformedData: Record<string, any[]> = {};

      for (const [sym, averages] of Object.entries(data)) {
        transformedData[sym] = averages.map((avg) => avg.toJSON());
      }

      return {
        success: true,
        data: transformedData,
        hours,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to fetch hourly averages', error.stack);
      throw new HttpException(
        'Failed to fetch hourly averages',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('connection-status')
  getConnectionStatus() {
    try {
      this.logger.log('Fetching connection status');
      const data = this.webSocketService.getConnectionState();

      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to fetch connection status', error.stack);
      throw new HttpException(
        'Failed to fetch connection status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  async getStats() {
    try {
      this.logger.log('Fetching system stats');
      const data = await this.cryptoService.getStats();

      return {
        success: true,
        data: {
          ...data,
          currentPrices: data.currentPrices.map((price: any) => price.toJSON()),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to fetch system stats', error.stack);
      throw new HttpException(
        'Failed to fetch system stats',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('update-api-key')
  async updateApiKey(@Body('apiKey') apiKey: string) {
    try {
      if (!apiKey || typeof apiKey !== 'string') {
        throw new HttpException(
          'API key is required and must be a string',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log('Updating Finnhub API key');
      await this.webSocketService.updateApiKey(apiKey);

      return {
        success: true,
        message: 'API key updated successfully',
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('Failed to update API key', error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to update API key',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
