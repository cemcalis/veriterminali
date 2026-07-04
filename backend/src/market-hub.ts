import { ProviderRegistry } from '../../src/providers/provider-registry.js';
import { BinanceProvider } from '../../src/providers/binance.provider.js';
import { BinanceFuturesProvider } from '../../src/providers/binance-futures.provider.js';
import { TradingViewTwcProvider } from '../../src/providers/tradingview-twc.provider.js';
import { YahooProvider } from '../../src/providers/yahoo.provider.js';
import { FinnhubProvider } from '../../src/providers/finnhub.provider.js';
import { TwelveDataProvider } from '../../src/providers/twelvedata.provider.js';
import { SYMBOL_CATALOG, type SymbolDef } from '../../src/symbols.js';
import { DiscoveredSymbolStore } from '../../src/discovered-symbols.js';
import { dynamicSymbolLookup } from '../../src/symbol-lookup.js';
import type { Quote, MarketCategory, DataStatus, CandleInterval } from '../../src/providers/market-provider.interface.js';
import { Cache } from './cache.js';
import { JsonStore } from './store/json-store.js';
import { fileURLToPath } from 'node:url';

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
  private binanceFutures = new BinanceFuturesProvider();
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
  // Single stable callback reused for every tv.subscribe() call, so the
  // provider's listener Set doesn't accumulate a fresh closure (and fire
  // duplicate ticks) on every dynamic subscribe.
  private readonly tvTickListener = (quote: Quote) => this.handleTick(quote);
  readonly discovered = new DiscoveredSymbolStore(
    new JsonStore(fileURLToPath(new URL('../data/discovered-symbols.json', import.meta.url)), {}),
  );

  constructor(cache: Cache) {
    this.cache = cache;
    this.registry.register(this.binance);
    this.registry.register(this.binanceFutures);
    this.registry.register(this.tv);
    this.registry.register(this.yahoo);
    this.registry.register(this.finnhub);
    this.registry.register(this.twelvedata);
  }

  /** No single upstream provider's failure to connect/subscribe at
   * startup may ever take the whole backend down -- each is independent,
   * and every other data path (REST fallback, other providers) must keep
   * working regardless of which one is unreachable. Real incident: an
   * unguarded `await` here on TradingView's subscribe crashed the entire
   * process on Render (HTTP 451, Cloudflare blocking the shared outbound
   * IP range) and prevented the HTTP server from ever binding its port. */
  private async subscribeStartupPriority(label: string, run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (err) {
      console.error(`[market-hub] ${label} startup subscribe failed (continuing without it):`, err instanceof Error ? err.message : err);
    }
  }

  async start(): Promise<void> {
    await Promise.allSettled([this.binance.connect(), this.binanceFutures.connect(), this.tv.connect()]);

    const cryptoSymbols = SYMBOL_CATALOG.filter((s) => s.category === 'crypto').map((s) => s.symbol);
    await this.subscribeStartupPriority('Binance', async () => {
      await this.binance.subscribe(cryptoSymbols, (quote) => this.handleTick(quote));
      console.log(`[market-hub] subscribed ${cryptoSymbols.length} crypto symbols via Binance (all, real WS)`);
    });

    const futuresSymbols = SYMBOL_CATALOG.filter((s) => s.category === 'crypto_futures').map((s) => s.symbol);
    await this.subscribeStartupPriority('Binance Futures', async () => {
      await this.binanceFutures.subscribe(futuresSymbols, (quote) => this.handleTick(quote));
      console.log(`[market-hub] subscribed ${futuresSymbols.length} futures symbols via Binance Futures (all, real WS)`);
    });

    const nonCrypto = this.categories().filter((c) => c !== 'crypto' && c !== 'crypto_futures');
    const prioritySymbols: string[] = [];
    for (const category of nonCrypto) {
      const inCategory = SYMBOL_CATALOG.filter((s) => s.category === category).slice(
        0,
        DEFAULT_PRIORITY_PER_CATEGORY,
      );
      prioritySymbols.push(...inCategory.map((s) => s.symbol));
    }
    prioritySymbols.forEach((s) => this.prioritySymbols.add(s));
    // TradingView's socket is an unofficial, reverse-engineered endpoint --
    // it can reject the handshake outright (e.g. HTTP 451 from Cloudflare
    // blocking a shared cloud-hosting IP range, observed on Render). Non-
    // crypto symbols still work via the REST fallback chain in
    // getQuoteWithFallback(), just without live push updates until/unless
    // TV becomes reachable again.
    await this.subscribeStartupPriority('TradingView', async () => {
      await this.tv.subscribe(prioritySymbols, this.tvTickListener);
      prioritySymbols.forEach((s) => this.tvRefCounts.set(s, (this.tvRefCounts.get(s) ?? 0) + 1));
      console.log(
        `[market-hub] subscribed ${prioritySymbols.length} priority symbols via TradingView (experimental); ` +
          `${SYMBOL_CATALOG.length - cryptoSymbols.length - prioritySymbols.length} more available on-demand / via REST fallback`,
      );
    });

    // Finnhub's free tier includes a genuine real-time trade WebSocket
    // (not a scrape, not IP-blocked the way TradingView's unofficial
    // socket is) -- a real, legal, no-cost upgrade for the US-listed
    // symbols it actually covers. Capped well under its ~50-symbol
    // free-tier connection limit; skipped entirely if no key is set.
    if (process.env.FINNHUB_API_KEY) {
      const finnhubSymbols = SYMBOL_CATALOG.filter((s) => s.category === 'us_stock' || s.category === 'etf')
        .slice(0, 45)
        .map((s) => s.symbol);
      await this.subscribeStartupPriority('Finnhub', async () => {
        await this.finnhub.subscribe(finnhubSymbols, (quote) => this.handleTick(quote));
        console.log(`[market-hub] subscribed ${finnhubSymbols.length} us_stock/etf symbols via Finnhub (free tier, real WS)`);
      });
    } else {
      console.log('[market-hub] FINNHUB_API_KEY not set -- skipping free real-time Finnhub WS for us_stock/etf');
    }
  }

  /** Called when a client wants live streaming for symbols outside the
   * default priority set (e.g. viewing a category page or a watchlist
   * item). Ref-counted so multiple clients sharing interest in a symbol
   * don't cause duplicate subscribe/unsubscribe churn. */
  subscribeDynamic(symbols: string[]): void {
    const crypto = symbols.filter((s) => this.findDef(s)?.category === 'crypto');
    const futures = symbols.filter((s) => this.findDef(s)?.category === 'crypto_futures');
    const nonStreamed = symbols.filter((s) => {
      const cat = this.findDef(s)?.category;
      // Unknown symbols (no catalog/discovered def) are rejected here
      // rather than forwarded to TradingView - otherwise a client could
      // subscribe arbitrary strings that unsubscribeDynamic then skips
      // (it also requires `def`), leaking ref-count entries forever.
      return cat !== undefined && cat !== 'crypto' && cat !== 'crypto_futures';
    });

    // Catalog crypto/futures are already subscribed at startup;
    // subscribe() dedupes internally, so this is a no-op for those and
    // only actually opens a new stream for symbols discovered dynamically
    // after boot.
    if (crypto.length > 0) {
      this.binance.subscribe(crypto, (quote) => this.handleTick(quote)).catch((err) => {
        console.error('[market-hub] dynamic Binance subscribe failed:', err instanceof Error ? err.message : err);
      });
    }
    if (futures.length > 0) {
      this.binanceFutures.subscribe(futures, (quote) => this.handleTick(quote)).catch((err) => {
        console.error('[market-hub] dynamic Binance Futures subscribe failed:', err instanceof Error ? err.message : err);
      });
    }

    const toSubscribe: string[] = [];
    for (const symbol of nonStreamed) {
      const count = this.tvRefCounts.get(symbol) ?? 0;
      this.tvRefCounts.set(symbol, count + 1);
      if (count === 0) toSubscribe.push(symbol);
    }
    if (toSubscribe.length > 0) {
      // Same rationale as start(): a rejected promise here must never be
      // unhandled -- Node terminates the process on an unhandled
      // rejection by default, which would crash the whole backend every
      // time a client asks to watch a symbol while TradingView is down.
      this.tv.subscribe(toSubscribe, this.tvTickListener).catch((err) => {
        console.error('[market-hub] dynamic TradingView subscribe failed:', err instanceof Error ? err.message : err);
      });
    }
  }

  /** Releases interest registered via subscribeDynamic. Priority symbols
   * are never actually dropped from the live socket even at ref count 0. */
  unsubscribeDynamic(symbols: string[]): void {
    const toUnsubscribe: string[] = [];
    for (const symbol of symbols) {
      const def = this.findDef(symbol);
      if (!def || def.category === 'crypto' || def.category === 'crypto_futures') continue;
      const count = this.tvRefCounts.get(symbol) ?? 0;
      const next = Math.max(0, count - 1);
      this.tvRefCounts.set(symbol, next);
      if (next === 0 && !this.prioritySymbols.has(symbol)) toUnsubscribe.push(symbol);
    }
    if (toUnsubscribe.length > 0) {
      void this.tv.unsubscribe(toUnsubscribe);
    }
  }

  /** Looks up a symbol in the static catalog first, then in previously
   * discovered (dynamically found) symbols. */
  findDef(symbol: string): SymbolDef | undefined {
    return SYMBOL_CATALOG.find((s) => s.symbol === symbol) ?? this.discovered.find(symbol);
  }

  /** Full browsable catalog: the static generated list plus anything
   * discovered so far via dynamic search, so a discovered symbol shows
   * up in normal category browsing right away. */
  fullCatalog(): SymbolDef[] {
    return [...SYMBOL_CATALOG, ...this.discovered.all()];
  }

  /** Local substring search across the static catalog + discovered
   * symbols. */
  searchLocal(query: string, limit = 20): SymbolDef[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = this.fullCatalog().filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.displayNameTr.toLowerCase().includes(q),
    );
    return matches.slice(0, limit);
  }

  /** Falls back to live provider lookups (Binance, Yahoo search) when the
   * local catalog has no match, so the app feels like it can search
   * unlimited markets. Newly found symbols are persisted and immediately
   * become fetchable like any catalog symbol. */
  async searchDynamic(query: string): Promise<SymbolDef[]> {
    const found = await dynamicSymbolLookup(query);
    for (const def of found) this.discovered.add(def);
    return found;
  }

  private computeStatus(quote: Quote): DataStatus {
    const age = Date.now() - quote.timestamp;
    if (quote.price === null) return 'unavailable';
    if (quote.provider === 'binance' || quote.provider === 'binance-futures') return 'live';
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

    if (def.category === 'crypto_futures') {
      const q = await this.binanceFutures.getQuote(def.symbol).catch(() => null);
      if (q) return { ...q, status: this.computeStatus(q) };
      return null;
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

  /** Picks the right live provider for a symbol's category and fetches
   * its recent candle history. Shared by the /candles REST route and the
   * scanner's on-demand indicator computation. */
  async getCandlesFor(def: SymbolDef, interval: CandleInterval, limit = 200) {
    const providerId =
      def.category === 'crypto' ? 'binance' : def.category === 'crypto_futures' ? 'binance-futures' : 'tradingview-twc';
    const provider = this.registry.get(providerId);
    if (!provider) return { candles: [], providerId };
    const candles = await provider.getCandles(def.symbol, interval, limit);
    return { candles, providerId };
  }

  async healthSnapshot() {
    const providers = this.registry.all();
    return Promise.all(providers.map((p) => p.healthCheck()));
  }

  categories(): MarketCategory[] {
    return ['crypto', 'crypto_futures', 'forex', 'commodity', 'bist', 'us_stock', 'etf', 'index'];
  }
}
