/**
 * Financial Modeling Prep (FMP) -- upgraded to the new unified "stable"
 * API (https://financialmodelingprep.com/stable/), which replaces the
 * older /api/v3/ paths. Free-tier key, no credit card. Endpoint paths
 * verified against FMP's stable docs (site.financialmodelingprep.com/
 * developer/docs/stable/*); FMP's own auth check returns HTTP 401
 * before validating the path, so exact behavior against a real quota is
 * still worth confirming once deployed with a live key.
 *
 * FMP's stable /quote endpoint is documented as covering stocks, ETFs,
 * forex pairs, crypto, and indices through the same unified path (just
 * a different `symbol` format per asset class) -- this provider stays
 * REST-only (FMP's real-time WebSocket is a paid-plan feature) and is
 * therefore always marked `delayed: true`. Do not flip this without
 * verified evidence the feed is genuinely real-time on the active plan.
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

const REST_BASE = 'https://financialmodelingprep.com/stable';

export interface FmpSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
}

export interface FmpCompanyProfile {
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  ceo?: string;
  employees?: string;
  marketCap?: number;
}

export interface FmpNewsItem {
  symbol?: string;
  title: string;
  text?: string;
  url: string;
  publishedDate: string;
  site?: string;
}

function toFmpSymbol(symbol: string): string {
  // FMP forex/commodity tickers are plain pairs (EURUSD, GCUSD); strip
  // our "EXCHANGE:" prefixes for everything else (AAPL, XU100 etc.)
  return symbol.includes(':') ? symbol.split(':')[1] : symbol;
}

export class FmpProvider implements MarketProvider {
  readonly id = 'fmp';
  readonly name = 'Financial Modeling Prep (stable API, free tier, REST-only)';
  readonly isRealtime = false;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['us_stock', 'etf', 'forex', 'commodity', 'crypto', 'index'];

  private get apiKey(): string | undefined {
    return process.env.FMP_API_KEY;
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('fmp: real-time WebSocket is a paid-plan feature; use getQuote() polling instead');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.apiKey) return null;
    const sym = toFmpSymbol(symbol);
    const res = await fetchWithTimeout(`${REST_BASE}/quote?symbol=${encodeURIComponent(sym)}&apikey=${this.apiKey}`);
    if (!res.ok) return null;
    const j = (await res.json()) as { price?: number; change?: number; changePercentage?: number; volume?: number; timestamp?: number }[];
    const q = j?.[0];
    if (!q || q.price == null) return null;
    return {
      symbol,
      price: q.price,
      change: q.change ?? null,
      changePercent: q.changePercentage ?? null,
      volume: q.volume ?? null,
      timestamp: q.timestamp ? q.timestamp * 1000 : Date.now(),
      provider: this.id,
      delayed: true,
      experimental: false,
    };
  }

  /** One HTTP call for multiple symbols -- used to reduce request count
   * against the daily quota rather than N individual getQuote() calls. */
  async batchGetQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const result = new Map<string, Quote>();
    if (!this.apiKey || symbols.length === 0) return result;
    const mapped = symbols.map((s) => ({ original: s, fmp: toFmpSymbol(s) }));
    const res = await fetchWithTimeout(
      `${REST_BASE}/batch-quote?symbols=${encodeURIComponent(mapped.map((m) => m.fmp).join(','))}&apikey=${this.apiKey}`,
    );
    if (!res.ok) return result;
    const rows = (await res.json()) as { symbol?: string; price?: number; change?: number; changePercentage?: number; volume?: number; timestamp?: number }[];
    if (!Array.isArray(rows)) return result;
    for (const row of rows) {
      if (!row.symbol || row.price == null) continue;
      const original = mapped.find((m) => m.fmp === row.symbol)?.original ?? row.symbol;
      result.set(original, {
        symbol: original,
        price: row.price,
        change: row.change ?? null,
        changePercent: row.changePercentage ?? null,
        volume: row.volume ?? null,
        timestamp: row.timestamp ? row.timestamp * 1000 : Date.now(),
        provider: this.id,
        delayed: true,
        experimental: false,
      });
    }
    return result;
  }

  /** Dynamic symbol lookup -- feeds MarketHub.searchDynamic() so users
   * can find US stocks/ETFs outside the static catalog. */
  async searchSymbol(query: string, limit = 10): Promise<FmpSearchResult[]> {
    if (!this.apiKey) return [];
    const res = await fetchWithTimeout(
      `${REST_BASE}/search-symbol?query=${encodeURIComponent(query)}&limit=${limit}&apikey=${this.apiKey}`,
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as { symbol?: string; name?: string; exchange?: string; currency?: string }[];
    if (!Array.isArray(rows)) return [];
    return rows.filter((r) => r.symbol && r.name).map((r) => ({ symbol: r.symbol!, name: r.name!, exchange: r.exchange, currency: r.currency }));
  }

  async getCompanyProfile(symbol: string): Promise<FmpCompanyProfile | null> {
    if (!this.apiKey) return null;
    const sym = toFmpSymbol(symbol);
    const res = await fetchWithTimeout(`${REST_BASE}/profile?symbol=${encodeURIComponent(sym)}&apikey=${this.apiKey}`);
    if (!res.ok) return null;
    const rows = (await res.json()) as FmpCompanyProfile[];
    return rows?.[0] ?? null;
  }

  /** Stock news for a symbol, or general market news if none given. */
  async getNews(symbol?: string, limit = 10): Promise<FmpNewsItem[]> {
    if (!this.apiKey) return [];
    const path = symbol ? `news/stock?symbols=${encodeURIComponent(toFmpSymbol(symbol))}&limit=${limit}` : `news/general?limit=${limit}`;
    const res = await fetchWithTimeout(`${REST_BASE}/${path}&apikey=${this.apiKey}`);
    if (!res.ok) return [];
    const rows = (await res.json()) as FmpNewsItem[];
    return Array.isArray(rows) ? rows : [];
  }

  async getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<Candle[]> {
    if (!this.apiKey) return [];
    const sym = toFmpSymbol(symbol);
    // Free-tier historical data is daily-only; intraday history is a
    // paid-plan feature, so anything finer than '1d' just returns [].
    if (interval !== '1d') return [];
    const res = await fetchWithTimeout(`${REST_BASE}/historical-price-eod/full?symbol=${encodeURIComponent(sym)}&apikey=${this.apiKey}`);
    if (!res.ok) return [];
    const rows = (await res.json()) as { date: string; open: number; high: number; low: number; close: number; volume: number }[];
    if (!Array.isArray(rows)) return [];
    return rows
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
      const res = await fetchWithTimeout(`${REST_BASE}/quote?symbol=AAPL&apikey=${this.apiKey}`);
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: res.ok,
        latencyMs,
        message: res.ok ? 'OK (REST-only, delayed -- FMP real-time WS is a paid-plan feature)' : `HTTP ${res.status}`,
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
