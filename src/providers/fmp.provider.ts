/**
 * Financial Modeling Prep (FMP) free-tier REST provider. Free API key,
 * no credit card, ~250 requests/day as of this writing. Covers stocks,
 * ETFs, forex, crypto, and commodities via one generic /quote endpoint.
 * FMP's real-time WebSocket is a paid-plan feature -- this provider is
 * REST-only, used as an additional fallback rung, not a streaming source.
 */
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

const REST_BASE = 'https://financialmodelingprep.com/api/v3';

function toFmpSymbol(symbol: string): string {
  // FMP forex/commodity tickers are plain pairs (EURUSD, GCUSD); strip
  // our "EXCHANGE:" prefixes for everything else (AAPL, XU100 etc.)
  return symbol.includes(':') ? symbol.split(':')[1] : symbol;
}

export class FmpProvider implements MarketProvider {
  readonly id = 'fmp';
  readonly name = 'Financial Modeling Prep (free tier, REST-only)';
  readonly isRealtime = false;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['us_stock', 'etf', 'forex', 'commodity', 'crypto', 'index'];

  private get apiKey(): string | undefined {
    return process.env.FMP_API_KEY;
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('fmp: free tier has no WebSocket access; use getQuote() polling instead');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.apiKey) return null;
    const sym = toFmpSymbol(symbol);
    const res = await fetchWithTimeout(`${REST_BASE}/quote/${encodeURIComponent(sym)}?apikey=${this.apiKey}`);
    if (!res.ok) return null;
    const j = (await res.json()) as { price?: number; change?: number; changesPercentage?: number; volume?: number; timestamp?: number }[];
    const q = j?.[0];
    if (!q || q.price == null) return null;
    return {
      symbol,
      price: q.price,
      change: q.change ?? null,
      changePercent: q.changesPercentage ?? null,
      volume: q.volume ?? null,
      timestamp: q.timestamp ? q.timestamp * 1000 : Date.now(),
      provider: this.id,
      delayed: true,
      experimental: false,
    };
  }

  async getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<Candle[]> {
    if (!this.apiKey) return [];
    const sym = toFmpSymbol(symbol);
    // FMP's free historical endpoint is daily-only; intraday history is
    // a paid-plan feature, so anything finer than '1d' just returns [].
    if (interval !== '1d') return [];
    const res = await fetchWithTimeout(`${REST_BASE}/historical-price-full/${encodeURIComponent(sym)}?apikey=${this.apiKey}`);
    if (!res.ok) return [];
    const j = (await res.json()) as {
      historical?: { date: string; open: number; high: number; low: number; close: number; volume: number }[];
    };
    if (!j.historical) return [];
    return j.historical
      .slice(0, limit)
      .map((d) => ({
        time: Math.floor(new Date(d.date).getTime() / 1000),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume ?? 0,
      }))
      .sort((a, b) => a.time - b.time);
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: 'FMP_API_KEY not set in .env (free tier key required, no cost)',
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: false,
        experimental: false,
      };
    }
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${REST_BASE}/quote/AAPL?apikey=${this.apiKey}`);
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
