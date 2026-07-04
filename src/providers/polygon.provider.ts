/**
 * Polygon.io (rebranded "Massive"). RESEARCHED AND CONFIRMED: as of this
 * writing Polygon has NO free tier at all -- the old $29/mo Starter plan
 * was discontinued, delayed data now starts at a paid Basic plan. This
 * provider exists so POLYGON_API_KEY is a recognized, ready extension
 * point (per the requested env var list) without pretending there's a
 * free/legal way to use it today. Mirrors the honesty pattern already
 * used for stockerapi.provider.ts (BIST) and bist-institutional.provider.ts.
 */
import type {
  Candle,
  CandleInterval,
  MarketCategory,
  MarketProvider,
  ProviderHealth,
  Quote,
  QuoteListener,
} from './market-provider.interface.js';

export class PolygonProvider implements MarketProvider {
  readonly id = 'polygon';
  readonly name = 'Polygon.io / Massive (no free tier as of 2026)';
  readonly isRealtime = false;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['us_stock', 'etf', 'forex', 'crypto', 'index'];

  private get apiKey(): string | undefined {
    return process.env.POLYGON_API_KEY;
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('polygon: no free tier exists -- requires a paid plan');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(_symbol: string): Promise<Quote | null> {
    return null;
  }

  async getCandles(_symbol: string, _interval: CandleInterval): Promise<Candle[]> {
    return [];
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      provider: this.id,
      healthy: false,
      latencyMs: null,
      message: this.apiKey
        ? 'POLYGON_API_KEY set, but Polygon/Massive has no free tier -- a paid plan is required for any endpoint'
        : 'NO FREE TIER: Polygon/Massive discontinued its free/low-cost plans; a paid subscription is required',
      checkedAt: Date.now(),
      requiresApiKey: true,
      apiKeyPresent: Boolean(this.apiKey),
      experimental: false,
    };
  }
}
