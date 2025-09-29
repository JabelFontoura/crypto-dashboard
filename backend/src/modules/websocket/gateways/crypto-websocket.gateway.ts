import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import {
  ICryptoService,
  ICryptoWebSocketService,
} from '../../crypto/interfaces';
import { AppLogger } from '../../../shared/utils/logger.util';
import { AppConfig } from '../../../shared/config/app.config';
import {
  WEBSOCKET_EVENTS,
  CRYPTO_SYMBOLS,
} from '../../../shared/constants/crypto.constants';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class CryptoWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new AppLogger(CryptoWebSocketGateway.name);
  private priceSubscription?: Subscription;
  private connectionSubscription?: Subscription;
  private hourlyAverageTimer?: NodeJS.Timeout;
  private priceHistoryTimer?: NodeJS.Timeout;
  private readonly config: AppConfig;

  constructor(
    @Inject('ICryptoService') private readonly cryptoService: ICryptoService,
    @Inject('ICryptoWebSocketService')
    private readonly webSocketService: ICryptoWebSocketService,
    private readonly configService: ConfigService
  ) {
    this.config = this.configService.get<AppConfig>('app')!;
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.setupSubscriptions();
    this.startHourlyAverageBroadcast();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send current data to newly connected client
    this.sendCurrentDataToClient(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  onModuleDestroy() {
    this.cleanup();
  }

  private setupSubscriptions(): void {
    // Subscribe to price updates from Finnhub WebSocket
    this.priceSubscription = this.webSocketService
      .onPriceUpdate()
      .subscribe(async (cryptoPair) => {
        try {
          // Store the price update using the service
          await this.cryptoService.addPriceUpdate(cryptoPair);

          // Broadcast to all connected clients
          this.server.emit(WEBSOCKET_EVENTS.PRICE_UPDATE, cryptoPair.toJSON());

          this.logger.debug(
            `Broadcasted price update for ${cryptoPair.symbol}: $${cryptoPair.price}`
          );

          // Broadcast updated price history every 10 seconds to keep charts real-time
          if (!this.priceHistoryTimer) {
            this.priceHistoryTimer = setInterval(() => {
              this.broadcastPriceHistory();
            }, 10000); // 10 seconds
          }
        } catch (error) {
          this.logger.error('Failed to process price update', error.stack);
        }
      });

    // Subscribe to connection state changes
    this.connectionSubscription = this.webSocketService
      .onConnectionStateChange()
      .subscribe((connectionState) => {
        this.server.emit(WEBSOCKET_EVENTS.CONNECTION_STATE, connectionState);
        this.logger.debug(
          `Broadcasted connection state: ${connectionState.status}`
        );
      });

    this.logger.log('WebSocket subscriptions established');
  }

  private startHourlyAverageBroadcast(): void {
    // Send hourly averages every minute as per requirements
    this.hourlyAverageTimer = setInterval(async () => {
      try {
        const hourlyAverages = await this.cryptoService.getAllHourlyAverages(
          24
        );
        const transformedData: Record<string, any[]> = {};

        for (const [symbol, averages] of Object.entries(hourlyAverages)) {
          transformedData[symbol] = averages.map((avg) => avg.toJSON());
        }

        this.server.emit(WEBSOCKET_EVENTS.HOURLY_AVERAGES, transformedData);
        this.logger.debug('Broadcasted hourly averages to all clients');
      } catch (error) {
        this.logger.error('Failed to broadcast hourly averages', error.stack);
      }
    }, 60000); // 1 minute

    this.logger.log('Started hourly average broadcast scheduler');
  }

  private async broadcastPriceHistory(): Promise<void> {
    try {
      const symbols = Object.values(CRYPTO_SYMBOLS);
      const priceHistoryData: Record<string, any[]> = {};

      for (const symbol of symbols) {
        const history = await this.cryptoService.getPriceHistory(symbol, 1); // Last 1 hour of real-time data
        priceHistoryData[symbol] = history.map((price) => price.toJSON());
      }

      this.server.emit(WEBSOCKET_EVENTS.PRICE_HISTORY, priceHistoryData);
      this.logger.debug('Broadcasted price history to all clients');
    } catch (error) {
      this.logger.error('Failed to broadcast price history', error.stack);
    }
  }

  private async sendCurrentDataToClient(client: Socket): Promise<void> {
    try {
      // Send current prices
      const currentPrices = await this.cryptoService.getAllCurrentPrices();
      client.emit(
        WEBSOCKET_EVENTS.CURRENT_PRICES,
        currentPrices.map((price) => price.toJSON())
      );

      // Send connection state
      const connectionState = this.webSocketService.getConnectionState();
      client.emit(WEBSOCKET_EVENTS.CONNECTION_STATE, connectionState);

      // Send hourly averages
      const hourlyAverages = await this.cryptoService.getAllHourlyAverages(24);
      const transformedData: Record<string, any[]> = {};

      for (const [symbol, averages] of Object.entries(hourlyAverages)) {
        transformedData[symbol] = averages.map((avg) => avg.toJSON());
      }

      client.emit(WEBSOCKET_EVENTS.HOURLY_AVERAGES, transformedData);

      // Send price history for real-time charts
      const symbols = Object.values(CRYPTO_SYMBOLS);
      const priceHistoryData: Record<string, any[]> = {};

      for (const symbol of symbols) {
        const history = await this.cryptoService.getPriceHistory(symbol, 1); // Last 1 hour
        priceHistoryData[symbol] = history.map((price) => price.toJSON());
      }

      client.emit(WEBSOCKET_EVENTS.PRICE_HISTORY, priceHistoryData);

      this.logger.log(`Sent current data to client ${client.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send current data to client ${client.id}`,
        error.stack
      );
    }
  }

  private cleanup(): void {
    if (this.priceSubscription) {
      this.priceSubscription.unsubscribe();
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    if (this.hourlyAverageTimer) {
      clearInterval(this.hourlyAverageTimer);
    }
    if (this.priceHistoryTimer) {
      clearInterval(this.priceHistoryTimer);
    }
    this.logger.log('WebSocket Gateway cleanup completed');
  }
}
