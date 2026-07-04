/**
 * BiQuote (biquote.io) -- public, unauthenticated REST + SignalR feed
 * backed by a generic MT5 broker connection (352/359 catalog symbols)
 * plus a small MATRIKS-sourced BIST subset (6 symbols only: GARAN,
 * THYAO, SISE, AKBNK, EREGL, XU100).
 *
 * Investigated in depth (public docs at /llms.txt, public /health,
 * /api/symbols, /api/active, all unauthenticated -- no cookies, tokens,
 * or login involved anywhere). Findings that shape this implementation:
 *  - No company name or ToS was ever found, only a support@ email --
 *    real but thin legal transparency. Combined with the BIST symbols
 *    being sourced from a paid Matriks IQ feed with no visible
 *    sublicense, this stays OFF by default (BIQUOTE_ENABLED=false) and
 *    is never registered as a BIST provider at all -- bigpara/isyatirim
 *    already cover BIST, and BiQuote's 6 fixed symbols add nothing our
 *    catalog of ~200 BIST names needs.
 *  - No endpoint anywhere supports order-book depth, AKD, Takas, or
 *    theoretical price -- last tick + OHLC bars only.
 *  - Genuinely useful category is forex, where its 215-symbol MT5 feed
 *    is broader than our other free sources; kept experimental/last-
 *    resort given the transparency gaps above.
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

function restBase(): string {
  return process.env.BIQUOTE_REST_URL ?? 'https://biquote.io';
}

function bareSymbol(symbol: string): string {
  return symbol.includes(':') ? symbol.split(':')[1] : symbol;
}

interface BiQuoteTick {
  bid?: number;
  ask?: number;
  last?: number;
  dayDiffPercent?: number;
  timestamp?: string;
}

export class BiQuoteProvider implements MarketProvider {
  readonly id = 'biquote';
  readonly name = 'BiQuote (experimental, public unofficial MT5 feed, forex only, disabled by default)';
  readonly isRealtime = false;
  readonly experimental = true;
  // Deliberately excludes 'bist': see file header -- BiQuote's 6 fixed,
  // Matriks-sourced BIST symbols are never wired up as a provider here.
  readonly categories: MarketCategory[] = ['forex'];

  private get enabled(): boolean {
    return process.env.BIQUOTE_ENABLED === 'true';
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    // WS (SignalR, biquote.io/hubs/tick) is documented but intentionally
    // not wired up -- this provider is REST-only and last-resort, not
    // worth a persistent connection given the ToS/transparency gaps.
    throw new Error('biquote: REST-only in this integration, no streaming subscribe');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.enabled) return null;
    const sym = bareSymbol(symbol);
    if (!/^[A-Z]{6}$/.test(sym)) return null;
    const res = await fetchWithTimeout(`${restBase()}/api/${encodeURIComponent(sym)}`);
    if (!res.ok) return null;
    const j = (await res.json()) as BiQuoteTick & { message?: string };
    if (j.message || j.last == null) return null;
    return {
      symbol,
      price: j.last,
      change: null,
      changePercent: j.dayDiffPercent ?? null,
      bid: j.bid ?? null,
      ask: j.ask ?? null,
      timestamp: j.timestamp ? new Date(j.timestamp).getTime() : Date.now(),
      provider: this.id,
      delayed: false,
      experimental: true,
    };
  }

  async getCandles(_symbol: string, _interval: CandleInterval): Promise<Candle[]> {
    // /api/{symbol}/ohlc exists per docs but this provider is a last-
    // resort quote fallback only; other providers already cover candles
    // for forex (yahoo, tradingview-twc).
    return [];
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.enabled) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: 'BIQUOTE_ENABLED=false (default) -- disabled pending clearer BIST/ToS transparency, see file header',
        checkedAt: Date.now(),
        requiresApiKey: false,
        apiKeyPresent: true,
        experimental: true,
      };
    }
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(`${restBase()}/health`);
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: res.ok,
        latencyMs,
        message: res.ok ? 'OK (experimental, public unofficial MT5 feed)' : `HTTP ${res.status}`,
        checkedAt: Date.now(),
        requiresApiKey: false,
        apiKeyPresent: true,
        experimental: true,
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
        experimental: true,
      };
    }
  }
}
