import { ProviderRegistry } from '../../src/providers/provider-registry.js';
import { BinanceProvider } from '../../src/providers/binance.provider.js';
import { TradingViewTwcProvider } from '../../src/providers/tradingview-twc.provider.js';
import { YahooProvider } from '../../src/providers/yahoo.provider.js';
import { FinnhubProvider } from '../../src/providers/finnhub.provider.js';
import { TwelveDataProvider } from '../../src/providers/twelvedata.provider.js';
import { SYMBOL_CATALOG, type SymbolDef } from '../../src/symbols.js';
import type { Quote, MarketCategory, DataStatus } from '../../src/providers/market-provider.interface.js';
import { Cache } from './cache.js';

export type TickListener = (quote: Quote) => void;

/** How many symbols per non-crypto category are streamed live by default
 * (most liquid/popular first, since the catalog is ordered that way).
 * Everything outside this priority set is still fully queryable via REST
 * (getQuoteWithFallback) and can be promoted to live streaming on demand
 * via subscribeDynamic (e.g. a client viewing that category/symbol). */
const DEFAULT_PRIORITY_PER_CATEGORY = 30;
const NEAR_LIVE_MAX_AGE_MS = 15_000;
const FALLBACK_STALE_AGE_MS = 60_000;

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

  /** symbols currently streamed live via tradingview-twc, and how many
   * distinct interested parties (default-priority + connected clients)
   * currently want each one. Ref count 0 => unsubscribed to save the
   * unofficial socket from being asked to track everything at once. */
  private tvRefCounts = new Map<string, number>();
  private prioritySymbols = new Set<string>();

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
    await this.binance.subscribe(cryptoSymbols, (quote) => this.handleTick(quote));
    console.log(`[market-hub] subscribed ${cryptoSymbols.length} crypto symbols via Binance (all, real WS)`);

    const nonCrypto = this.categories().filter((c) => c !== 'crypto');
    const prioritySymbols: string[] = [];
    for (const category of nonCrypto) {
      const inCategory = SYMBOL_CATALOG.filter((s) => s.category === category).slice(
        0,
        DEFAULT_PRIORITY_PER_CATEGORY,
      );
      prioritySymbols.push(...inCategory.map((s) => s.symbol));
    }
    prioritySymbols.forEach((s) => this.prioritySymbols.add(s));
    await this.tv.subscribe(prioritySymbols, (quote) => this.handleTick(quote));
    prioritySymbols.forEach((s) => this.tvRefCounts.set(s, (this.tvRefCounts.get(s) ?? 0) + 1));
    console.log(
      `[market-hub] subscribed ${prioritySymbols.length} priority symbols via TradingView (experimental); ` +
        `${SYMBOL_CATALOG.length - cryptoSymbols.length - prioritySymbols.length} more available on-demand / via REST fallback`,
    );
  }

  /** Called when a client wants live streaming for symbols outside the
   * default priority set (e.g. viewing a category page or a watchlist
   * item). Ref-counted so multiple clients sharing interest in a symbol
   * don't cause duplicate subscribe/unsubscribe churn. */
  subscribeDynamic(symbols: string[]): void {
    const crypto = symbols.filter((s) => this.findDef(s)?.category === 'crypto');
    const nonCrypto = symbols.filter((s) => this.findDef(s)?.category !== 'crypto');

    // crypto is always fully subscribed already; nothing to do there.
    void crypto;

    const toSubscribe: string[] = [];
    for (const symbol of nonCrypto) {
      const count = this.tvRefCounts.get(symbol) ?? 0;
      this.tvRefCounts.set(symbol, count + 1);
      if (count === 0) toSubscribe.push(symbol);
    }
    if (toSubscribe.length > 0) {
      void this.tv.subscribe(toSubscribe, (quote) => this.handleTick(quote));
    }
  }

  /** Releases interest registered via subscribeDynamic. Priority symbols
   * are never actually dropped from the live socket even at ref count 0. */
  unsubscribeDynamic(symbols: string[]): void {
    const toUnsubscribe: string[] = [];
    for (const symbol of symbols) {
      const def = this.findDef(symbol);
      if (!def || def.category === 'crypto') continue;
      const count = this.tvRefCounts.get(symbol) ?? 0;
      const next = Math.max(0, count - 1);
      this.tvRefCounts.set(symbol, next);
      if (next === 0 && !this.prioritySymbols.has(symbol)) toUnsubscribe.push(symbol);
    }
    if (toUnsubscribe.length > 0) {
      void this.tv.unsubscribe(toUnsubscribe);
    }
  }

  private findDef(symbol: string): SymbolDef | undefined {
    return SYMBOL_CATALOG.find((s) => s.symbol === symbol);
  }

  private computeStatus(quote: Quote): DataStatus {
    const age = Date.now() - quote.timestamp;
    if (quote.price === null) return 'unavailable';
    if (quote.provider === 'binance') return 'live';
    if (quote.delayed) return age > FALLBACK_STALE_AGE_MS ? 'fallback' : 'delayed';
    if (quote.experimental) return age <= NEAR_LIVE_MAX_AGE_MS ? 'near-live' : 'fallback';
    return age <= NEAR_LIVE_MAX_AGE_MS ? 'live' : 'fallback';
  }

  private handleTick(quote: Quote): void {
    if (quote.price === null) return;
    const withStatus = { ...quote, status: this.computeStatus(quote) };
    this.latest.set(quote.symbol, withStatus);
    void this.cache.set(`quote:${quote.symbol}`, withStatus, 30);
    for (const listener of this.listeners) listener(withStatus);
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
    if (cached) return { ...cached, status: this.computeStatus(cached) };

    if (def.category === 'crypto') {
      const q = await this.binance.getQuote(def.symbol).catch(() => null);
      if (q) return { ...q, status: this.computeStatus(q) };
    }

    const tvQuote = await this.tv.getQuote(def.symbol).catch(() => null);
    if (tvQuote?.price != null) return { ...tvQuote, status: this.computeStatus(tvQuote) };

    if (def.category === 'us_stock' || def.category === 'forex' || def.category === 'crypto') {
      const fh = await this.finnhub.getQuote(def.symbol).catch(() => null);
      if (fh?.price != null) return { ...fh, status: this.computeStatus(fh) };
    }

    const td = await this.twelvedata.getQuote(def.symbol).catch(() => null);
    if (td?.price != null) return { ...td, status: this.computeStatus(td) };

    if (def.yahooSymbol) {
      const y = await this.yahoo.getQuote(def.yahooSymbol).catch(() => null);
      if (y?.price != null) return { ...y, status: this.computeStatus(y) };
    }

    return null;
  }

  async healthSnapshot() {
    const providers = this.registry.all();
    return Promise.all(providers.map((p) => p.healthCheck()));
  }

  categories(): MarketCategory[] {
    return ['crypto', 'forex', 'commodity', 'bist', 'us_stock', 'etf', 'index'];
  }
}
