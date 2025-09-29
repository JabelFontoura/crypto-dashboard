export const CRYPTO_SYMBOLS = {
  ETH_USDC: 'BINANCE:ETHUSDC',
  ETH_USDT: 'BINANCE:ETHUSDT',
  ETH_BTC: 'BINANCE:ETHBTC',
} as const;

export const WEBSOCKET_EVENTS = {
  PRICE_UPDATE: 'priceUpdate',
  CURRENT_PRICES: 'currentPrices',
  HOURLY_AVERAGES: 'hourlyAverages',
  PRICE_HISTORY: 'priceHistory',
  CONNECTION_STATE: 'connectionState',
} as const;
