export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  message?: string;
  timestamp: number;
}
