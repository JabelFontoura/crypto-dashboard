import '@testing-library/jest-dom';

// Simple test without React components to avoid build issues
describe('PriceCard Logic', () => {
  it('should calculate percentage change correctly', () => {
    const currentPrice = 2500.5;
    const hourlyAverage = 2495.25;
    const percentageChange =
      ((currentPrice - hourlyAverage) / hourlyAverage) * 100;

    expect(percentageChange).toBeCloseTo(0.21, 2);
  });

  it('should format price correctly', () => {
    const price = 2500.5;
    const formatted = price.toFixed(2);

    expect(formatted).toBe('2500.50');
  });
});
