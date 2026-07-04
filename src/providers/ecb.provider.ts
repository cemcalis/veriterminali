/**
 * European Central Bank reference rates, via frankfurter.dev (a free,
 * no-key, open-source JSON wrapper around the ECB's own public
 * eurofxref-daily feed -- https://www.ecb.europa.eu/stats/eurofxref).
 * Genuinely free, official, zero setup. The tradeoff: ECB publishes
 * once per working day (~16:00 CET), so this is authoritative but never
 * real-time -- used as a daily-reference fallback for EUR-based forex
 * pairs, not a primary source.
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

const REST_BASE = 'https://api.frankfurter.dev/v1';

/** Parses a 6-letter forex pair like "EURUSD" into { base: "EUR", quote: "USD" }. */
function parsePair(symbol: string): { base: string; quote: string } | null {
  const raw = symbol.includes(':') ? symbol.split(':')[1] : symbol;
  if (!/^[A-Z]{6}$/.test(raw)) return null;
  return { base: raw.slice(0, 3), quote: raw.slice(3) };
}

export class EcbProvider implements MarketProvider {
  readonly id = 'ecb';
  readonly name = 'ECB reference rates (via frankfurter.dev, free, daily)';
  readonly isRealtime = false;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['forex'];

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('ecb: daily reference rates only, no streaming');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    const pair = parsePair(symbol);
    if (!pair) return null;
    const res = await fetchWithTimeout(`${REST_BASE}/latest?base=${pair.base}&symbols=${pair.quote}`);
    if (!res.ok) return null;
    const j = (await res.json()) as { rates?: Record<string, number>; date?: string };
    const rate = j.rates?.[pair.quote];
    if (rate == null) return null;
    return {
      symbol,
      price: rate,
      change: null,
      changePercent: null,
      timestamp: j.date ? new Date(j.date).getTime() : Date.now(),
      provider: this.id,
      delayed: true,
      experimental: false,
    };
  }

  async getCandles(_symbol: string, _interval: CandleInterval): Promise<Candle[]> {
    // Frankfurter has a historical range endpoint but it's daily-only and
    // Yahoo already covers this ground for candles; not worth duplicating.
    return [];
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${REST_BASE}/latest?base=EUR&symbols=USD`);
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: res.ok,
        latencyMs,
        message: res.ok ? 'OK (official ECB daily reference, not real-time)' : `HTTP ${res.status}`,
        checkedAt: Date.now(),
        requiresApiKey: false,
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
        requiresApiKey: false,
        apiKeyPresent: true,
        experimental: false,
      };
    }
  }
}
