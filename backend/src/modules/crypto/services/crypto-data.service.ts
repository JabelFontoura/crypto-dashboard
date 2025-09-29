import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Subscription, interval } from 'rxjs';
import { ICryptoService, ICryptoRepository } from '../interfaces';
import { CryptoPair } from '../models/crypto-pair.model';
import { HourlyAverage } from '../models/hourly-average.model';
import { AppLogger } from '../../../shared/utils/logger.util';
import { AppConfig } from '../../../shared/config/app.config';

@Injectable()
export class CryptoDataService
  implements ICryptoService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new AppLogger(CryptoDataService.name);
  private hourlyCalculationSubscription?: Subscription;
  private readonly config: AppConfig;

  constructor(
    @Inject('ICryptoRepository')
    private readonly cryptoRepository: ICryptoRepository,
    private readonly configService: ConfigService
  ) {
    this.config = this.configService.get<AppConfig>('app')!;
  }

  onModuleInit(): void {
    this.startHourlyCalculation();
  }

  onModuleDestroy(): void {
    this.stopHourlyCalculation();
  }

  async addPriceUpdate(cryptoPair: CryptoPair): Promise<void> {
    try {
      await this.cryptoRepository.savePriceUpdate(cryptoPair);
      this.logger.debug(
        `Processed price update for ${cryptoPair.symbol}: $${cryptoPair.price}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to process price update for ${cryptoPair.symbol}`,
        error.stack
      );
      throw error;
    }
  }

  async getCurrentPrice(symbol: string): Promise<CryptoPair | null> {
    try {
      return await this.cryptoRepository.getCurrentPrice(symbol);
    } catch (error) {
      this.logger.error(
        `Failed to get current price for ${symbol}`,
        error.stack
      );
      throw error;
    }
  }

  async getAllCurrentPrices(): Promise<CryptoPair[]> {
    try {
      return await this.cryptoRepository.getAllCurrentPrices();
    } catch (error) {
      this.logger.error('Failed to get all current prices', error.stack);
      throw error;
    }
  }

  async getPriceHistory(
    symbol: string,
    hours: number = 24
  ): Promise<CryptoPair[]> {
    try {
      this.validateHoursParameter(hours);
      return await this.cryptoRepository.getPriceHistory(symbol, hours);
    } catch (error) {
      this.logger.error(
        `Failed to get price history for ${symbol}`,
        error.stack
      );
      throw error;
    }
  }

  async getHourlyAverages(
    symbol: string,
    hours: number = 24
  ): Promise<HourlyAverage[]> {
    try {
      this.validateHoursParameter(hours);
      return await this.cryptoRepository.getHourlyAverages(symbol, hours);
    } catch (error) {
      this.logger.error(
        `Failed to get hourly averages for ${symbol}`,
        error.stack
      );
      throw error;
    }
  }

  async getAllHourlyAverages(
    hours: number = 24
  ): Promise<Record<string, HourlyAverage[]>> {
    try {
      this.validateHoursParameter(hours);
      return await this.cryptoRepository.getAllHourlyAverages(hours);
    } catch (error) {
      this.logger.error('Failed to get all hourly averages', error.stack);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const currentPrices = await this.getAllCurrentPrices();
      const dataStats = await this.cryptoRepository.getDataStats();

      return {
        ...dataStats,
        currentPrices,
        lastUpdate:
          currentPrices.length > 0
            ? Math.max(...currentPrices.map((p) => p.timestamp))
            : null,
        dataRetentionHours: this.config.dataRetention.priceHistoryHours,
      };
    } catch (error) {
      this.logger.error('Failed to get stats', error.stack);
      throw error;
    }
  }

  private startHourlyCalculation(): void {
    // Calculate hourly averages every minute as per requirements
    this.hourlyCalculationSubscription = interval(60000).subscribe(() => {
      this.calculateHourlyAverages().catch((error) => {
        this.logger.error('Failed to calculate hourly averages', error.stack);
      });
    });

    this.logger.log('Started hourly average calculation scheduler');
  }

  private stopHourlyCalculation(): void {
    if (this.hourlyCalculationSubscription) {
      this.hourlyCalculationSubscription.unsubscribe();
      this.logger.log('Stopped hourly average calculation scheduler');
    }
  }

  private async calculateHourlyAverages(): Promise<void> {
    try {
      // Process all supported symbols as per requirements
      const symbols = ['BINANCE:ETHUSDC', 'BINANCE:ETHUSDT', 'BINANCE:ETHBTC'];

      for (const symbol of symbols) {
        await this.calculateHourlyAverageForSymbol(symbol);
      }

      this.logger.debug(
        'Completed hourly average calculations for all symbols'
      );
    } catch (error) {
      this.logger.error('Error in hourly average calculation', error.stack);
      throw error;
    }
  }

  private async calculateHourlyAverageForSymbol(symbol: string): Promise<void> {
    const history = await this.cryptoRepository.getPriceHistory(
      symbol,
      this.config.dataRetention.priceHistoryHours
    );

    if (history.length === 0) {
      this.logger.debug(`No price history available for ${symbol}`);
      return;
    }

    // Group prices by hour
    const hourlyGroups = this.groupPricesByHour(history);

    // Calculate and save averages for each hour
    for (const [hourKey, prices] of hourlyGroups) {
      const averagePrice = this.calculateAverage(prices.map((p) => p.price));

      const hourlyAverage = HourlyAverage.createInstance(
        symbol,
        averagePrice,
        hourKey,
        prices.length
      );

      await this.cryptoRepository.saveHourlyAverage(hourlyAverage);
    }

    this.logger.debug(
      `Updated hourly averages for ${symbol}: ${hourlyGroups.size} hours`
    );
  }

  private groupPricesByHour(prices: CryptoPair[]): Map<string, CryptoPair[]> {
    const hourlyGroups = new Map<string, CryptoPair[]>();

    prices.forEach((price) => {
      const hour = new Date(price.timestamp);
      hour.setMinutes(0, 0, 0); // Round down to the hour
      const hourKey = hour.toISOString();

      if (!hourlyGroups.has(hourKey)) {
        hourlyGroups.set(hourKey, []);
      }
      hourlyGroups.get(hourKey)!.push(price);
    });

    return hourlyGroups;
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private validateHoursParameter(hours: number): void {
    if (hours <= 0 || hours > 168) {
      // Max 1 week
      throw new Error('Hours parameter must be between 1 and 168');
    }
  }
}
