/**
 * Adapter modeled after ch99q/twc (TradingView WebSocket client).
 * Uses the shared unofficial TradingView socket protocol. Quote-session
 * style: best for live last-price/bid/ask streaming across all asset
 * classes TradingView indexes (crypto, forex, commodities, BIST, US
 * stocks, indices). EXPERIMENTAL - reverse engineered, no official
 * support or SLA from TradingView.
 */
import { TradingViewSocket, tvFieldsToQuote } from './lib/tradingview-socket.js';
import type {
  Candle,
  CandleInterval,
  MarketCategory,
  MarketProvider,
  ProviderHealth,
  Quote,
  QuoteListener,
} from './market-provider.interface.js';

export class TradingViewTwcProvider implements MarketProvider {
  readonly id = 'tradingview-twc';
  readonly name = 'TradingView (twc-style quote session)';
  readonly isRealtime = true;
  readonly experimental = true;
  readonly categories: MarketCategory[] = [
    'crypto',
    'forex',
    'commodity',
    'bist',
    'us_stock',
    'index',
  ];

  private socket = new TradingViewSocket();
  private listeners = new Set<QuoteListener>();
  private lastQuotes = new Map<string, Quote>();
  private unsubscribeFn: (() => void) | null = null;

  async connect(): Promise<void> {
    await this.socket.connect();
    if (!this.unsubscribeFn) {
      this.unsubscribeFn = this.socket.onQuote((symbol, fields) => {
        const quote = tvFieldsToQuote(symbol, fields, this.id);
        const prev = this.lastQuotes.get(symbol);
        const merged = prev ? { ...prev, ...quote, price: quote.price ?? prev.price } : quote;
        this.lastQuotes.set(symbol, merged);
        for (const listener of this.listeners) listener(merged);
      });
    }
  }

  async disconnect(): Promise<void> {
    this.unsubscribeFn?.();
    this.unsubscribeFn = null;
    await this.socket.disconnect();
  }

  async subscribe(symbols: string[], onQuote: QuoteListener): Promise<void> {
    this.listeners.add(onQuote);
    await this.connect();
    this.socket.subscribeQuotes(symbols);
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    this.socket.unsubscribeQuotes(symbols);
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    const cached = this.lastQuotes.get(symbol);
    if (cached && cached.price !== null) return cached;
    await this.connect();
    this.socket.subscribeQuotes([symbol]);
    return new Promise((resolve) => {
      let merged: Record<string, number> = {};
      // For thinly-traded/after-hours symbols TradingView may only ever
      // send bid/ask deltas (no fresh "lp" tick) for a long time. Prefer a
      // real last-price update, but after a shorter grace period fall
      // back to the bid/ask midpoint rather than blocking the caller for
      // the full window or reporting "no data" when real market data
      // (a quoted spread) is actually available.
      const fallbackTimer = setTimeout(() => {
        if (merged.bid !== undefined && merged.ask !== undefined) {
          finish({ ...merged, lp: (merged.bid + merged.ask) / 2 });
        }
      }, 4000);
      const timer = setTimeout(() => {
        unsub();
        resolve(this.lastQuotes.get(symbol) ?? null);
      }, 9000);
      const finish = (fields: Record<string, number>) => {
        clearTimeout(fallbackTimer);
        clearTimeout(timer);
        unsub();
        resolve(tvFieldsToQuote(symbol, fields, this.id));
      };
      const unsub = this.socket.onQuote((sym, fields) => {
        if (sym !== symbol) return;
        merged = { ...merged, ...fields };
        if (merged.lp === undefined) return; // wait for an update carrying last price
        finish(merged);
      });
    });
  }

  async getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<Candle[]> {
    return this.socket.fetchCandles(symbol, interval, limit);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.connect();
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        healthy: this.socket.isConnected(),
        latencyMs,
        message: this.socket.isConnected() ? 'OK (experimental/unofficial)' : 'not connected',
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
