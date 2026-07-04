/**
 * Alpha Vantage free-tier REST provider. Genuinely free (no credit
 * card), but severely rate-limited as of this writing: 25 requests/day,
 * 5/minute, REST only. That quota is exhausted by a handful of lookups,
 * so this is wired in as the last-resort rung of the fallback chain --
 * useful for an occasional cold symbol, not a primary source. Documented
 * honestly rather than oversold.
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

const REST_BASE = 'https://www.alphavantage.co/query';

function toAlphaVantageSymbol(symbol: string): string {
  return symbol.includes(':') ? symbol.split(':')[1] : symbol;
}

export class AlphaVantageProvider implements MarketProvider {
  readonly id = 'alphavantage';
  readonly name = 'Alpha Vantage (free tier, 25 req/day -- last resort)';
  readonly isRealtime = false;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['us_stock', 'etf', 'forex', 'commodity'];

  private get apiKey(): string | undefined {
    return process.env.ALPHAVANTAGE_API_KEY;
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('alphavantage: no WebSocket support, REST-only and heavily rate-limited');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.apiKey) return null;
    const sym = toAlphaVantageSymbol(symbol);
    const res = await fetchWithTimeout(
      `${REST_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(sym)}&apikey=${this.apiKey}`,
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      'Global Quote'?: { '05. price'?: string; '09. change'?: string; '10. change percent'?: string; '06. volume'?: string };
      Note?: string;
      Information?: string;
    };
    // Alpha Vantage returns HTTP 200 even when the daily quota is
    // exhausted -- it just replaces the payload with a "Note"/"Information"
    // string instead of "Global Quote". Treat that as no data, not a crash.
    const q = j['Global Quote'];
    if (!q?.['05. price']) return null;
    return {
      symbol,
      price: Number(q['05. price']),
      change: q['09. change'] ? Number(q['09. change']) : null,
      changePercent: q['10. change percent'] ? parseFloat(q['10. change percent']) : null,
      volume: q['06. volume'] ? Number(q['06. volume']) : null,
      timestamp: Date.now(),
      provider: this.id,
      delayed: true,
      experimental: false,
    };
  }

  async getCandles(_symbol: string, _interval: CandleInterval): Promise<Candle[]> {
    // Not worth spending the 25/day quota on candle history when Yahoo
    // already covers this for free without a meaningful request budget.
    return [];
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: 'ALPHAVANTAGE_API_KEY not set (free, but capped at 25 requests/day -- last-resort fallback only)',
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: false,
        experimental: false,
      };
    }
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${REST_BASE}?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${this.apiKey}`);
      const latencyMs = Date.now() - start;
      const j = (await res.json()) as { Note?: string; Information?: string };
      const quotaExhausted = Boolean(j.Note || j.Information);
      return {
        provider: this.id,
        healthy: res.ok && !quotaExhausted,
        latencyMs,
        message: quotaExhausted ? 'daily quota (25 req/day) likely exhausted' : res.ok ? 'OK' : `HTTP ${res.status}`,
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
