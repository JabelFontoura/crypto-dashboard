// Raw data structure from Finnhub API (keeping original field names for API compatibility)
interface FinnhubRawTradeData {
  s: string; // symbol
  p: number; // price
  t: number; // timestamp
  v: number; // volume
}

// Clean interface with descriptive property names
export interface FinnhubTradeData {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
}

/**
 * DTO for handling Finnhub WebSocket messages
 * Transforms raw API data into clean, typed interfaces
 */
export class FinnhubMessageDto {
  constructor(
    public readonly type: string,
    public readonly data: FinnhubTradeData[]
  ) {
    this.validateType(type);
    this.validateData(data);
  }

  private validateType(type: string): void {
    if (!type || typeof type !== 'string') {
      throw new Error('Message type must be a non-empty string');
    }
  }

  private validateData(data: FinnhubTradeData[]): void {
    if (!Array.isArray(data)) {
      throw new Error('Message data must be an array');
    }
  }

  public isTradeMessage(): boolean {
    return this.type === 'trade';
  }

  public getValidTrades(): FinnhubTradeData[] {
    if (!this.isTradeMessage()) {
      return [];
    }

    return this.data.filter(
      (trade) =>
        trade &&
        typeof trade.symbol === 'string' &&
        typeof trade.price === 'number' &&
        typeof trade.timestamp === 'number' &&
        trade.price > 0 &&
        trade.timestamp > 0
    );
  }

  /**
   * Factory method to create DTO from raw Finnhub API response
   * Maps cryptic API field names to descriptive property names
   */
  public static fromJSON(data: any): FinnhubMessageDto {
    // Map raw API data to clean interface
    const mappedData = (data.data || []).map(
      (rawTrade: FinnhubRawTradeData): FinnhubTradeData => ({
        symbol: rawTrade.s,
        price: rawTrade.p,
        timestamp: rawTrade.t,
        volume: rawTrade.v,
      })
    );

    return new FinnhubMessageDto(data.type, mappedData);
  }
}
