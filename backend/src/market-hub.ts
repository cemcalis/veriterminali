import { ProviderRegistry } from '../../src/providers/provider-registry.js';
import { BinanceProvider } from '../../src/providers/binance.provider.js';
import { TradingViewTwcProvider } from '../../src/providers/tradingview-twc.provider.js';
import { YahooProvider } from '../../src/providers/yahoo.provider.js';
import { FinnhubProvider } from '../../src/providers/finnhub.provider.js';
import { TwelveDataProvider } from '../../src/providers/twelvedata.provider.js';
import { SYMBOL_CATALOG, type SymbolDef } from '../../src/symbols.js';
import type { Quote, MarketCategory } from '../../src/providers/market-provider.interface.js';
import { Cache } from './cache.js';

export type TickListener = (quote: Quote) => void;

/**
 * Central hub wiring the provider registry to the app's fixed symbol
 * catalog. Routing policy:
 *  - crypto -> binance (official realtime, no key)
 *  - everything else -> tradingview-twc (experimental realtime, no key)
 *  - if a live tick hasn't arrived recently, REST fallback chain kicks
 *    in for polled quote reads: finnhub/twelvedata (if keyed) -> yahoo
 */
export class MarketHub {
  readonly registry = new ProviderRegistry();
  private binance = new BinanceProvider();
  private tv = new TradingViewTwcProvider();
  private yahoo = new YahooProvider();
  private finnhub = new FinnhubProvider();
  private twelvedata = new TwelveDataProvider();
  private listeners = new Set<TickListener>();
  private latest = new Map<string, Quote>();
  private cache: Cache;

  constructor(cache: Cache) {
    this.cache = cache;
    this.registry.register(this.binance);
    this.registry.register(this.tv);
    this.registry.register(this.yahoo);
    this.registry.register(this.finnhub);
    this.registry.register(this.twelvedata);
  }

  async start(): Promise<void> {
    await Promise.allSettled([this.binance.connect(), this.tv.connect()]);

    const cryptoSymbols = SYMBOL_CATALOG.filter((s) => s.category === 'crypto').map((s) => s.symbol);
    const tvSymbols = SYMBOL_CATALOG.filter((s) => s.category !== 'crypto').map((s) => s.symbol);

    await this.binance.subscribe(cryptoSymbols, (quote) => this.handleTick(quote));
    await this.tv.subscribe(tvSymbols, (quote) => this.handleTick(quote));

    console.log(`[market-hub] subscribed ${cryptoSymbols.length} crypto symbols via Binance`);
    console.log(`[market-hub] subscribed ${tvSymbols.length} symbols via TradingView (experimental)`);
  }

  private handleTick(quote: Quote): void {
    if (quote.price === null) return;
    this.latest.set(quote.symbol, quote);
    void this.cache.set(`quote:${quote.symbol}`, quote, 30);
    for (const listener of this.listeners) listener(quote);
  }

  onTick(listener: TickListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getLatest(symbol: string): Quote | undefined {
    return this.latest.get(symbol);
  }

  allLatest(): Quote[] {
    return [...this.latest.values()];
  }

  /** REST fallback chain for a single symbol read, used by /api/quote/:symbol */
  async getQuoteWithFallback(def: SymbolDef): Promise<Quote | null> {
    const live = this.latest.get(def.symbol);
    if (live) return live;

    const cached = await this.cache.get<Quote>(`quote:${def.symbol}`);
    if (cached) return cached;

    if (def.category === 'crypto') {
      const q = await this.binance.getQuote(def.symbol).catch(() => null);
      if (q) return q;
    }

    const tvQuote = await this.tv.getQuote(def.symbol).catch(() => null);
    if (tvQuote?.price != null) return tvQuote;

    if (def.category === 'us_stock' || def.category === 'forex' || def.category === 'crypto') {
      const fh = await this.finnhub.getQuote(def.symbol).catch(() => null);
      if (fh?.price != null) return fh;
    }

    const td = await this.twelvedata.getQuote(def.symbol).catch(() => null);
    if (td?.price != null) return td;

    if (def.yahooSymbol) {
      const y = await this.yahoo.getQuote(def.yahooSymbol).catch(() => null);
      if (y?.price != null) return y;
    }

    return null;
  }

  async healthSnapshot() {
    const providers = this.registry.all();
    return Promise.all(providers.map((p) => p.healthCheck()));
  }

  categories(): MarketCategory[] {
    return ['crypto', 'forex', 'commodity', 'bist', 'us_stock', 'index'];
  }
}
