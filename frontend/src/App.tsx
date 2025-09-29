import React from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useApiKey } from './hooks/useApiKey';
import { ConnectionStatus } from './components/ConnectionStatus';
import { PriceCard } from './components/PriceCard';
import { PriceChart } from './components/PriceChart';
import { Settings } from './components/Settings';
import { ApiKeySetup } from './components/ApiKeySetup';
import { ThemeToggle } from './components/ThemeToggle';
import { CRYPTO_SYMBOLS, SYMBOL_DISPLAY_NAMES } from './types/crypto.types';
import './App.css';

function App() {
  const {
    currentPrices,
    hourlyAverages,
    priceHistory,
    connectionState,
    isConnected,
    reconnect,
  } = useWebSocket();

  const { updateApiKey, isUpdating } = useApiKey();

  const needsApiKeySetup =
    connectionState.status === 'error' &&
    connectionState.message?.includes('API key not configured');

  const getLatestHourlyAverage = (symbol: string): number | undefined => {
    const averages = hourlyAverages[symbol];
    if (!averages || averages.length === 0) return undefined;

    const sorted = [...averages].sort(
      (a, b) => new Date(b.hour).getTime() - new Date(a.hour).getTime()
    );
    return sorted[0]?.averagePrice;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <ThemeToggle />
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                🚀 Crypto Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time cryptocurrency exchange rates with live charts
              </p>
            </div>
            <Settings onApiKeyUpdate={updateApiKey} isUpdating={isUpdating} />
          </div>
        </div>

        {/* API Key Setup or Connection Status */}
        {needsApiKeySetup ? (
          <div className="mb-8">
            <ApiKeySetup
              onApiKeyUpdate={updateApiKey}
              isUpdating={isUpdating}
            />
          </div>
        ) : (
          <ConnectionStatus
            connectionState={connectionState}
            isConnected={isConnected}
            onReconnect={reconnect}
          />
        )}

        {/* Current Prices */}
        {!needsApiKeySetup && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Current Prices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.values(CRYPTO_SYMBOLS).map((symbol) => {
                const currentPrice = currentPrices.find(
                  (p) => p.symbol === symbol
                );
                const hourlyAverage = getLatestHourlyAverage(symbol);

                return currentPrice ? (
                  <PriceCard
                    key={symbol}
                    cryptoPair={currentPrice}
                    hourlyAverage={hourlyAverage}
                  />
                ) : (
                  <div
                    key={symbol}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      {
                        SYMBOL_DISPLAY_NAMES[
                          symbol as keyof typeof SYMBOL_DISPLAY_NAMES
                        ]
                      }
                    </h3>
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-2">⏳</div>
                      <div>Waiting for data...</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!needsApiKeySetup && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Price Charts
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.values(CRYPTO_SYMBOLS).map((symbol) => (
                <PriceChart
                  key={symbol}
                  symbol={symbol}
                  priceHistory={priceHistory[symbol] || []}
                />
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>
            Data provided by{' '}
            <a
              href="https://finnhub.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Finnhub
            </a>
          </p>
          <p className="mt-1">
            Built with NestJS, React, TypeScript, and Docker
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
