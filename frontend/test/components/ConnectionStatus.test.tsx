import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConnectionStatus } from '../../src/components/ConnectionStatus';

describe('ConnectionStatus', () => {
  const mockReconnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show connected status', () => {
    const connectionState = {
      status: 'connected' as const,
      timestamp: Date.now(),
    };

    render(
      <ConnectionStatus
        connectionState={connectionState}
        isConnected={true}
        onReconnect={mockReconnect}
      />
    );

    expect(screen.getByText('🟢')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Real-time data streaming')).toBeInTheDocument();
  });

  it('should show connecting status', () => {
    const connectionState = {
      status: 'connecting' as const,
      timestamp: Date.now(),
    };

    render(
      <ConnectionStatus
        connectionState={connectionState}
        isConnected={false}
        onReconnect={mockReconnect}
      />
    );

    expect(screen.getByText('🟡')).toBeInTheDocument();
    expect(screen.getByText('Connecting')).toBeInTheDocument();
    expect(screen.getByText('Establishing connection...')).toBeInTheDocument();
  });

  it('should show disconnected status with reconnect button', () => {
    const connectionState = {
      status: 'disconnected' as const,
      timestamp: Date.now(),
    };

    render(
      <ConnectionStatus
        connectionState={connectionState}
        isConnected={false}
        onReconnect={mockReconnect}
      />
    );

    expect(screen.getByText('🔴')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('No real-time data')).toBeInTheDocument();
    expect(screen.getByText('Reconnect')).toBeInTheDocument();
  });

  it('should show error status with error message', () => {
    const connectionState = {
      status: 'error' as const,
      message: 'API key not configured',
      timestamp: Date.now(),
    };

    render(
      <ConnectionStatus
        connectionState={connectionState}
        isConnected={false}
        onReconnect={mockReconnect}
      />
    );

    expect(screen.getByText('🔴')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('API key not configured')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should call onReconnect when reconnect button is clicked', () => {
    const connectionState = {
      status: 'disconnected' as const,
      timestamp: Date.now(),
    };

    render(
      <ConnectionStatus
        connectionState={connectionState}
        isConnected={false}
        onReconnect={mockReconnect}
      />
    );

    const reconnectButton = screen.getByText('Reconnect');
    fireEvent.click(reconnectButton);

    expect(mockReconnect).toHaveBeenCalledTimes(1);
  });

  it('should call onReconnect when retry button is clicked', () => {
    const connectionState = {
      status: 'error' as const,
      message: 'Connection failed',
      timestamp: Date.now(),
    };

    render(
      <ConnectionStatus
        connectionState={connectionState}
        isConnected={false}
        onReconnect={mockReconnect}
      />
    );

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockReconnect).toHaveBeenCalledTimes(1);
  });

  it('should not show reconnect button when connected', () => {
    const connectionState = {
      status: 'connected' as const,
      timestamp: Date.now(),
    };

    render(
      <ConnectionStatus
        connectionState={connectionState}
        isConnected={true}
        onReconnect={mockReconnect}
      />
    );

    expect(screen.queryByText('Reconnect')).not.toBeInTheDocument();
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('should show timestamp information', () => {
    const timestamp = Date.now();
    const connectionState = {
      status: 'connected' as const,
      timestamp,
    };

    render(
      <ConnectionStatus
        connectionState={connectionState}
        isConnected={true}
        onReconnect={mockReconnect}
      />
    );

    const expectedTime = new Date(timestamp).toLocaleTimeString();
    expect(
      screen.getByText(`Last update: ${expectedTime}`)
    ).toBeInTheDocument();
  });
});
