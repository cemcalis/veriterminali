export type MarketCategory = 'crypto' | 'forex' | 'commodity' | 'bist' | 'us_stock' | 'etf' | 'index';

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
  delayed: boolean;
  experimental: boolean;
  status?: DataStatus;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface SymbolDef {
  symbol: string;
  binanceSymbol?: string;
  yahooSymbol?: string;
  category: MarketCategory;
  displayName: string;
  displayNameTr: string;
}

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

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  createdAt: number;
  currentPrice: number | null;
  marketValue: number | null;
  costBasis: number;
  pnl: number | null;
  pnlPercent: number | null;
}

export interface Alert {
  id: string;
  symbol: string;
  direction: 'above' | 'below';
  targetPrice: number;
  createdAt: number;
  triggeredAt: number | null;
}
