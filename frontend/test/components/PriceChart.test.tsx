import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PriceChart } from '../../src/components/PriceChart';
import { CryptoPair } from '../../src/types/crypto.types';

jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Dot: () => <div data-testid="dot" />,
}));

describe('PriceChart', () => {
  const mockPriceHistory: CryptoPair[] = [
    {
      symbol: 'BINANCE:ETHUSDT',
      price: 2500.5,
      timestamp: Date.now() - 3600000,
    },
    {
      symbol: 'BINANCE:ETHUSDT',
      price: 2510.75,
      timestamp: Date.now() - 1800000,
    },
    {
      symbol: 'BINANCE:ETHUSDT',
      price: 2520.25,
      timestamp: Date.now(),
    },
  ];

  it('should render chart with correct title', () => {
    render(
      <PriceChart symbol="BINANCE:ETHUSDT" priceHistory={mockPriceHistory} />
    );

    expect(screen.getByText('ETH → USDT')).toBeInTheDocument();
    expect(screen.getByText('Real-time Price Chart')).toBeInTheDocument();
  });

  it('should render chart components', () => {
    render(
      <PriceChart symbol="BINANCE:ETHUSDT" priceHistory={mockPriceHistory} />
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('should show no data message when price history is empty', () => {
    render(<PriceChart symbol="BINANCE:ETHUSDT" priceHistory={[]} />);

    expect(screen.getByText('No price data available')).toBeInTheDocument();
    expect(
      screen.getByText('Waiting for real-time data...')
    ).toBeInTheDocument();
  });

  it('should handle unknown symbol gracefully', () => {
    render(
      <PriceChart symbol="UNKNOWN:SYMBOL" priceHistory={mockPriceHistory} />
    );

    expect(screen.getByText('UNKNOWN:SYMBOL')).toBeInTheDocument();
  });

  it('should show current price when data is available', () => {
    render(
      <PriceChart symbol="BINANCE:ETHUSDT" priceHistory={mockPriceHistory} />
    );

    expect(screen.getByText('Current: $2,520.25')).toBeInTheDocument();
  });

  it('should handle single data point', () => {
    const singleDataPoint = [mockPriceHistory[0]];

    render(
      <PriceChart symbol="BINANCE:ETHUSDT" priceHistory={singleDataPoint} />
    );

    expect(screen.getByText('Current: $2,500.50')).toBeInTheDocument();
  });

  it('should limit data points for performance', () => {
    const manyDataPoints = Array.from({ length: 100 }, (_, i) => ({
      symbol: 'BINANCE:ETHUSDT',
      price: 2500 + i,
      timestamp: Date.now() - (100 - i) * 60000,
    }));

    render(
      <PriceChart symbol="BINANCE:ETHUSDT" priceHistory={manyDataPoints} />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
