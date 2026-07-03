import type {
  Candle,
  CandleInterval,
  MarketCategory,
  MarketProvider,
  ProviderHealth,
  Quote,
  QuoteListener,
} from './market-provider.interface.js';

const REST_BASE = 'https://finnhub.io/api/v1';

const RESOLUTION_MAP: Record<CandleInterval, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
};

function toFinnhubSymbol(symbol: string): string {
  // Finnhub free tier: plain US tickers (AAPL), forex as "OANDA:EUR_USD", crypto as "BINANCE:BTCUSDT"
  return symbol.includes(':') ? symbol.split(':')[1] : symbol;
}

export class FinnhubProvider implements MarketProvider {
  readonly id = 'finnhub';
  readonly name = 'Finnhub (free tier)';
  readonly isRealtime = false; // free tier is polling REST, not true push realtime
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['us_stock', 'forex', 'crypto'];

  private get apiKey(): string | undefined {
    return process.env.FINNHUB_API_KEY;
  }

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async subscribe(_symbols: string[], _onQuote: QuoteListener): Promise<void> {
    throw new Error('finnhub: free tier has no WebSocket push; use getQuote() polling instead');
  }

  async unsubscribe(_symbols: string[]): Promise<void> {}

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.apiKey) return null;
    const sym = toFinnhubSymbol(symbol);
    const res = await fetch(`${REST_BASE}/quote?symbol=${encodeURIComponent(sym)}&token=${this.apiKey}`);
    if (!res.ok) return null;
    const j = (await res.json()) as { c: number; d: number; dp: number; t: number };
    if (!j.c) return null;
    return {
      symbol,
      price: j.c,
      change: j.d,
      changePercent: j.dp,
      timestamp: j.t ? j.t * 1000 : Date.now(),
      provider: this.id,
      delayed: true,
      experimental: false,
    };
  }

  async getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<Candle[]> {
    if (!this.apiKey) return [];
    const sym = toFinnhubSymbol(symbol);
    const resolution = RESOLUTION_MAP[interval];
    const to = Math.floor(Date.now() / 1000);
    const spanSeconds = 60 * (interval === '1d' ? 86400 : Number(resolution) * 60) * limit;
    const from = to - spanSeconds;
    const res = await fetch(
      `${REST_BASE}/stock/candle?symbol=${encodeURIComponent(sym)}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`,
    );
    if (!res.ok) return [];
    const j = (await res.json()) as { s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] };
    if (j.s !== 'ok') return [];
    return j.t.map((t, i) => ({
      time: t,
      open: j.o[i],
      high: j.h[i],
      low: j.l[i],
      close: j.c[i],
      volume: j.v[i],
    }));
  }

  async healthCheck(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: 'FINNHUB_API_KEY not set in .env (free tier key required, no cost)',
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: false,
        experimental: false,
      };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${REST_BASE}/quote?symbol=AAPL&token=${this.apiKey}`);
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
