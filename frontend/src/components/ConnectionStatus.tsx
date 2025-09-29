import React from 'react';
import { ConnectionState } from '../types/crypto.types';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  isConnected: boolean;
  onReconnect: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionState,
  isConnected,
  onReconnect,
}) => {
  const getStatusColor = () => {
    switch (connectionState.status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'disconnected':
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState.status) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'disconnected':
        return '⚫';
      case 'error':
        return '🔴';
      default:
        return '⚫';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-800 dark:text-white">
                Connection Status:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}
              >
                {connectionState.status.toUpperCase()}
              </span>
            </div>
            {connectionState.message && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {connectionState.message}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Last update:{' '}
              {new Date(connectionState.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              WebSocket:
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                isConnected
                  ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
                  : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
              }`}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {(!isConnected || connectionState.status === 'error') && (
            <button
              onClick={onReconnect}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors text-sm font-medium"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
