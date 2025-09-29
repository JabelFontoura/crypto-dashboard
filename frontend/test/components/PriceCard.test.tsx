import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PriceCard } from '../../src/components/PriceCard';

describe('PriceCard', () => {
  const mockProps = {
    symbol: 'BINANCE:ETHUSDT',
    currentPrice: 2500.5,
    hourlyAverage: 2495.25,
    isConnected: true,
  };

  it('should render price card with correct data', () => {
    render(<PriceCard {...mockProps} />);

    expect(screen.getByText('ETH → USDT')).toBeInTheDocument();
    expect(screen.getByText('$2,500.50')).toBeInTheDocument();
    expect(screen.getByText('$2,495.25')).toBeInTheDocument();
  });

  it('should show positive change indicator when current price is higher', () => {
    render(<PriceCard {...mockProps} />);

    const changeElement = screen.getByText('+0.21%');
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass('text-green-600');
  });

  it('should show negative change indicator when current price is lower', () => {
    const propsWithLowerPrice = {
      ...mockProps,
      currentPrice: 2400.0,
    };

    render(<PriceCard {...propsWithLowerPrice} />);

    const changeElement = screen.getByText('-3.82%');
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass('text-red-600');
  });

  it('should show no change when prices are equal', () => {
    const propsWithEqualPrice = {
      ...mockProps,
      currentPrice: 2495.25,
    };

    render(<PriceCard {...propsWithEqualPrice} />);

    const changeElement = screen.getByText('0.00%');
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass('text-gray-500');
  });

  it('should show disconnected state when not connected', () => {
    const disconnectedProps = {
      ...mockProps,
      isConnected: false,
    };

    render(<PriceCard {...disconnectedProps} />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should show loading state when no current price', () => {
    const loadingProps = {
      ...mockProps,
      currentPrice: undefined,
    };

    render(<PriceCard {...loadingProps} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show N/A for hourly average when not available', () => {
    const noAverageProps = {
      ...mockProps,
      hourlyAverage: undefined,
    };

    render(<PriceCard {...noAverageProps} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should format large numbers correctly', () => {
    const largeNumberProps = {
      ...mockProps,
      currentPrice: 1234567.89,
      hourlyAverage: 1234000.0,
    };

    render(<PriceCard {...largeNumberProps} />);

    expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
    expect(screen.getByText('$1,234,000.00')).toBeInTheDocument();
  });

  it('should handle unknown symbol gracefully', () => {
    const unknownSymbolProps = {
      ...mockProps,
      symbol: 'UNKNOWN:SYMBOL',
    };

    render(<PriceCard {...unknownSymbolProps} />);

    expect(screen.getByText('UNKNOWN:SYMBOL')).toBeInTheDocument();
  });
});
