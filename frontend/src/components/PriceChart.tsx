import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import { CryptoPair, SYMBOL_DISPLAY_NAMES } from '../types/crypto.types';

interface PriceChartProps {
  symbol: string;
  priceHistory: CryptoPair[];
}

export const PriceChart: React.FC<PriceChartProps> = ({
  symbol,
  priceHistory,
}) => {
  const [lastDataTimestamp, setLastDataTimestamp] = useState<number>(0);
  const displayName =
    SYMBOL_DISPLAY_NAMES[symbol as keyof typeof SYMBOL_DISPLAY_NAMES] || symbol;

  const chartData = priceHistory
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-50)
    .map((price, index, array) => ({
      time: new Date(price.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      price: price.price,
      fullTime: new Date(price.timestamp).toLocaleString(),
      timestamp: price.timestamp,
      isLast: index === array.length - 1,
    }));

  useEffect(() => {
    if (chartData.length > 0) {
      const latestTimestamp = chartData[chartData.length - 1].timestamp;
      if (latestTimestamp > lastDataTimestamp) {
        setLastDataTimestamp(latestTimestamp);
      }
    }
  }, [chartData, lastDataTimestamp]);

  const prices = chartData.map((d) => d.price);
  let yAxisDomain: [number, number] | undefined;

  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    const minPadding = symbol.includes('BTC')
      ? maxPrice * 0.0001
      : maxPrice * 0.001;
    const padding =
      priceRange > 0 ? Math.max(priceRange * 0.1, minPadding) : minPadding;

    yAxisDomain = [Math.max(0, minPrice - padding), maxPrice + padding];
  }

  const formatPrice = (price: number) => {
    if (symbol.includes('BTC')) {
      return price.toFixed(6);
    }
    return price.toFixed(2);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {data.fullTime}
          </p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            ${formatPrice(data.price)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time price
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;

    if (!payload?.isLast) {
      return (
        <Dot
          cx={cx}
          cy={cy}
          r={3}
          fill="#3b82f6"
          strokeWidth={2}
          stroke="#3b82f6"
        />
      );
    }

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r="8"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          opacity="0.6"
        >
          <animate
            attributeName="r"
            values="3;12;3"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="1;0;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx={cx}
          cy={cy}
          r="4"
          fill="#ffffff"
          stroke="#3b82f6"
          strokeWidth="3"
        >
          <animate
            attributeName="r"
            values="4;6;4"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {displayName}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div>No data available yet</div>
            <div className="text-sm">Waiting for real-time data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {displayName}
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Real-time ({chartData.length} points)
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              stroke="#666"
              fontSize={12}
              tick={{ fill: '#666' }}
            />
            <YAxis
              stroke="#666"
              fontSize={12}
              tick={{ fill: '#666' }}
              tickFormatter={formatPrice}
              domain={yAxisDomain || ['auto', 'auto']}
              type="number"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{
                r: 6,
                stroke: '#3b82f6',
                strokeWidth: 2,
                fill: '#ffffff',
              }}
              connectNulls={false}
              animationDuration={0}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
