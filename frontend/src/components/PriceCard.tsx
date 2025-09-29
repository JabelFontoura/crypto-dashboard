import React from 'react';
import { CryptoPair, SYMBOL_DISPLAY_NAMES } from '../types/crypto.types';

interface PriceCardProps {
  cryptoPair: CryptoPair;
  hourlyAverage?: number;
}

export const PriceCard: React.FC<PriceCardProps> = ({
  cryptoPair,
  hourlyAverage,
}) => {
  const displayName =
    SYMBOL_DISPLAY_NAMES[
      cryptoPair.symbol as keyof typeof SYMBOL_DISPLAY_NAMES
    ] || cryptoPair.symbol;
  const lastUpdate = new Date(cryptoPair.timestamp).toLocaleTimeString();

  // Calculate percentage change if we have hourly average
  const percentageChange = hourlyAverage
    ? ((cryptoPair.price - hourlyAverage) / hourlyAverage) * 100
    : null;

  const formatPrice = (price: number) => {
    if (cryptoPair.symbol.includes('BTC')) {
      return price.toFixed(6); // More decimals for BTC pairs
    }
    return price.toFixed(2);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {displayName}
        </h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {cryptoPair.symbol}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${formatPrice(cryptoPair.price)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current Price
          </div>
        </div>

        {hourlyAverage && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ${formatPrice(hourlyAverage)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                1h Average
              </div>
            </div>

            {percentageChange !== null && (
              <div
                className={`text-sm font-medium ${
                  percentageChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {percentageChange >= 0 ? '+' : ''}
                {percentageChange.toFixed(2)}%
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last update: {lastUpdate}
          </div>
        </div>
      </div>
    </div>
  );
};
