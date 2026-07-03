/**
 * Adapter modeled after iiiyu/tradingview-ws-client (realtime quote +
 * candle client). Uses the same underlying unofficial TradingView
 * socket protocol; combines quote streaming and candle fetch in a
 * single balanced adapter. EXPERIMENTAL - reverse engineered.
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

export class TradingViewWsClientProvider implements MarketProvider {
  readonly id = 'tradingview-ws-client';
  readonly name = 'TradingView (quote+candle client-style)';
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
        this.lastQuotes.set(symbol, quote);
        for (const listener of this.listeners) listener(quote);
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
      // See tradingview-twc.provider.ts for why we fall back to the
      // bid/ask midpoint when no fresh "lp" tick arrives quickly.
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
        const quote = tvFieldsToQuote(symbol, fields, this.id);
        this.lastQuotes.set(symbol, quote);
        resolve(quote);
      };
      const unsub = this.socket.onQuote((sym, fields) => {
        if (sym !== symbol) return;
        merged = { ...merged, ...fields };
        if (merged.lp === undefined) return;
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
      return {
        provider: this.id,
        healthy: this.socket.isConnected(),
        latencyMs: Date.now() - start,
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
