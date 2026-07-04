/**
 * TwelveData -- upgraded for the active "Basic 8" plan: 800 API
 * credits/day, an 8 requests/minute average AND max (i.e. never burst
 * above 8/min even though the daily budget would allow more), and
 * exactly 1 WebSocket connection with 8 WS symbol credits.
 *
 * Every REST call goes through a dual rate limiter (rolling 60s window
 * capped at 8, rolling 24h window capped at 800) before hitting the
 * network -- if either is exhausted, getQuote/getCandles return null
 * immediately (same "skip, let the fallback chain move on" contract as
 * providerHealth's circuit breaker) rather than queuing/blocking, since
 * this sits in a live quote fallback chain that must never stall on a
 * single provider. A short quote cache (CACHE_TTL_MS) absorbs repeated
 * frontend polling of the same symbol without spending a fresh credit
 * every time.
 *
 * The WebSocket (wss://ws.twelvedata.com/v1/quotes/price) is capped at
 * MAX_WS_SYMBOLS=8 to match the plan's WS credit limit, using the same
 * ref-counted slot-manager pattern FinnhubSlotManager already
 * established in market-hub.ts for its ~45-symbol cap -- see
 * TwelveDataSlotManager below. NOTE: the WS protocol here (subscribe/
 * unsubscribe actions, mandatory client heartbeat every ~10s) is
 * implemented from TwelveData's published docs but has not been
 * exercised against a live key in this environment (no API key was
 * available locally when this was written) -- verify once deployed.
 */
import WebSocket from 'ws';
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

const REST_BASE = 'https://api.twelvedata.com';
const WS_URL = 'wss://ws.twelvedata.com/v1/quotes/price';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 8;
const MAX_REQUESTS_PER_DAY = 800;
const CACHE_TTL_MS = 20_000;
const HEARTBEAT_INTERVAL_MS = 10_000;

/** Basic 8 plan: 8 WS symbol credits, one connection. Same ref-counted
 * "dynamic interest wins a slot, static fill backfills the rest" shape
 * as FinnhubSlotManager (market-hub.ts), sized down for this budget. */
export const MAX_WS_SYMBOLS = 8;

const INTERVAL_MAP: Record<CandleInterval, string> = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '1h',
  '4h': '4h',
  '1d': '1day',
};

function toTwelveDataSymbol(symbol: string): string {
  // TwelveData uses plain tickers/pairs, e.g. AAPL, EUR/USD, BTC/USD
  const raw = symbol.includes(':') ? symbol.split(':')[1] : symbol;
  if (/^[A-Z]{6}$/.test(raw)) return `${raw.slice(0, 3)}/${raw.slice(3)}`;
  return raw;
}

class RateLimiter {
  private minuteWindow: number[] = [];
  private dayWindow: number[] = [];

  /** True if a request is allowed right now; does NOT consume budget. */
  canRequest(): boolean {
    const now = Date.now();
    this.minuteWindow = this.minuteWindow.filter((t) => now - t < MINUTE_MS);
    this.dayWindow = this.dayWindow.filter((t) => now - t < DAY_MS);
    return this.minuteWindow.length < MAX_REQUESTS_PER_MINUTE && this.dayWindow.length < MAX_REQUESTS_PER_DAY;
  }

  record(): void {
    const now = Date.now();
    this.minuteWindow.push(now);
    this.dayWindow.push(now);
  }

  snapshot(): { usedThisMinute: number; usedToday: number } {
    const now = Date.now();
    this.minuteWindow = this.minuteWindow.filter((t) => now - t < MINUTE_MS);
    this.dayWindow = this.dayWindow.filter((t) => now - t < DAY_MS);
    return { usedThisMinute: this.minuteWindow.length, usedToday: this.dayWindow.length };
  }
}

interface CacheEntry {
  quote: Quote;
  cachedAt: number;
}

export class TwelveDataProvider implements MarketProvider {
  readonly id = 'twelvedata';
  readonly name = 'Twelve Data (Basic 8: 800 credits/day, 8/min, 1 WS conn)';
  readonly isRealtime = false;
  readonly experimental = false;
  readonly categories: MarketCategory[] = ['us_stock', 'forex', 'commodity', 'crypto', 'index', 'etf'];

  private limiter = new RateLimiter();
  private quoteCache = new Map<string, CacheEntry>();
  private lastError: string | null = null;
  private lastThrottledAt: number | null = null;

  private ws: WebSocket | null = null;
  private wsConnectPromise: Promise<void> | null = null;
  private wsHeartbeat: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<QuoteListener>();
  private wsSubscribed = new Set<string>();

  private get apiKey(): string | undefined {
    return process.env.TWELVEDATA_API_KEY;
  }

