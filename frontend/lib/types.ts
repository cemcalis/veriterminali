export type MarketCategory =
  | 'crypto'
  | 'crypto_futures'
  | 'forex'
  | 'commodity'
  | 'bist'
  | 'us_stock'
  | 'etf'
  | 'index';

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

export interface Trade {
  id: string;
  symbol: string;
  side: 'sell';
  quantity: number;
  costBasis: number;
  proceeds: number;
  realizedPnl: number;
  closedAt: number;
}

export interface EquitySnapshot {
  date: string;
  totalValue: number;
}

export interface Alert {
  id: string;
  symbol: string;
  direction: 'above' | 'below';
  targetPrice: number;
  createdAt: number;
  triggeredAt: number | null;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
}

export interface ScannerRow {
  symbol: string;
  category: MarketCategory;
  displayNameTr: string;
  quote: Quote;
  rsi14: number | null;
}

export interface ScannerFilters {
  category?: MarketCategory;
  minChangePercent?: number;
  maxChangePercent?: number;
  minVolume?: number;
  rsi?: 'oversold' | 'overbought';
  sort?: 'changePercent' | 'volume' | 'price';
  direction?: 'asc' | 'desc';
  limit?: number;
}

export interface ScannerPreset {
  id: string;
  name: string;
  filters: Record<string, string | number>;
  createdAt: number;
}

export type DisclosureCategory =
  | 'temettu'
  | 'sermaye_artirimi'
  | 'birlesme_devralma'
  | 'genel_kurul'
  | 'finansal_rapor'
  | 'spk_karari'
  | 'diger';

export interface NewsItem {
  publishDate: string;
  disclosureIndex: string;
  title: string;
  url: string;
  category: DisclosureCategory;
}

export type InstitutionalResult<T> =
  | { available: true; data: T; asOf: number; source: string }
  | { available: false; reason: 'licensed_data_required'; message: string; vendorOptions: string[] };
