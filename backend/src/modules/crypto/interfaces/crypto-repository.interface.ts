import { CryptoPair, HourlyAverage } from '../models';

export interface ICryptoRepository {
  savePriceUpdate(cryptoPair: CryptoPair): Promise<void>;
  getCurrentPrice(symbol: string): Promise<CryptoPair | null>;
  getAllCurrentPrices(): Promise<CryptoPair[]>;
  getPriceHistory(symbol: string, hours: number): Promise<CryptoPair[]>;
  saveHourlyAverage(average: HourlyAverage): Promise<void>;
  getHourlyAverages(symbol: string, hours: number): Promise<HourlyAverage[]>;
  getAllHourlyAverages(hours: number): Promise<Record<string, HourlyAverage[]>>;
  getDataStats(): Promise<{
    totalPricePoints: number;
    totalHourlyAverages: number;
    symbols: string[];
  }>;
}
