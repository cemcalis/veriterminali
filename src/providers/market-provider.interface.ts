export type MarketCategory =
  | 'crypto'
  | 'crypto_futures'
  | 'forex'
  | 'commodity'
  | 'bist'
  | 'us_stock'
  | 'etf'
  | 'index';

/** Coarse freshness classification shown in the UI for every symbol. */
export type DataStatus = 'live' | 'near-live' | 'delayed' | 'fallback' | 'unavailable';

export interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  bid?: number | null;
  ask?: number | null;
  volume?: number | null;
  timestamp: number;
  provider: string;
  /** true if this quote is delayed or not a true real-time tick */
  delayed: boolean;
  /** true if the provider/protocol is unofficial/reverse-engineered */
  experimental: boolean;
  /** coarse freshness classification derived from provider + tick age */
  status?: DataStatus;
}

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface ProviderHealth {
  provider: string;
  healthy: boolean;
  latencyMs: number | null;
  message: string;
  checkedAt: number;
  requiresApiKey: boolean;
  apiKeyPresent: boolean;
  experimental: boolean;
}

export type QuoteListener = (quote: Quote) => void;

export interface MarketProvider {
  /** unique lowercase id, e.g. "binance", "tradingview-twc" */
  readonly id: string;
  readonly name: string;
  /** true if this provider streams true real-time data */
  readonly isRealtime: boolean;
  /** true if this provider is an unofficial/reverse-engineered source */
  readonly experimental: boolean;
  readonly categories: MarketCategory[];

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  /** subscribe to live quote updates for the given symbols (streaming providers only) */
  subscribe(symbols: string[], onQuote: QuoteListener): Promise<void>;
  unsubscribe(symbols: string[]): Promise<void>;

  /** one-shot quote fetch (REST or cached last tick) */
  getQuote(symbol: string): Promise<Quote | null>;

  getCandles(symbol: string, interval: CandleInterval, limit?: number): Promise<Candle[]>;

  healthCheck(): Promise<ProviderHealth>;
}
