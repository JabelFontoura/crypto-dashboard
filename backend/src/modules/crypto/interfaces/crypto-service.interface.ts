import { Observable } from 'rxjs';
import { CryptoPair, HourlyAverage } from '../models';
import { ConnectionState } from '../../../shared/interfaces/websocket-client.interface';

export interface ICryptoService {
  // Data management
  addPriceUpdate(cryptoPair: CryptoPair): Promise<void>;
  getCurrentPrice(symbol: string): Promise<CryptoPair | null>;
  getAllCurrentPrices(): Promise<CryptoPair[]>;
  getPriceHistory(symbol: string, hours: number): Promise<CryptoPair[]>;
  getHourlyAverages(symbol: string, hours: number): Promise<HourlyAverage[]>;
  getAllHourlyAverages(hours: number): Promise<Record<string, HourlyAverage[]>>;
  getStats(): Promise<any>;
}

export interface ICryptoWebSocketService {
  // WebSocket management
  connect(): void;
  disconnect(): void;
  subscribeToSymbols(symbols: string[]): void;
  getConnectionState(): ConnectionState;
  updateApiKey(apiKey: string): Promise<void>;

  // Observables
  onPriceUpdate(): Observable<CryptoPair>;
  onConnectionStateChange(): Observable<ConnectionState>;
}
