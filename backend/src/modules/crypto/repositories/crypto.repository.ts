import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ICryptoRepository } from '../interfaces/crypto-repository.interface';
import { CryptoPair } from '../models/crypto-pair.model';
import { HourlyAverage } from '../models/hourly-average.model';
import { AppLogger } from '../../../shared/utils/logger.util';

@Injectable()
export class CryptoRepository implements ICryptoRepository {
  private readonly logger = new AppLogger(CryptoRepository.name);

  constructor(
    @InjectModel(CryptoPair)
    private readonly cryptoPairModel: typeof CryptoPair,
    @InjectModel(HourlyAverage)
    private readonly hourlyAverageModel: typeof HourlyAverage
  ) {}

  async savePriceUpdate(cryptoPair: CryptoPair): Promise<void> {
    try {
      await this.cryptoPairModel.create({
        symbol: cryptoPair.symbol,
        price: cryptoPair.price,
        timestamp: cryptoPair.timestamp,
      });

      this.logger.debug(
        `💾 Saved price update: ${cryptoPair.symbol} = $${cryptoPair.price}`
      );
    } catch (error) {
      this.logger.error('Failed to save price update', error);
      throw error;
    }
  }

  async getCurrentPrice(symbol: string): Promise<CryptoPair | null> {
    try {
      const record = await this.cryptoPairModel.findOne({
        where: { symbol },
        order: [['timestamp', 'DESC']],
      });

      return record;
    } catch (error) {
      this.logger.error(`Failed to get current price for ${symbol}`, error);
      throw error;
    }
  }

  async getAllCurrentPrices(): Promise<CryptoPair[]> {
    try {
      // Get the latest price for each symbol
      const records = await this.cryptoPairModel.findAll({
        attributes: ['symbol', 'price', 'timestamp'],
        where: {
          timestamp: {
            [Op.in]: await this.cryptoPairModel
              .findAll({
                attributes: [
                  'symbol',
                  [
                    this.cryptoPairModel.sequelize!.fn(
                      'MAX',
                      this.cryptoPairModel.sequelize!.col('timestamp')
                    ),
                    'maxTimestamp',
                  ],
                ],
                group: ['symbol'],
                raw: true,
              })
              .then((results) => results.map((r: any) => r.maxTimestamp)),
          },
        },
        order: [['timestamp', 'DESC']],
      });

      return records;
    } catch (error) {
      this.logger.error('Failed to get all current prices', error);
      throw error;
    }
  }

  async getPriceHistory(symbol: string, hours: number): Promise<CryptoPair[]> {
    try {
      const hoursAgo = Date.now() - hours * 60 * 60 * 1000;

      const records = await this.cryptoPairModel.findAll({
        where: {
          symbol,
          timestamp: {
            [Op.gte]: hoursAgo,
          },
        },
        order: [['timestamp', 'ASC']],
        limit: 1000, // Limit to prevent excessive data
      });

      return records;
    } catch (error) {
      this.logger.error(`Failed to get price history for ${symbol}`, error);
      throw error;
    }
  }

  async saveHourlyAverage(hourlyAverage: HourlyAverage): Promise<void> {
    try {
      await this.hourlyAverageModel.upsert({
        symbol: hourlyAverage.symbol,
        averagePrice: hourlyAverage.averagePrice,
        hour: hourlyAverage.hour,
        count: hourlyAverage.count,
      });

      this.logger.debug(
        `💾 Saved hourly average: ${hourlyAverage.symbol} @ ${hourlyAverage.hour} = $${hourlyAverage.averagePrice}`
      );
    } catch (error) {
      this.logger.error('Failed to save hourly average', error);
      throw error;
    }
  }

  async getHourlyAverages(
    symbol: string,
    hours: number
  ): Promise<HourlyAverage[]> {
    try {
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
      const hourString = hoursAgo.toISOString().slice(0, 13); // YYYY-MM-DDTHH format

      const records = await this.hourlyAverageModel.findAll({
        where: {
          symbol,
          hour: {
            [Op.gte]: hourString,
          },
        },
        order: [['hour', 'ASC']],
      });

      return records;
    } catch (error) {
      this.logger.error(`Failed to get hourly averages for ${symbol}`, error);
      throw error;
    }
  }

  async getAllHourlyAverages(
    hours: number
  ): Promise<Record<string, HourlyAverage[]>> {
    try {
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
      const hourString = hoursAgo.toISOString().slice(0, 13); // YYYY-MM-DDTHH format

      const records = await this.hourlyAverageModel.findAll({
        where: {
          hour: {
            [Op.gte]: hourString,
          },
        },
        order: [
          ['symbol', 'ASC'],
          ['hour', 'ASC'],
        ],
      });

      // Group by symbol
      const result: Record<string, HourlyAverage[]> = {};
      records.forEach((record) => {
        if (!result[record.symbol]) {
          result[record.symbol] = [];
        }
        result[record.symbol].push(record);
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get all hourly averages', error);
      throw error;
    }
  }

  async getDataStats(): Promise<{
    totalPricePoints: number;
    totalHourlyAverages: number;
    symbols: string[];
  }> {
    try {
      const [priceCount, hourlyCount] = await Promise.all([
        this.cryptoPairModel.count(),
        this.hourlyAverageModel.count(),
      ]);

      const symbols = await this.cryptoPairModel.findAll({
        attributes: ['symbol'],
        group: ['symbol'],
        raw: true,
      });

      return {
        totalPricePoints: priceCount,
        totalHourlyAverages: hourlyCount,
        symbols: symbols.map((s: any) => s.symbol),
      };
    } catch (error) {
      this.logger.error('Failed to get repository stats', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Keep only last 24 hours of price data
      const deletedPrices = await this.cryptoPairModel.destroy({
        where: {
          timestamp: {
            [Op.lt]: oneDayAgo,
          },
        },
      });

      // Keep only last week of hourly averages
      const oneWeekAgoHour = new Date(oneWeekAgo).toISOString().slice(0, 13);
      const deletedAverages = await this.hourlyAverageModel.destroy({
        where: {
          hour: {
            [Op.lt]: oneWeekAgoHour,
          },
        },
      });

      this.logger.log(
        `🧹 Cleanup completed: removed ${deletedPrices} price records and ${deletedAverages} hourly averages`
      );
    } catch (error) {
      this.logger.error('Failed to cleanup old data', error);
      throw error;
    }
  }
}
