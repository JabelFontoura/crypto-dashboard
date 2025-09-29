export interface CryptoPair {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface HourlyAverage {
  symbol: string;
  averagePrice: number;
  hour: string;
  count: number;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  message?: string;
  timestamp: number;
}

export const CRYPTO_SYMBOLS = {
  ETH_USDC: 'BINANCE:ETHUSDC',
  ETH_USDT: 'BINANCE:ETHUSDT', 
  ETH_BTC: 'BINANCE:ETHBTC'
} as const;

export const SYMBOL_DISPLAY_NAMES = {
  'BINANCE:ETHUSDC': 'ETH → USDC',
  'BINANCE:ETHUSDT': 'ETH → USDT',
  'BINANCE:ETHBTC': 'ETH → BTC'
} as const;

export type CryptoSymbol = typeof CRYPTO_SYMBOLS[keyof typeof CRYPTO_SYMBOLS];
