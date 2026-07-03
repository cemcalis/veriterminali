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

const REST_BASE = 'https://api.binance.com';
const WS_BASE = 'wss://stream.binance.com:9443/ws';

/** BTC/ETH/SOL trade continuously; if no trade tick arrives for this long
 * the socket is treated as a dead/zombie TCP connection and recreated. */
const STALE_CONNECTION_MS = 30000;
const WATCHDOG_INTERVAL_MS = 10000;

const INTERVAL_MAP: Record<CandleInterval, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

function toStreamSymbol(symbol: string): string {
  // accepts "BINANCE:BTCUSDT" or "BTCUSDT"
  const raw = symbol.includes(':') ? symbol.split(':')[1] : symbol;
  return raw.toLowerCase();
}

export class BinanceProvider implements MarketProvider {
  readonly id = 'binance';
  readonly name = 'Binance WebSocket';
  readonly isRealtime = true;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['crypto'];

  private ws: WebSocket | null = null;
  private listeners = new Set<QuoteListener>();
  private subscribed = new Set<string>();
  private connected = false;
  private connectPromise: Promise<void> | null = null;
  private lastMessageAt = 0;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private reconnecting = false;
  private manuallyClosed = false;

  async connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    this.manuallyClosed = false;
    this.connectPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_BASE);
      const timer = setTimeout(() => reject(new Error('Binance WS connect timeout')), 8000);

      this.ws.on('open', () => {
        clearTimeout(timer);
        this.connected = true;
        this.lastMessageAt = Date.now();
        if (this.subscribed.size > 0) {
          this.ws?.send(
            JSON.stringify({ method: 'SUBSCRIBE', params: [...this.subscribed], id: Date.now() }),
          );
        }
        this.startWatchdog();
        resolve();
      });

      this.ws.on('message', (data) => this.handleMessage(data.toString()));

      this.ws.on('error', (err) => {
        clearTimeout(timer);
        this.connected = false;
        reject(err);
      });

      this.ws.on('close', () => {
        this.connected = false;
        this.stopWatchdog();
        if (!this.manuallyClosed) this.scheduleReconnect();
      });
    });
    return this.connectPromise;
  }

  async disconnect(): Promise<void> {
    this.manuallyClosed = true;
    this.connected = false;
    this.connectPromise = null;
    this.stopWatchdog();
    this.ws?.close();
    this.ws = null;
  }

  async subscribe(symbols: string[], onQuote: QuoteListener): Promise<void> {
    this.listeners.add(onQuote);
    await this.connect();
    const streams = symbols.map((s) => `${toStreamSymbol(s)}@trade`);
    const newStreams = streams.filter((s) => !this.subscribed.has(s));
    newStreams.forEach((s) => this.subscribed.add(s));
    if (newStreams.length === 0) return;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ method: 'SUBSCRIBE', params: newStreams, id: Date.now() }));
    }
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    const streams = symbols.map((s) => `${toStreamSymbol(s)}@trade`);
    streams.forEach((s) => this.subscribed.delete(s));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ method: 'UNSUBSCRIBE', params: streams, id: Date.now() }));
    }
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    const streamSymbol = toStreamSymbol(symbol).toUpperCase();
    const res = await fetch(`${REST_BASE}/api/v3/ticker/24hr?symbol=${streamSymbol}`);
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, string>;
    return {
      symbol,
      price: Number(j.lastPrice),
      change: Number(j.priceChange),
      changePercent: Number(j.priceChangePercent),
      bid: Number(j.bidPrice),
      ask: Number(j.askPrice),
      volume: Number(j.volume),
      timestamp: Date.now(),
      provider: this.id,
      delayed: false,
      experimental: false,
    };
  }

  async getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<Candle[]> {
    const streamSymbol = toStreamSymbol(symbol).toUpperCase();
    const res = await fetch(
      `${REST_BASE}/api/v3/klines?symbol=${streamSymbol}&interval=${INTERVAL_MAP[interval]}&limit=${limit}`,
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as unknown[][];
    return rows.map((r) => ({
      time: Math.floor((r[0] as number) / 1000),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }));
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch(`${REST_BASE}/api/v3/ping`);
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: res.ok,
        latencyMs,
        message: res.ok ? 'OK' : `HTTP ${res.status}`,
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

  private startWatchdog(): void {
    this.stopWatchdog();
    this.watchdogTimer = setInterval(() => {
      const age = this.lastMessageAt ? Date.now() - this.lastMessageAt : Infinity;
      if (age > STALE_CONNECTION_MS) {
        console.warn(`[binance] no activity for ${Math.round(age / 1000)}s, reconnecting`);
        this.forceReconnect();
      }
    }, WATCHDOG_INTERVAL_MS);
  }

  private stopWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private forceReconnect(): void {
    this.connected = false;
    this.stopWatchdog();
    const staleWs = this.ws;
    this.ws = null;
    this.connectPromise = null;
    staleWs?.removeAllListeners();
    staleWs?.terminate();
    void this.connect().catch((err) => {
      console.error('[binance] reconnect failed', err);
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnecting || this.manuallyClosed) return;
    this.reconnecting = true;
    setTimeout(() => {
      this.reconnecting = false;
      if (this.manuallyClosed) return;
      this.connectPromise = null;
      void this.connect().catch((err) => {
        console.error('[binance] reconnect failed', err);
        this.scheduleReconnect();
      });
    }, 2000);
  }

  private handleMessage(raw: string): void {
    this.lastMessageAt = Date.now();
    try {
      const msg = JSON.parse(raw);
      const data = msg.data ?? msg;
      if (data?.e !== 'trade') return;
      const quote: Quote = {
        symbol: `BINANCE:${(data.s as string).toUpperCase()}`,
        price: Number(data.p),
        change: null,
        changePercent: null,
        volume: Number(data.q),
        timestamp: data.T ?? Date.now(),
        provider: this.id,
        delayed: false,
        experimental: false,
      };
      for (const listener of this.listeners) listener(quote);
    } catch {
      // ignore malformed frames
    }
  }
}