  async connect(): Promise<void> {
    if (this.wsConnectPromise) return this.wsConnectPromise;
    if (!this.apiKey) throw new Error('TWELVEDATA_API_KEY not set');

    this.wsConnectPromise = new Promise((resolve, reject) => {
      const socket = new WebSocket(`${WS_URL}?apikey=${this.apiKey}`);
      const failTimer = setTimeout(() => reject(new Error('TwelveData WS connect timeout')), 10000);

      socket.on('open', () => {
        clearTimeout(failTimer);
        this.ws = socket;
        if (this.wsSubscribed.size > 0) {
          socket.send(JSON.stringify({ action: 'subscribe', params: { symbols: [...this.wsSubscribed].join(',') } }));
        }
        this.wsHeartbeat = setInterval(() => {
          try {
            socket.send(JSON.stringify({ action: 'heartbeat' }));
          } catch {
            /* socket likely closing; 'close' handler will clean up */
          }
        }, HEARTBEAT_INTERVAL_MS);
        resolve();
      });

      socket.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as {
            event?: string;
            symbol?: string;
            price?: number;
            timestamp?: number;
            day_volume?: number;
          };
          if (msg.event !== 'price' || !msg.symbol || msg.price == null) return;
          const quote: Quote = {
            symbol: msg.symbol,
            price: msg.price,
            change: null,
            changePercent: null,
            volume: msg.day_volume ?? null,
            timestamp: msg.timestamp ? msg.timestamp * 1000 : Date.now(),
            provider: this.id,
            delayed: false,
            experimental: false,
          };
          for (const listener of this.listeners) listener(quote);
        } catch {
          // ignore malformed frames
        }
      });

      socket.on('error', (err) => {
        clearTimeout(failTimer);
        this.lastError = err instanceof Error ? err.message : String(err);
        reject(err);
      });

