import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { ICryptoWebSocketService } from '../interfaces';
import { ConnectionState } from '../../../shared/interfaces/websocket-client.interface';
import { FinnhubMessageDto } from '../dto/external/finnhub-message.dto';
import { CryptoPair } from '../models/crypto-pair.model';
import { AppConfig } from '../../../shared/config/app.config';
import { AppLogger } from '../../../shared/utils/logger.util';
import { CRYPTO_SYMBOLS } from '../../../shared/constants/crypto.constants';

@Injectable()
export class FinnhubWebSocketService
  implements ICryptoWebSocketService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new AppLogger(FinnhubWebSocketService.name);
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private subscribedSymbols: Set<string> = new Set();
  private readonly config: AppConfig;

  // Observables for real-time data
  private messageSubject = new Subject<FinnhubMessageDto>();
  private connectionStateSubject = new BehaviorSubject<ConnectionState>({
    status: 'disconnected',
    timestamp: Date.now(),
  });

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<AppConfig>('app')!;
  }

  onModuleInit(): void {
    this.connect();
  }

  onModuleDestroy(): void {
    this.disconnect();
  }

  onPriceUpdate(): Observable<CryptoPair> {
    return this.messageSubject.pipe(
      filter((message) => message.isTradeMessage()),
      map((message) => message.getValidTrades()),
      filter((trades) => trades.length > 0),
      // Emit each trade as a separate CryptoPair
      map((trades) => {
        // For now, just emit the first trade. In production, you might want to emit all trades
        const trade = trades[0];
        return CryptoPair.createInstance(
          trade.symbol,
          trade.price,
          trade.timestamp
        );
      })
    );
  }

  onConnectionStateChange(): Observable<ConnectionState> {
    return this.connectionStateSubject.asObservable();
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.logger.warn('WebSocket already connected');
      return;
    }

    try {
      this.updateConnectionState(
        'connecting',
        'Connecting to Finnhub WebSocket...'
      );

      if (
        !this.config.finnhub.apiKey ||
        this.config.finnhub.apiKey.trim() === ''
      ) {
        const errorMessage =
          'Finnhub API key not configured. Please set your API key through the Settings UI.';
        this.logger.error(errorMessage);
        this.updateConnectionState('error', errorMessage);
        return;
      }

      const wsUrl = `${this.config.finnhub.wsUrl}?token=${this.config.finnhub.apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.setupWebSocketEventHandlers();
    } catch (error) {
      this.logger.error('Failed to connect to Finnhub WebSocket', error.stack);
      this.updateConnectionState(
        'error',
        `Connection failed: ${error.message}`
      );
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscribedSymbols.clear();
    this.updateConnectionState('disconnected', 'Manually disconnected');
  }

  subscribeToSymbols(symbols: string[]): void {
    symbols.forEach((symbol) => this.subscribe(symbol));
  }

  getConnectionState(): ConnectionState {
    return this.connectionStateSubject.value;
  }

  private subscribe(symbol: string): void {
    if (!this.isConnected()) {
      this.logger.warn(
        `Cannot subscribe to ${symbol}: WebSocket not connected`
      );
      return;
    }

    try {
      const subscribeMessage = {
        type: 'subscribe',
        symbol: symbol,
      };

      this.ws!.send(JSON.stringify(subscribeMessage));
      this.subscribedSymbols.add(symbol);
      this.logger.log(`Subscribed to ${symbol}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${symbol}`, error.stack);
    }
  }

  private unsubscribe(symbol: string): void {
    if (!this.isConnected()) {
      this.logger.warn(
        `Cannot unsubscribe from ${symbol}: WebSocket not connected`
      );
      return;
    }

    try {
      const unsubscribeMessage = {
        type: 'unsubscribe',
        symbol: symbol,
      };

      this.ws!.send(JSON.stringify(unsubscribeMessage));
      this.subscribedSymbols.delete(symbol);
      this.logger.log(`Unsubscribed from ${symbol}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from ${symbol}`, error.stack);
    }
  }

  private setupWebSocketEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on('open', () => {
      this.logger.log('Connected to Finnhub WebSocket');
      this.reconnectAttempts = 0;
      this.updateConnectionState('connected', 'Connected to Finnhub');

      // Subscribe to required symbols as per requirements
      const requiredSymbols = Object.values(CRYPTO_SYMBOLS);
      this.subscribeToSymbols(requiredSymbols);
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const rawMessage = JSON.parse(data.toString());
        const message = FinnhubMessageDto.fromJSON(rawMessage);

        // Only process valid trade messages
        if (message.isTradeMessage() && message.getValidTrades().length > 0) {
          this.messageSubject.next(message);
        }
      } catch (error) {
        this.logger.error('Error parsing WebSocket message', error.stack);
      }
    });

    this.ws.on('close', (code: number, reason: string) => {
      this.logger.warn(`WebSocket closed: ${code} - ${reason}`);
      this.updateConnectionState(
        'disconnected',
        `Connection closed: ${reason}`
      );
      this.scheduleReconnect();
    });

    this.ws.on('error', (error: Error) => {
      this.logger.error('WebSocket error', error.stack);
      this.updateConnectionState('error', `WebSocket error: ${error.message}`);
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    if (this.reconnectAttempts >= this.config.reconnection.maxAttempts) {
      this.logger.error('Max reconnection attempts reached');
      this.updateConnectionState('error', 'Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnection.intervalMs * this.reconnectAttempts;

    this.logger.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.reconnection.maxAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async updateApiKey(apiKey: string): Promise<void> {
    try {
      this.logger.log('Updating Finnhub API key and reconnecting');

      // Update the config
      this.config.finnhub.apiKey = apiKey;

      // Disconnect current connection
      this.disconnect();

      // Wait a moment before reconnecting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reconnect with new API key
      this.connect();

      this.logger.log('Successfully updated API key and reconnected');
    } catch (error) {
      this.logger.error('Failed to update API key', error.stack);
      throw error;
    }
  }

  private updateConnectionState(
    status: ConnectionState['status'],
    message?: string
  ): void {
    const state: ConnectionState = {
      status,
      message,
      timestamp: Date.now(),
    };

    this.connectionStateSubject.next(state);
  }
}
