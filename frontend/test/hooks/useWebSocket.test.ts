import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { io } from 'socket.io-client';

jest.mock('socket.io-client');

const mockIo = io as jest.MockedFunction<typeof io>;

describe('useWebSocket', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn(),
      connected: false,
    };

    mockIo.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.currentPrices).toEqual({});
    expect(result.current.hourlyAverages).toEqual({});
    expect(result.current.priceHistory).toEqual({});
    expect(result.current.connectionState).toEqual({
      status: 'disconnected',
      timestamp: expect.any(Number),
    });
    expect(result.current.isConnected).toBe(false);
  });

  it('should connect to WebSocket on mount', () => {
    renderHook(() => useWebSocket());

    expect(mockIo).toHaveBeenCalledWith('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
    });
  });

  it('should set up event listeners', () => {
    renderHook(() => useWebSocket());

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      'price-update',
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      'hourly-averages',
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      'price-history',
      expect.any(Function)
    );
    expect(mockSocket.on).toHaveBeenCalledWith(
      'connection-state',
      expect.any(Function)
    );
  });

  it('should handle connect event', () => {
    const { result } = renderHook(() => useWebSocket());

    const connectHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'connect'
    )[1];

    act(() => {
      connectHandler();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState.status).toBe('connected');
  });

  it('should handle disconnect event', () => {
    const { result } = renderHook(() => useWebSocket());

    const disconnectHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'disconnect'
    )[1];

    act(() => {
      disconnectHandler();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState.status).toBe('disconnected');
  });

  it('should handle price update event', () => {
    const { result } = renderHook(() => useWebSocket());

    const priceUpdateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price-update'
    )[1];

    const mockPriceUpdate = {
      symbol: 'BINANCE:ETHUSDT',
      price: 2500.5,
      timestamp: Date.now(),
    };

    act(() => {
      priceUpdateHandler(mockPriceUpdate);
    });

    expect(result.current.currentPrices['BINANCE:ETHUSDT']).toEqual(
      mockPriceUpdate
    );
  });

  it('should handle hourly averages event', () => {
    const { result } = renderHook(() => useWebSocket());

    const hourlyAveragesHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'hourly-averages'
    )[1];

    const mockHourlyAverages = {
      'BINANCE:ETHUSDT': [
        {
          symbol: 'BINANCE:ETHUSDT',
          averagePrice: 2500.5,
          hour: '2025-09-29T17',
          count: 100,
        },
      ],
    };

    act(() => {
      hourlyAveragesHandler(mockHourlyAverages);
    });

    expect(result.current.hourlyAverages).toEqual(mockHourlyAverages);
  });

  it('should handle price history event', () => {
    const { result } = renderHook(() => useWebSocket());

    const priceHistoryHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'price-history'
    )[1];

    const mockPriceHistory = {
      'BINANCE:ETHUSDT': [
        {
          symbol: 'BINANCE:ETHUSDT',
          price: 2500.5,
          timestamp: Date.now() - 3600000,
        },
        {
          symbol: 'BINANCE:ETHUSDT',
          price: 2510.75,
          timestamp: Date.now(),
        },
      ],
    };

    act(() => {
      priceHistoryHandler(mockPriceHistory);
    });

    expect(result.current.priceHistory).toEqual(mockPriceHistory);
  });

  it('should handle connection state event', () => {
    const { result } = renderHook(() => useWebSocket());

    const connectionStateHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'connection-state'
    )[1];

    const mockConnectionState = {
      status: 'error' as const,
      message: 'API key not configured',
      timestamp: Date.now(),
    };

    act(() => {
      connectionStateHandler(mockConnectionState);
    });

    expect(result.current.connectionState).toEqual(mockConnectionState);
  });

  it('should provide reconnect function', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.reconnect();
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(mockSocket.connect).toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('connect');
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
    expect(mockSocket.off).toHaveBeenCalledWith('price-update');
    expect(mockSocket.off).toHaveBeenCalledWith('hourly-averages');
    expect(mockSocket.off).toHaveBeenCalledWith('price-history');
    expect(mockSocket.off).toHaveBeenCalledWith('connection-state');
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