      socket.on('close', () => {
        if (this.wsHeartbeat) clearInterval(this.wsHeartbeat);
        this.wsHeartbeat = null;
        if (this.ws === socket) this.ws = null;
        this.wsConnectPromise = null;
      });
    });
    return this.wsConnectPromise;
  }

  async disconnect(): Promise<void> {
    if (this.wsHeartbeat) clearInterval(this.wsHeartbeat);
    this.wsHeartbeat = null;
    this.ws?.close();
    this.ws = null;
    this.wsConnectPromise = null;
  }

  /** Subscribes up to MAX_WS_SYMBOLS symbols total (Basic 8's WS credit
   * cap) -- callers (MarketHub's slot manager) must pass only the
   * highest-priority symbols (current chart, visible watchlist rows). */
  async subscribe(symbols: string[], onQuote: QuoteListener): Promise<void> {
    this.listeners.add(onQuote);
    await this.connect();
    const room = MAX_WS_SYMBOLS - this.wsSubscribed.size;
    const toAdd = symbols.filter((s) => !this.wsSubscribed.has(s)).slice(0, Math.max(0, room));
    if (toAdd.length === 0) return;
    for (const s of toAdd) this.wsSubscribed.add(s);
    this.ws?.send(JSON.stringify({ action: 'subscribe', params: { symbols: toAdd.map(toTwelveDataSymbol).join(',') } }));
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    const toRemove = symbols.filter((s) => this.wsSubscribed.delete(s));
    if (toRemove.length === 0) return;
    this.ws?.send(JSON.stringify({ action: 'unsubscribe', params: { symbols: toRemove.map(toTwelveDataSymbol).join(',') } }));
  }

  private cached(symbol: string): Quote | null {
    const entry = this.quoteCache.get(symbol);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      this.quoteCache.delete(symbol);
      return null;
    }
    return entry.quote;
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    if (!this.apiKey) return null;
    const fromCache = this.cached(symbol);
    if (fromCache) return fromCache;
    if (!this.limiter.canRequest()) {
      this.lastThrottledAt = Date.now();
      return null;
    }
    const sym = toTwelveDataSymbol(symbol);
    this.limiter.record();
    try {
      const res = await fetchWithTimeout(`${REST_BASE}/quote?symbol=${encodeURIComponent(sym)}&apikey=${this.apiKey}`);
      if (!res.ok) {
        this.lastError = `HTTP ${res.status}`;
        return null;
      }
      const j = (await res.json()) as {
        close?: string;
        change?: string;
        percent_change?: string;
        volume?: string;
        status?: string;
        message?: string;
      };
      if (j.status === 'error' || !j.close) {
        this.lastError = j.message ?? 'no price returned';
        return null;
      }
      const quote: Quote = {
        symbol,
        price: Number(j.close),
        change: j.change ? Number(j.change) : null,
        changePercent: j.percent_change ? Number(j.percent_change) : null,
        volume: j.volume ? Number(j.volume) : null,
        timestamp: Date.now(),
        provider: this.id,
        delayed: true,
        experimental: false,
      };
      this.quoteCache.set(symbol, { quote, cachedAt: Date.now() });
      this.lastError = null;
      return quote;
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      return null;
    }
  }

  /** Batch quote: TwelveData's /quote endpoint accepts a comma-separated
   * symbol list in one HTTP call (one credit charge per symbol, but a
   * single request/rate-limit slot) -- used to warm the cache for a
   * priority set (e.g. WS seed list) without spending 8 separate
   * requests-per-minute slots on 8 individual calls. */
  async batchGetQuotes(symbols: string[]): Promise<Map<string, Quote>> {
    const result = new Map<string, Quote>();
    if (!this.apiKey || symbols.length === 0) return result;
    if (!this.limiter.canRequest()) {
      this.lastThrottledAt = Date.now();
      return result;
    }
    const mapped = symbols.map((s) => ({ original: s, td: toTwelveDataSymbol(s) }));
    this.limiter.record();
    try {
      const res = await fetchWithTimeout(
        `${REST_BASE}/quote?symbol=${encodeURIComponent(mapped.map((m) => m.td).join(','))}&apikey=${this.apiKey}`,
      );
      if (!res.ok) {
        this.lastError = `HTTP ${res.status}`;
        return result;
      }
      const j = (await res.json()) as Record<
        string,
        { close?: string; change?: string; percent_change?: string; volume?: string; status?: string }
      >;
      // Single-symbol requests return a flat object; multi-symbol
      // requests return an object keyed by the requested symbol string.
      const entries = mapped.length === 1 ? [[mapped[0].td, j] as const] : Object.entries(j);
      for (const [tdSymbol, data] of entries) {
        if (!data || data.status === 'error' || !data.close) continue;
        const original = mapped.find((m) => m.td === tdSymbol)?.original ?? tdSymbol;
        const quote: Quote = {
          symbol: original,
          price: Number(data.close),
          change: data.change ? Number(data.change) : null,
          changePercent: data.percent_change ? Number(data.percent_change) : null,
          volume: data.volume ? Number(data.volume) : null,
          timestamp: Date.now(),
          provider: this.id,
          delayed: true,
          experimental: false,
        };
        this.quoteCache.set(original, { quote, cachedAt: Date.now() });
        result.set(original, quote);
      }
      this.lastError = null;
      return result;
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      return result;
    }
  }

  async getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<Candle[]> {
    if (!this.apiKey || !this.limiter.canRequest()) {
      if (this.apiKey) this.lastThrottledAt = Date.now();
      return [];
    }
    const sym = toTwelveDataSymbol(symbol);
    this.limiter.record();
    const res = await fetchWithTimeout(
      `${REST_BASE}/time_series?symbol=${encodeURIComponent(sym)}&interval=${INTERVAL_MAP[interval]}&outputsize=${limit}&apikey=${this.apiKey}`,
    );
    if (!res.ok) return [];
    const j = (await res.json()) as {
      status?: string;
      values?: { datetime: string; open: string; high: string; low: string; close: string; volume?: string }[];
    };
    if (j.status === 'error' || !j.values) return [];
    return j.values
      .map((v) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: Number(v.open),
        high: Number(v.high),
        low: Number(v.low),
        close: Number(v.close),
        volume: v.volume ? Number(v.volume) : 0,
      }))
      .sort((a, b) => a.time - b.time);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const { usedThisMinute, usedToday } = this.limiter.snapshot();
    const throttled = this.lastThrottledAt != null && Date.now() - this.lastThrottledAt < MINUTE_MS;
    if (!this.apiKey) {
      return {
        provider: this.id,
        healthy: false,
        latencyMs: null,
        message: 'TWELVEDATA_API_KEY not set in .env (Basic 8 plan: 800 credits/day, 8/min, 1 WS connection)',
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: false,
        experimental: false,
      };
    }
    const quotaMsg = `credits: ${usedToday}/${MAX_REQUESTS_PER_DAY} today, ${usedThisMinute}/${MAX_REQUESTS_PER_MINUTE} this minute` +
      (throttled ? ' -- THROTTLED (skipping calls until window resets)' : '') +
      (this.lastError ? ` -- last error: ${this.lastError}` : '');
    if (throttled) {
      return {
        provider: this.id,
        healthy: true,
        latencyMs: null,
        message: `Quota-limited, not down (${quotaMsg})`,
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: true,
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
        message: res.ok ? `OK (${quotaMsg})` : `HTTP ${res.status} (${quotaMsg})`,
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
        message: `${err instanceof Error ? err.message : 'unknown error'} (${quotaMsg})`,
        checkedAt: Date.now(),
        requiresApiKey: true,
        apiKeyPresent: true,
        experimental: false,
      };
    }
  }
}
