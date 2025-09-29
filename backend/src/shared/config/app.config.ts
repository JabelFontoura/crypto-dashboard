import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  corsOrigin: string;
  finnhub: {
    apiKey: string;
    wsUrl: string;
  };
  reconnection: {
    maxAttempts: number;
    intervalMs: number;
  };
  dataRetention: {
    priceHistoryHours: number;
    hourlyAverageHours: number;
  };
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3001', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    finnhub: {
      apiKey: process.env.FINNHUB_API_KEY || '', // Can be updated via API
      wsUrl: process.env.FINNHUB_WS_URL || 'wss://ws.finnhub.io',
    },
    reconnection: {
      maxAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '5', 10),
      intervalMs: parseInt(process.env.RECONNECT_INTERVAL_MS || '5000', 10),
    },
    dataRetention: {
      priceHistoryHours: parseInt(process.env.PRICE_HISTORY_HOURS || '24', 10),
      hourlyAverageHours: parseInt(
        process.env.HOURLY_AVERAGE_HOURS || '48',
        10
      ),
    },
  })
);
