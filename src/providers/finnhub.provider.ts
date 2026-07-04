import WebSocket from 'ws';
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
const WS_BASE = 'wss://ws.finnhub.io';

/** Finnhub's free-tier WS is a shared trade-tick feed capped at ~50
 * symbols total per connection -- real, free, no credit card, but not
 * unlimited like Binance's public stream. See
 * https://finnhub.io/docs/api/websocket-trades. */
const MAX_WS_SYMBOLS = 45;

interface FinnhubTradeMessage {
  type: 'trade' | 'ping';
  data?: { s: string; p: number; t: number; v: number }[];
}

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
  readonly name = 'Finnhub (free tier, real-time trade WS)';
  readonly isRealtime = true;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['us_stock', 'forex', 'crypto', 'etf'];

  private ws: WebSocket | null = null;
  private wsConnectPromise: Promise<void> | null = null;
  private listeners = new Set<QuoteListener>();
  private wsSubscribed = new Set<string>();
  private lastPrice = new Map<string, { price: number; ts: number }>();

  private get apiKey(): string | undefined {
    return process.env.FINNHUB_API_KEY;
  }

  async connect(): Promise<void> {
    if (this.wsConnectPromise) return this.wsConnectPromise;
    if (!this.apiKey) throw new Error('FINNHUB_API_KEY not set');

    this.wsConnectPromise = new Promise((resolve, reject) => {
      const socket = new WebSocket(`${WS_BASE}?token=${this.apiKey}`);
      const failTimer = setTimeout(() => reject(new Error('Finnhub WS connect timeout')), 10000);

      socket.on('open', () => {
        clearTimeout(failTimer);
        this.ws = socket;
        for (const symbol of this.wsSubscribed) {
          socket.send(JSON.stringify({ type: 'subscribe', symbol: toFinnhubSymbol(symbol) }));
        }
        resolve();
      });

      socket.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as FinnhubTradeMessage;
          if (msg.type !== 'trade' || !msg.data) return;
          for (const trade of msg.data) {
            this.lastPrice.set(trade.s, { price: trade.p, ts: trade.t });
            const quote: Quote = {
              symbol: trade.s,
              price: trade.p,
              change: null,
              changePercent: null,
              volume: trade.v ?? null,
              timestamp: trade.t,
              provider: this.id,
              delayed: false,
              experimental: false,
            };
            for (const listener of this.listeners) listener(quote);
          }
        } catch {
          // ignore malformed frames
        }
      });

      socket.on('error', (err) => {
        clearTimeout(failTimer);
        reject(err);
      });

      socket.on('close', () => {
        if (this.ws === socket) this.ws = null;
        this.wsConnectPromise = null;
      });
    });
    return this.wsConnectPromise;
  }

  async disconnect(): Promise<void> {
    this.ws?.close();
    this.ws = null;
    this.wsConnectPromise = null;
  }

  /** Subscribes up to MAX_WS_SYMBOLS symbols to Finnhub's free real-time
   * trade WebSocket. Silently caps the list rather than exceeding the
   * free-tier connection limit -- callers should pass their most
   * important symbols first. */
  async subscribe(symbols: string[], onQuote: QuoteListener): Promise<void> {
    this.listeners.add(onQuote);
    await this.connect();
    const room = MAX_WS_SYMBOLS - this.wsSubscribed.size;
    const toAdd = symbols.filter((s) => !this.wsSubscribed.has(s)).slice(0, Math.max(0, room));
    for (const symbol of toAdd) {
      this.wsSubscribed.add(symbol);
      this.ws?.send(JSON.stringify({ type: 'subscribe', symbol: toFinnhubSymbol(symbol) }));
    }
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    for (const symbol of symbols) {
      if (!this.wsSubscribed.delete(symbol)) continue;
      this.ws?.send(JSON.stringify({ type: 'unsubscribe', symbol: toFinnhubSymbol(symbol) }));
    }
  }

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
