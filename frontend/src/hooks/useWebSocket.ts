import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import {
  CryptoPair,
  HourlyAverage,
  ConnectionState,
} from '../types/crypto.types';

// Define Socket type to avoid import issues
type SocketType = ReturnType<typeof io>;

interface WebSocketData {
  currentPrices: CryptoPair[];
  hourlyAverages: Record<string, HourlyAverage[]>;
  priceHistory: Record<string, CryptoPair[]>;
  connectionState: ConnectionState;
  isConnected: boolean;
}

export const useWebSocket = (serverUrl: string = 'http://localhost:3001') => {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [data, setData] = useState<WebSocketData>({
    currentPrices: [],
    hourlyAverages: {},
    priceHistory: {},
    connectionState: { status: 'disconnected', timestamp: Date.now() },
    isConnected: false,
  });

  const connect = useCallback(() => {
    if (socket?.connected) return;

    console.log('🔌 Connecting to WebSocket server...');
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setData((prev) => ({ ...prev, isConnected: true }));
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setData((prev) => ({ ...prev, isConnected: false }));
    });

    newSocket.on('currentPrices', (prices: CryptoPair[]) => {
      console.log('📊 Received current prices:', prices);
      setData((prev) => ({ ...prev, currentPrices: prices }));
    });

    newSocket.on('priceUpdate', (update: CryptoPair) => {
      console.log('💰 Price update:', update);
      setData((prev) => ({
        ...prev,
        currentPrices: prev.currentPrices
          .map((price) => (price.symbol === update.symbol ? update : price))
          .concat(
            prev.currentPrices.find((p) => p.symbol === update.symbol)
              ? []
              : [update]
          ),
      }));
    });

    newSocket.on(
      'hourlyAverages',
      (averages: Record<string, HourlyAverage[]>) => {
        console.log('📈 Received hourly averages:', averages);
        setData((prev) => ({ ...prev, hourlyAverages: averages }));
      }
    );

    newSocket.on('priceHistory', (history: Record<string, CryptoPair[]>) => {
      console.log('📊 Received price history:', history);
      setData((prev) => ({ ...prev, priceHistory: history }));
    });

    newSocket.on('connectionState', (state: ConnectionState) => {
      console.log('🔗 Connection state update:', state);
      setData((prev) => ({ ...prev, connectionState: state }));
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ WebSocket connection error:', error);
      setData((prev) => ({
        ...prev,
        isConnected: false,
        connectionState: {
          status: 'error',
          message: `Connection error: ${error.message}`,
          timestamp: Date.now(),
        },
      }));
    });

    setSocket(newSocket);
  }, [serverUrl, socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      console.log('🔌 Disconnecting from WebSocket server...');
      socket.disconnect();
      setSocket(null);
      setData((prev) => ({ ...prev, isConnected: false }));
    }
  }, [socket]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    ...data,
    connect,
    disconnect,
    reconnect: () => {
      disconnect();
      setTimeout(connect, 1000);
    },
  };
};
