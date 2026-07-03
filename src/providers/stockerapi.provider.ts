/**
 * Adapter for StockerAPI/turkey-stock-market-api. IMPORTANT: this
 * GitHub repo contains no actual open-source client code or free tier
 * -- it is a documentation/marketing shell for the commercial "Kun
 * Data" product (kun.pro), which requires a paid bearer token for both
 * HTTP and WebSocket access. This provider is wired up so it activates
 * automatically if the user supplies STOCKERAPI_TOKEN and
 * STOCKERAPI_BASE_URL in .env, but ships DISABLED by default since
 * there is no free/open data behind it.
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

export class StockerApiProvider implements MarketProvider {
  readonly id = 'stockerapi';
  readonly name = 'StockerAPI / Kun Data (BIST, paid)';
  readonly isRealtime = true;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['bist'];

  private get token(): string | undefined {
    return process.env.STOCKERAPI_TOKEN;
  }
  private get baseUrl(): string {
    return process.env.STOCKERAPI_BASE_URL ?? 'https://api.kun.pro';
  }

  async connect(): Promise<void> {
    // REST-only; no persistent connection needed.
  }

  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('stockerapi: streaming not available without a paid token/subscription');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.token) return null;
    const res = await fetch(`${this.baseUrl}/v1/snapshot?symbol=${encodeURIComponent(symbol)}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { price?: number; change?: number; changePercent?: number };
    return {
      symbol,
      price: j.price ?? null,
      change: j.change ?? null,
      changePercent: j.changePercent ?? null,
      timestamp: Date.now(),
      provider: this.id,
      delayed: false,
      experimental: false,
    };
  }

  async getCandles(_symbol: string, _interval: CandleInterval): Promise<Candle[]> {
    if (!this.token) return [];
    return [];
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      provider: this.id,
      healthy: false,
      latencyMs: null,
      message: this.token
        ? 'token present but endpoint untested (no free tier to validate against)'
        : 'NO FREE TIER: repo is a marketing shell for the paid Kun Data API (kun.pro). Requires STOCKERAPI_TOKEN.',
      checkedAt: Date.now(),
      requiresApiKey: true,
      apiKeyPresent: Boolean(this.token),
      experimental: false,
    };
  }
}
