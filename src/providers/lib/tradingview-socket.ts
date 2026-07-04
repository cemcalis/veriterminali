/**
 * Minimal client for TradingView's unofficial public WebSocket protocol
 * (wss://data.tradingview.com/socket.io/websocket). This is the same
 * protocol wrapped by ch99q/twc, dovudo/tradingview-websocket, and
 * iiiyu/tradingview-ws-client. It requires no API key but is reverse
 * engineered and unsupported by TradingView — treat all data from it
 * as EXPERIMENTAL.
 */
import WebSocket from 'ws';
import type { Candle, CandleInterval, Quote } from '../market-provider.interface.js';

const TV_WS_URL = 'wss://data.tradingview.com/socket.io/websocket';

const INTERVAL_MAP: Record<CandleInterval, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
};

function frame(obj: unknown): string {
  const s = JSON.stringify(obj);
  return `~m~${s.length}~m~${s}`;
}

function randSession(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < 12; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${r}`;
}

interface QuoteFrame {
  m: string;
  p: [string, { n: string; s: string; v: Record<string, number> }];
}

export type TvQuoteListener = (symbol: string, fields: Record<string, number>) => void;

class SocketTornDownError extends Error {
  constructor() {
    super('TradingView socket was torn down mid-request');
  }
}

/** If no message (including heartbeats, which TV sends every few seconds)
 * arrives within this window, the connection is treated as a dead/zombie
 * TCP socket and force-reconnected. */
const STALE_CONNECTION_MS = 30000;
const WATCHDOG_INTERVAL_MS = 10000;
/** After a failed handshake (e.g. HTTP 451 from an IP-level block), don't
 * retry more often than this -- hammering an endpoint that's actively
 * rejecting the connection wastes cycles and looks like abuse. */
const CONNECT_FAILURE_COOLDOWN_MS = 30000;

export class TradingViewSocket {
  private ws: WebSocket | null = null;
  private quoteSession = randSession('qs');
  private connected = false;
  private connectPromise: Promise<void> | null = null;
  private listeners = new Set<TvQuoteListener>();
  private subscribedSymbols = new Set<string>();
  private lastMessageAt = 0;
  /** last time an actual qsd quote update arrived - heartbeats (~h~) keep
   * the raw socket "alive" even when TradingView has silently stopped
   * pushing quote deltas for our session, so staleness must be judged by
   * real data, not socket-level pings. */
  private lastQuoteDataAt = 0;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private reconnecting = false;
  private manuallyClosed = false;
  private lastConnectFailureAt = 0;

  connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    if (this.lastConnectFailureAt && Date.now() - this.lastConnectFailureAt < CONNECT_FAILURE_COOLDOWN_MS) {
      return Promise.reject(new Error('TradingView connect on cooldown after a recent failure'));
    }
    this.manuallyClosed = false;
    this.quoteSession = randSession('qs');
    this.connectPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(TV_WS_URL, {
        headers: {
          Origin: 'https://www.tradingview.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const failTimer = setTimeout(() => {
        this.recordConnectFailure();
        reject(new Error('TradingView WS connect timeout'));
      }, 10000);

      this.ws.on('open', () => {
        clearTimeout(failTimer);
        this.connected = true;
        this.lastMessageAt = Date.now();
        this.lastQuoteDataAt = Date.now();
        this.send({ m: 'quote_create_session', p: [this.quoteSession] });
        this.send({
          m: 'quote_set_fields',
          p: [this.quoteSession, 'lp', 'chp', 'ch', 'volume', 'bid', 'ask'],
        });
        // re-subscribe to everything that was live before a reconnect
        for (const s of this.subscribedSymbols) {
          this.send({ m: 'quote_add_symbols', p: [this.quoteSession, s] });
        }
        this.startWatchdog();
        resolve();
      });

      this.ws.on('message', (data) => this.handleMessage(data.toString()));

      this.ws.on('error', (err) => {
        clearTimeout(failTimer);
        this.connected = false;
        this.recordConnectFailure();
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

  /** Lets the next connect() attempt actually try again (instead of
   * returning the same rejected promise forever) while still respecting
   * CONNECT_FAILURE_COOLDOWN_MS so a hard block doesn't get hammered. */
  private recordConnectFailure(): void {
    this.lastConnectFailureAt = Date.now();
    this.connectPromise = null;
  }

  async disconnect(): Promise<void> {
    this.manuallyClosed = true;
    this.connected = false;
    this.connectPromise = null;
    this.stopWatchdog();
    this.ws?.close();
    this.ws = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  lastActivityAgeMs(): number {
    return this.lastMessageAt ? Date.now() - this.lastMessageAt : Infinity;
  }

  private startWatchdog(): void {
    this.stopWatchdog();
    this.watchdogTimer = setInterval(() => {
      const quoteDataAge = this.lastQuoteDataAt ? Date.now() - this.lastQuoteDataAt : Infinity;
      if (this.subscribedSymbols.size > 0 && quoteDataAge > STALE_CONNECTION_MS) {
        console.warn(
          `[tradingview-socket] no quote data for ${Math.round(quoteDataAge / 1000)}s across ${this.subscribedSymbols.size} symbols, reconnecting`,
        );
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
      console.error('[tradingview-socket] reconnect failed', err);
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
        console.error('[tradingview-socket] reconnect failed', err);
        this.scheduleReconnect();
      });
    }, 2000);
  }

  onQuote(listener: TvQuoteListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeQuotes(symbols: string[]): void {
    for (const s of symbols) {
      if (this.subscribedSymbols.has(s)) continue;
      this.subscribedSymbols.add(s);
      this.send({ m: 'quote_add_symbols', p: [this.quoteSession, s] });
    }
  }

  unsubscribeQuotes(symbols: string[]): void {
    for (const s of symbols) {
      this.subscribedSymbols.delete(s);
      this.send({ m: 'quote_remove_symbols', p: [this.quoteSession, s] });
    }
  }

  /** One-shot candle fetch via a throwaway chart session. Retries once if
   * the underlying connection gets torn down mid-flight (e.g. the
   * staleness watchdog reconnecting concurrently) instead of silently
   * returning an empty result. */
  async fetchCandles(symbol: string, interval: CandleInterval, limit = 100): Promise<Candle[]> {
    try {
      return await this.fetchCandlesOnce(symbol, interval, limit);
    } catch (err) {
      if (err instanceof SocketTornDownError) {
        return this.fetchCandlesOnce(symbol, interval, limit);
      }
      throw err;
    }
  }

  private async fetchCandlesOnce(
    symbol: string,
    interval: CandleInterval,
    limit: number,
  ): Promise<Candle[]> {
    await this.connect();
    const activeWs = this.ws;
    if (!activeWs) throw new SocketTornDownError();

    return new Promise((resolve, reject) => {
      const chartSession = randSession('cs');
      const seriesId = 'sds_1';
      const bars = new Map<number, Candle>();
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve([...bars.values()].sort((a, b) => a.time - b.time));
        }
      }, 6000);

      const onClose = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          cleanup();
          reject(new SocketTornDownError());
        }
      };

      const handler = (raw: string) => {
        const parts = raw.split(/~m~\d+~m~/).filter(Boolean);
        for (const part of parts) {
          try {
            const j = JSON.parse(part);
            if (j.m === 'symbol_error' && j.p?.[0] === chartSession) {
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                cleanup();
                reject(new Error(`TradingView symbol_error for ${symbol}`));
              }
            }
            if ((j.m === 'timescale_update' || j.m === 'du') && j.p?.[0] === chartSession) {
              const seriesData = j.p[1]?.[seriesId]?.s;
              if (Array.isArray(seriesData)) {
                for (const bar of seriesData) {
                  const [time, open, high, low, close, volume] = bar.v;
                  bars.set(time, { time, open, high, low, close, volume: volume ?? 0 });
                }
              }
            }
          } catch {
            // ignore non-JSON frames (session id banner)
          }
        }
      };

      const cleanup = () => {
        activeWs.off('message', wrappedHandler);
        activeWs.off('close', onClose);
        if (activeWs.readyState === WebSocket.OPEN) {
          activeWs.send(frame({ m: 'chart_delete_session', p: [chartSession] }));
        }
      };

      const wrappedHandler = (data: WebSocket.RawData) => handler(data.toString());
      activeWs.on('message', wrappedHandler);
      activeWs.on('close', onClose);

      const sendOnActive = (obj: unknown) => {
        if (activeWs.readyState === WebSocket.OPEN) activeWs.send(frame(obj));
      };
      sendOnActive({ m: 'chart_create_session', p: [chartSession, ''] });
      sendOnActive({ m: 'resolve_symbol', p: [chartSession, 'sds_sym_1', symbol] });
      sendOnActive({
        m: 'create_series',
        p: [chartSession, seriesId, 's1', 'sds_sym_1', INTERVAL_MAP[interval], limit],
      });
    });
  }

  private send(obj: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(frame(obj));
    }
  }

  private handleMessage(raw: string): void {
    this.lastMessageAt = Date.now();
    if (raw.includes('~h~')) {
      // heartbeat: echo back verbatim to keep the session alive
      this.ws?.send(raw);
      return;
    }
    const parts = raw.split(/~m~\d+~m~/).filter(Boolean);
    for (const part of parts) {
      let j: QuoteFrame;
      try {
        j = JSON.parse(part);
      } catch {
        continue;
      }
      if (j.m === 'qsd' && j.p?.[1]?.s === 'ok') {
        this.lastQuoteDataAt = Date.now();
        const { n: symbol, v: fields } = j.p[1];
        for (const listener of this.listeners) listener(symbol, fields);
      }
    }
  }
}

export function tvFieldsToQuote(
  symbol: string,
  fields: Record<string, number>,
  provider: string,
): Quote {
  return {
    symbol,
    price: fields.lp ?? null,
    change: fields.ch ?? null,
    changePercent: fields.chp ?? null,
    bid: fields.bid ?? null,
    ask: fields.ask ?? null,
    volume: fields.volume ?? null,
    timestamp: Date.now(),
    provider,
    delayed: false,
    experimental: true,
  };
}
