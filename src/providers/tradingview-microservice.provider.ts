/**
 * Adapter modeled after dovudo/tradingview-websocket (realtime OHLCV
 * microservice). Uses the same underlying unofficial TradingView socket
 * protocol as tradingview-twc.provider.ts, but this adapter is
 * candle/OHLCV-first: getCandles() is the primary use case, quote
 * streaming is secondary. EXPERIMENTAL - reverse engineered.
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

export class TradingViewMicroserviceProvider implements MarketProvider {
  readonly id = 'tradingview-microservice';
  readonly name = 'TradingView (OHLCV microservice-style)';
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
  private unsubscribeFn: (() => void) | null = null;

  async connect(): Promise<void> {
    await this.socket.connect();
    if (!this.unsubscribeFn) {
      this.unsubscribeFn = this.socket.onQuote((symbol, fields) => {
        const quote = tvFieldsToQuote(symbol, fields, this.id);
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
    const candles = await this.getCandles(symbol, '1m', 1);
    if (candles.length === 0) return null;
    const last = candles[candles.length - 1];
    return {
      symbol,
      price: last.close,
      change: null,
      changePercent: null,
      volume: last.volume,
      timestamp: Date.now(),
      provider: this.id,
      delayed: false,
      experimental: true,
    };
  }

  async getCandles(symbol: string, interval: CandleInterval, limit = 200): Promise<Candle[]> {
    return this.socket.fetchCandles(symbol, interval, limit);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const candles = await this.getCandles('BINANCE:BTCUSDT', '1m', 1);
      return {
        provider: this.id,
        healthy: candles.length > 0,
        latencyMs: Date.now() - start,
        message: candles.length > 0 ? 'OK (experimental/unofficial)' : 'no candle data returned',
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
