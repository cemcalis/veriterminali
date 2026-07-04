import { fetchWithTimeout } from './fetch-with-timeout.js';
import type {
  Candle,
  CandleInterval,
  MarketCategory,
  MarketProvider,
  ProviderHealth,
  Quote,
  QuoteListener,
} from './market-provider.interface.js';

const REST_BASE = 'https://api.twelvedata.com';

const INTERVAL_MAP: Record<CandleInterval, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '1h',
  '4h': '4h',
  '1d': '1day',
};

function toTwelveDataSymbol(symbol: string): string {
  // TwelveData uses plain tickers/pairs, e.g. AAPL, EUR/USD, BTC/USD
  const raw = symbol.includes(':') ? symbol.split(':')[1] : symbol;
  if (/^[A-Z]{6}$/.test(raw)) return `${raw.slice(0, 3)}/${raw.slice(3)}`;
  return raw;
}

export class TwelveDataProvider implements MarketProvider {
  readonly id = 'twelvedata';
  readonly name = 'Twelve Data (free tier)';
  readonly isRealtime = false;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['us_stock', 'forex', 'commodity', 'crypto', 'index', 'etf'];

  private get apiKey(): string | undefined {
    return process.env.TWELVEDATA_API_KEY;
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('twelvedata: free tier has no WebSocket push; use getQuote() polling instead');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.apiKey) return null;
    const sym = toTwelveDataSymbol(symbol);
    const res = await fetchWithTimeout(
      `${REST_BASE}/quote?symbol=${encodeURIComponent(sym)}&apikey=${this.apiKey}`,
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      close?: string;
      change?: string;
      percent_change?: string;
      volume?: string;
      status?: string;
    };
    if (j.status === 'error' || !j.close) return null;
    return {
      symbol,
      price: Number(j.close),
      change: j.change ? Number(j.change) : null,
      changePercent: j.percent_change ? Number(j.percent_change) : null,
      volume: j.volume ? Number(j.volume) : null,
      timestamp: Date.now(),
      provider: this.id,
      delayed: true,
      experimental: false,
    };
  }

  async getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<Candle[]> {
    if (!this.apiKey) return [];
    const sym = toTwelveDataSymbol(symbol);
    const res = await fetchWithTimeout(
      `${REST_BASE}/time_series?symbol=${encodeURIComponent(sym)}&interval=${INTERVAL_MAP[interval]}&outputsize=${limit}&apikey=${this.apiKey}`,
    );
    if (!res.ok) return [];
    const j = (await res.json()) as {
      status?: string;
      values?: { datetime: string; open: string; high: string; low: string; close: string; volume?: string }[];
    };
    if (j.status === 'error' || !j.values) return [];
    return j.values
      .map((v) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: Number(v.open),
        high: Number(v.high),
        low: Number(v.low),
        close: Number(v.close),
        volume: v.volume ? Number(v.volume) : 0,
      }))
      .sort((a, b) => a.time - b.time);
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: 'TWELVEDATA_API_KEY not set in .env (free tier key required, no cost)',
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: false,
        experimental: false,
      };
    }
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${REST_BASE}/quote?symbol=AAPL&apikey=${this.apiKey}`);
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: res.ok,
        latencyMs,
        message: res.ok ? 'OK' : `HTTP ${res.status}`,
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: true,
        experimental: false,
      };
    } catch (err) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: err instanceof Error ? err.message : 'unknown error',
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: true,
        experimental: false,
      };
    }
  }
}
