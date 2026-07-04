import { ProviderRegistry } from '../../src/providers/provider-registry.js';
import { BinanceProvider } from '../../src/providers/binance.provider.js';
import { BinanceFuturesProvider } from '../../src/providers/binance-futures.provider.js';
import { TradingViewTwcProvider } from '../../src/providers/tradingview-twc.provider.js';
import { YahooProvider } from '../../src/providers/yahoo.provider.js';
import { FinnhubProvider } from '../../src/providers/finnhub.provider.js';
import { TwelveDataProvider } from '../../src/providers/twelvedata.provider.js';
import { FmpProvider } from '../../src/providers/fmp.provider.js';
import { AlphaVantageProvider } from '../../src/providers/alphavantage.provider.js';
import { PolygonProvider } from '../../src/providers/polygon.provider.js';
import { EcbProvider } from '../../src/providers/ecb.provider.js';
import { BigparaProvider } from '../../src/providers/bigpara.provider.js';
import { IsYatirimProvider } from '../../src/providers/isyatirim.provider.js';
import { TcmbEvdsProvider } from '../../src/providers/tcmb-evds.provider.js';
import { BiQuoteProvider } from '../../src/providers/biquote.provider.js';
import { TradingViewScannerProvider, type BistScanRow } from '../../src/providers/tradingview-scanner.provider.js';
import { providerHealth } from '../../src/providers/provider-health.js';
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

/** Master feature flags. All default to enabled -- these exist so a
 * Render deploy can be dialed back (e.g. ENABLE_STARTUP_STREAMS=false for
 * a pure REST-fallback smoke test) without a code change. */
const FLAGS = {
  tradingView: process.env.ENABLE_TRADINGVIEW !== 'false',
  tradingViewStreams: process.env.ENABLE_TRADINGVIEW_STREAMS !== 'false',
  binanceStreams: process.env.ENABLE_BINANCE_STREAMS !== 'false',
  binanceFuturesStreams: process.env.ENABLE_BINANCE_FUTURES_STREAMS !== 'false',
  startupStreams: process.env.ENABLE_STARTUP_STREAMS !== 'false',
};

/** Finnhub's free WS connection is capped (~50 symbols); this is the
 * budget we stay under. Slots are allocated by priority tier, not just
 * "first 45 in the catalog" -- see WsSlotManager. */
const FINNHUB_WS_CAPACITY = 45;

/** TwelveData's Basic 8 plan: 1 WS connection, 8 symbol credits. Reuses
 * the same WsSlotManager rotation as Finnhub, sized to the plan's cap
 * (see MAX_WS_SYMBOLS in twelvedata.provider.ts). */
const TWELVEDATA_WS_CAPACITY = 8;

/** Manages which symbols occupy a provider's limited WS slot budget
 * (originally written for Finnhub's us_stock/etf cap, now shared with
 * TwelveData's forex/commodity/index cap). Two tiers:
 *  - "dynamic" symbols: whatever subscribeDynamic() has live interest in
 *    right now (a client's watchlist, the category page they're looking
 *    at, or the chart they currently have open) -- always wins a slot if
 *    one is available.
 *  - "fill" symbols: the static most-liquid-first priority list, used to
 *    occupy any slots dynamic demand isn't using, so the WS connection
 *    isn't sitting half-empty. Evicted first whenever dynamic demand
 *    needs the room.
 * This is the "watchlist first, visible second, current third, then
 * trending/most-liquid" rotation -- "trending" degrades honestly to the
 * static liquidity-ordered catalog rather than inventing a separate
 * trending-detection subsystem. */
class WsSlotManager {
  private dynamicRefCounts = new Map<string, number>();
  private fillSymbols = new Set<string>();

  constructor(
    private readonly capacity: number,
    private readonly fillPool: string[],
  ) {}

  private get occupied(): number {
    return this.dynamicRefCounts.size + this.fillSymbols.size;
  }

  /** Called once at startup to occupy any free slots with the most-liquid
   * static symbols, so the connection is used even before any client asks
   * for anything specific. */
  seedFill(): string[] {
    const added: string[] = [];
    for (const symbol of this.fillPool) {
      if (this.occupied >= this.capacity) break;
      if (this.fillSymbols.has(symbol)) continue;
      this.fillSymbols.add(symbol);
      added.push(symbol);
    }
    return added;
  }

  /** Requests slots for `symbols` (ref-counted, so multiple viewers of
   * the same symbol don't fight over one slot). Returns exactly the
   * symbols that newly need a live subscribe call, evicting fill
   * symbols to make room where necessary. */
  requestSlots(symbols: string[]): { toAdd: string[]; toEvict: string[] } {
    const toAdd: string[] = [];
    const toEvict: string[] = [];
    for (const symbol of symbols) {
      const count = this.dynamicRefCounts.get(symbol) ?? 0;
      this.dynamicRefCounts.set(symbol, count + 1);
      if (count > 0) continue; // already occupies a slot
      if (this.fillSymbols.has(symbol)) {
        this.fillSymbols.delete(symbol); // promote fill -> dynamic, no net slot change
        continue;
      }
      if (this.occupied > this.capacity) {
        // over budget (shouldn't happen given the evict-first loop below,
        // but guards against a race) -- drop the request, REST fallback
        // still serves this symbol.
        this.dynamicRefCounts.set(symbol, count);
        continue;
      }
      if (this.occupied === this.capacity) {
        const evicted = this.fillSymbols.values().next().value;
        if (evicted === undefined) {
          // no fill symbol left to evict and we're at capacity -- can't
          // grant this one, REST fallback covers it instead.
          this.dynamicRefCounts.set(symbol, count);
          continue;
        }
        this.fillSymbols.delete(evicted);
        toEvict.push(evicted);
      }
      toAdd.push(symbol);
    }
    return { toAdd, toEvict };
  }

  /** Releases dynamic interest. Frees slots get backfilled from the
   * static fill pool so the connection stays fully utilized. */
  releaseSlots(symbols: string[]): { toRemove: string[]; toBackfill: string[] } {
    const toRemove: string[] = [];
    for (const symbol of symbols) {
      const count = this.dynamicRefCounts.get(symbol) ?? 0;
      const next = Math.max(0, count - 1);
      if (next > 0) {
        this.dynamicRefCounts.set(symbol, next);
        continue;
      }
      this.dynamicRefCounts.delete(symbol);
      toRemove.push(symbol);
    }
    const toBackfill: string[] = [];
    for (const symbol of this.fillPool) {
      if (this.occupied >= this.capacity) break;
      if (this.fillSymbols.has(symbol) || this.dynamicRefCounts.has(symbol)) continue;
      this.fillSymbols.add(symbol);
      toBackfill.push(symbol);
    }
    return { toRemove, toBackfill };
  }
}

export class MarketHub {
  readonly registry = new ProviderRegistry();
  private binance = new BinanceProvider();
  private binanceFutures = new BinanceFuturesProvider();
  private tv = new TradingViewTwcProvider();
  private yahoo = new YahooProvider();
  private finnhub = new FinnhubProvider();
  private twelvedata = new TwelveDataProvider();
  private fmp = new FmpProvider();
  private alphavantage = new AlphaVantageProvider();
  private polygon = new PolygonProvider();
  private ecb = new EcbProvider();
  private bigpara = new BigparaProvider();
  private isyatirim = new IsYatirimProvider();
  private tcmbEvds = new TcmbEvdsProvider();
  private biquote = new BiQuoteProvider();
  private tvScanner = new TradingViewScannerProvider();
  /** Bulk BIST scanner cache -- see getBistScannerRows(). Short TTL: this
   * powers the "Tarayıcı" table view, not a single-symbol quote path. */
  private bistScanCache: { rows: BistScanRow[]; fetchedAt: number } | null = null;
  private readonly BIST_SCAN_TTL_MS = 30_000;
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
  private readonly finnhubTickListener = (quote: Quote) => this.handleTick(quote);
  private readonly twelvedataTickListener = (quote: Quote) => this.handleTick(quote);
  private finnhubSlots: WsSlotManager | null = null;
  private twelvedataSlots: WsSlotManager | null = null;
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
    this.registry.register(this.fmp);
    this.registry.register(this.alphavantage);
    this.registry.register(this.polygon);
    this.registry.register(this.ecb);
    this.registry.register(this.bigpara);
    this.registry.register(this.isyatirim);
    this.registry.register(this.tcmbEvds);
    this.registry.register(this.biquote);
    this.registry.register(this.tvScanner);
  }

  /** Bulk BIST scanner/table data via TradingView's public Screener
   * backend (scanner.tradingview.com) -- a different endpoint from the
   * per-symbol tradingview-twc quote socket, deliberately never wired
   * into fallbackChainFor() so it can never displace an official/
   * reliable per-symbol quote source. Circuit-breaker protected: if
   * scanner.tradingview.com starts failing (e.g. blocked on Render the
   * way the WS socket was), providerHealth opens the breaker after 3
   * consecutive failures and this returns the last good cache (or [])
   * with zero further network attempts until the 30s cooldown elapses. */
  async getBistScannerRows(): Promise<BistScanRow[]> {
    if (this.bistScanCache && Date.now() - this.bistScanCache.fetchedAt < this.BIST_SCAN_TTL_MS) {
      return this.bistScanCache.rows;
    }
    const rows = await providerHealth.attempt('tradingview-scanner', () => this.tvScanner.scanBist());
    if (rows) {
      this.bistScanCache = { rows, fetchedAt: Date.now() };
      return rows;
    }
    return this.bistScanCache?.rows ?? [];
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
    if (!FLAGS.startupStreams) {
      console.log('[market-hub] ENABLE_STARTUP_STREAMS=false -- staying in pure REST-fallback mode, no WS connections attempted');
      return;
    }

    await Promise.allSettled([
      FLAGS.binanceStreams ? this.binance.connect() : Promise.resolve(),
      FLAGS.binanceFuturesStreams ? this.binanceFutures.connect() : Promise.resolve(),
      FLAGS.tradingView && FLAGS.tradingViewStreams ? this.tv.connect() : Promise.resolve(),
    ]);

    const cryptoSymbols = SYMBOL_CATALOG.filter((s) => s.category === 'crypto').map((s) => s.symbol);
    if (FLAGS.binanceStreams) {
      await this.subscribeStartupPriority('Binance', async () => {
        await this.binance.subscribe(cryptoSymbols, (quote) => this.handleTick(quote));
        console.log(`[market-hub] subscribed ${cryptoSymbols.length} crypto symbols via Binance (all, real WS)`);
      });
    } else {
      console.log('[market-hub] ENABLE_BINANCE_STREAMS=false -- crypto quotes will use REST fallback only');
    }

    const futuresSymbols = SYMBOL_CATALOG.filter((s) => s.category === 'crypto_futures').map((s) => s.symbol);
    if (FLAGS.binanceFuturesStreams) {
      await this.subscribeStartupPriority('Binance Futures', async () => {
        await this.binanceFutures.subscribe(futuresSymbols, (quote) => this.handleTick(quote));
        console.log(`[market-hub] subscribed ${futuresSymbols.length} futures symbols via Binance Futures (all, real WS)`);
      });
    } else {
      console.log('[market-hub] ENABLE_BINANCE_FUTURES_STREAMS=false -- crypto futures quotes will use REST fallback only');
    }

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
    // TV becomes reachable again. ENABLE_TRADINGVIEW=false disables it
    // outright (e.g. once you've confirmed it's permanently blocked and
    // don't want the connection attempt at all).
    if (FLAGS.tradingView && FLAGS.tradingViewStreams) {
      await this.subscribeStartupPriority('TradingView', async () => {
        await this.tv.subscribe(prioritySymbols, this.tvTickListener);
        prioritySymbols.forEach((s) => this.tvRefCounts.set(s, (this.tvRefCounts.get(s) ?? 0) + 1));
        console.log(
          `[market-hub] subscribed ${prioritySymbols.length} priority symbols via TradingView (experimental); ` +
            `${SYMBOL_CATALOG.length - cryptoSymbols.length - prioritySymbols.length} more available on-demand / via REST fallback`,
        );
      });
    } else {
      console.log('[market-hub] TradingView streaming disabled (ENABLE_TRADINGVIEW/ENABLE_TRADINGVIEW_STREAMS=false)');
    }

    // Finnhub's free tier includes a genuine real-time trade WebSocket
    // (not a scrape, not IP-blocked the way TradingView's unofficial
    // socket is) -- a real, legal, no-cost upgrade for the US-listed
    // symbols it actually covers. Smart rotation (WsSlotManager)
    // seeds the connection with the most-liquid static symbols at boot;
    // subscribeDynamic() promotes watchlist/visible/current symbols over
    // that static fill as real users ask for them. Skipped entirely if
    // no key is set.
    if (process.env.FINNHUB_API_KEY) {
      const finnhubPool = SYMBOL_CATALOG.filter((s) => s.category === 'us_stock' || s.category === 'etf').map((s) => s.symbol);
      this.finnhubSlots = new WsSlotManager(FINNHUB_WS_CAPACITY, finnhubPool);
      const seeded = this.finnhubSlots.seedFill();
      await this.subscribeStartupPriority('Finnhub', async () => {
        await this.finnhub.subscribe(seeded, this.finnhubTickListener);
        console.log(`[market-hub] subscribed ${seeded.length} us_stock/etf symbols via Finnhub (free tier, real WS, smart rotation)`);
      });
    } else {
      console.log('[market-hub] FINNHUB_API_KEY not set -- skipping free real-time Finnhub WS for us_stock/etf');
    }

    // TwelveData's Basic 8 plan: exactly 1 WS connection, 8 symbol
    // credits total. Seeded with the most-liquid forex/commodity/index
    // priority symbols, same smart-rotation contract as Finnhub above --
    // subscribeDynamic() promotes watchlist/visible/current symbols over
    // the static fill. Never spammed with the full ~100+ symbol catalog
    // for these categories, only ever up to TWELVEDATA_WS_CAPACITY.
    if (process.env.TWELVEDATA_API_KEY) {
      const twelvedataPool = SYMBOL_CATALOG.filter(
        (s) => s.category === 'forex' || s.category === 'commodity' || s.category === 'index',
      ).map((s) => s.symbol);
      this.twelvedataSlots = new WsSlotManager(TWELVEDATA_WS_CAPACITY, twelvedataPool);
      const seeded = this.twelvedataSlots.seedFill();
      await this.subscribeStartupPriority('TwelveData', async () => {
        await this.twelvedata.subscribe(seeded, this.twelvedataTickListener);
        console.log(`[market-hub] subscribed ${seeded.length} forex/commodity/index symbols via TwelveData (Basic 8, 1 WS conn, smart rotation)`);
      });
    } else {
      console.log('[market-hub] TWELVEDATA_API_KEY not set -- skipping TwelveData WS for forex/commodity/index');
    }
  }

  /** Called when a client wants live streaming for symbols outside the
   * default priority set (e.g. viewing a category page or a watchlist
   * item). Ref-counted so multiple clients sharing interest in a symbol
   * don't cause duplicate subscribe/unsubscribe churn. */
  subscribeDynamic(symbols: string[]): void {
    const crypto = symbols.filter((s) => this.findDef(s)?.category === 'crypto');
    const futures = symbols.filter((s) => this.findDef(s)?.category === 'crypto_futures');
    const finnhubEligible = symbols.filter((s) => {
      const cat = this.findDef(s)?.category;
      return this.finnhubSlots && (cat === 'us_stock' || cat === 'etf');
    });
    const twelvedataEligible = symbols.filter((s) => {
      const cat = this.findDef(s)?.category;
      return this.twelvedataSlots && (cat === 'forex' || cat === 'commodity' || cat === 'index');
    });
    const nonStreamed = symbols.filter((s) => {
      const cat = this.findDef(s)?.category;
      // Unknown symbols (no catalog/discovered def) are rejected here
      // rather than forwarded to TradingView - otherwise a client could
      // subscribe arbitrary strings that unsubscribeDynamic then skips
      // (it also requires `def`), leaking ref-count entries forever.
      if (cat === undefined || cat === 'crypto' || cat === 'crypto_futures') return false;
      // us_stock/etf symbols that Finnhub's slot manager can serve, and
      // forex/commodity/index symbols TwelveData's slot manager can
      // serve, don't also need a TradingView slot -- watchlist/visible/
      // current symbols get priority over the static TV priority list.
      if (this.finnhubSlots && (cat === 'us_stock' || cat === 'etf')) return false;
      if (this.twelvedataSlots && (cat === 'forex' || cat === 'commodity' || cat === 'index')) return false;
      return true;
    });

    // Catalog crypto/futures are already subscribed at startup;
    // subscribe() dedupes internally, so this is a no-op for those and
    // only actually opens a new stream for symbols discovered dynamically
    // after boot.
    if (crypto.length > 0 && FLAGS.binanceStreams) {
      this.binance.subscribe(crypto, (quote) => this.handleTick(quote)).catch((err) => {
        console.error('[market-hub] dynamic Binance subscribe failed:', err instanceof Error ? err.message : err);
      });
    }
    if (futures.length > 0 && FLAGS.binanceFuturesStreams) {
      this.binanceFutures.subscribe(futures, (quote) => this.handleTick(quote)).catch((err) => {
        console.error('[market-hub] dynamic Binance Futures subscribe failed:', err instanceof Error ? err.message : err);
      });
    }

    if (finnhubEligible.length > 0 && this.finnhubSlots) {
      const { toAdd, toEvict } = this.finnhubSlots.requestSlots(finnhubEligible);
      if (toEvict.length > 0) void this.finnhub.unsubscribe(toEvict);
      if (toAdd.length > 0) {
        this.finnhub.subscribe(toAdd, this.finnhubTickListener).catch((err) => {
          console.error('[market-hub] dynamic Finnhub subscribe failed:', err instanceof Error ? err.message : err);
        });
      }
    }

    if (twelvedataEligible.length > 0 && this.twelvedataSlots) {
      const { toAdd, toEvict } = this.twelvedataSlots.requestSlots(twelvedataEligible);
      if (toEvict.length > 0) void this.twelvedata.unsubscribe(toEvict);
      if (toAdd.length > 0) {
        this.twelvedata.subscribe(toAdd, this.twelvedataTickListener).catch((err) => {
          console.error('[market-hub] dynamic TwelveData subscribe failed:', err instanceof Error ? err.message : err);
        });
      }
    }

    if (nonStreamed.length > 0 && FLAGS.tradingView && FLAGS.tradingViewStreams) {
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
  }

  /** Releases interest registered via subscribeDynamic. Priority symbols
   * are never actually dropped from the live socket even at ref count 0. */
  unsubscribeDynamic(symbols: string[]): void {
    const finnhubEligible: string[] = [];
    const twelvedataEligible: string[] = [];
    const tvEligible: string[] = [];
    for (const symbol of symbols) {
      const def = this.findDef(symbol);
      if (!def || def.category === 'crypto' || def.category === 'crypto_futures') continue;
      if (this.finnhubSlots && (def.category === 'us_stock' || def.category === 'etf')) {
        finnhubEligible.push(symbol);
      } else if (this.twelvedataSlots && (def.category === 'forex' || def.category === 'commodity' || def.category === 'index')) {
        twelvedataEligible.push(symbol);
      } else {
        tvEligible.push(symbol);
      }
    }

    if (finnhubEligible.length > 0 && this.finnhubSlots) {
      const { toRemove, toBackfill } = this.finnhubSlots.releaseSlots(finnhubEligible);
      if (toRemove.length > 0) void this.finnhub.unsubscribe(toRemove);
      if (toBackfill.length > 0) {
        this.finnhub.subscribe(toBackfill, this.finnhubTickListener).catch((err) => {
          console.error('[market-hub] Finnhub backfill subscribe failed:', err instanceof Error ? err.message : err);
        });
      }
    }

    if (twelvedataEligible.length > 0 && this.twelvedataSlots) {
      const { toRemove, toBackfill } = this.twelvedataSlots.releaseSlots(twelvedataEligible);
      if (toRemove.length > 0) void this.twelvedata.unsubscribe(toRemove);
      if (toBackfill.length > 0) {
        this.twelvedata.subscribe(toBackfill, this.twelvedataTickListener).catch((err) => {
          console.error('[market-hub] TwelveData backfill subscribe failed:', err instanceof Error ? err.message : err);
        });
      }
    }

    const toUnsubscribe: string[] = [];
    for (const symbol of tvEligible) {
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

    for (const step of this.fallbackChainFor(def)) {
      const quote = await providerHealth.attempt(step.providerId, step.fetch);
      if (quote?.price != null) return { ...quote, status: this.computeStatus(quote) };
    }
    return null;
  }

  /** Per-category provider priority, in the exact order requested:
   * crypto/futures are Binance-only (real WS + REST); every other
   * category tries the lowest-latency source it actually has first:
   * (1) true WebSocket real-time, (2) near-live public endpoint,
   * (3) fast REST quote, (4) delayed REST, (5) daily/reference fallback.
   * TradingView's unofficial socket is real-time (tier 1) when reachable,
   * but is demoted below tier-2/3 sources in every non-BIST/non-crypto
   * category because it has a *confirmed* Render reliability problem
   * (HTTP 451, Cloudflare blocking the shared outbound IP range) --
   * ranking it above official/legal sources that don't share that risk
   * would violate the "never put delayed providers before live providers"
   * rule the moment TV silently drops back to REST fallback anyway. It's
   * skipped outright when ENABLE_TRADINGVIEW=false. Each step is wrapped
   * by providerHealth so a provider that's tripped its circuit breaker is
   * skipped instantly, no wasted network round-trip.
   *
   * NOT implemented (would require net-new integrations beyond this
   * pass's scope, tracked separately rather than faked): OKX/Bybit/
   * KuCoin/Coinbase/CoinGecko/CoinCap/MEXC crypto fallbacks, iTick,
   * Stooq. Crypto already has a true real-time WS primary (Binance) so
   * their absence doesn't currently create a gap; forex/commodity/index
   * would benefit from iTick WS and Stooq REST if added later. */
  private fallbackChainFor(def: SymbolDef): { providerId: string; fetch: () => Promise<Quote | null> }[] {
    const sym = def.symbol;
    const finnhub = { providerId: 'finnhub', fetch: () => this.finnhub.getQuote(sym) };
    const twelvedata = { providerId: 'twelvedata', fetch: () => this.twelvedata.getQuote(sym) };
    const fmp = { providerId: 'fmp', fetch: () => this.fmp.getQuote(sym) };
    const polygon = { providerId: 'polygon', fetch: () => this.polygon.getQuote(sym) };
    const alphavantage = { providerId: 'alphavantage', fetch: () => this.alphavantage.getQuote(sym) };
    const ecb = { providerId: 'ecb', fetch: () => this.ecb.getQuote(sym) };
    const tcmbEvds = { providerId: 'tcmb-evds', fetch: () => this.tcmbEvds.getQuote(sym) };
    const biquote = { providerId: 'biquote', fetch: () => this.biquote.getQuote(sym) };
    const bigpara = { providerId: 'bigpara', fetch: () => this.bigpara.getQuote(sym) };
    const isyatirim = { providerId: 'isyatirim', fetch: () => this.isyatirim.getQuote(sym) };
    const tradingview = FLAGS.tradingView ? [{ providerId: 'tradingview-twc', fetch: () => this.tv.getQuote(sym) }] : [];
    const yahoo = def.yahooSymbol ? [{ providerId: 'yahoo', fetch: () => this.yahoo.getQuote(def.yahooSymbol!) }] : [];

    switch (def.category) {
      case 'crypto':
        // Tier 1 only: Binance's public WS is genuinely real-time, free,
        // and stable -- no REST fallback layer currently beats it, so
        // none is chained (see NOT-implemented note above).
        return [{ providerId: 'binance', fetch: () => this.binance.getQuote(sym) }];
      case 'crypto_futures':
        return [{ providerId: 'binance-futures', fetch: () => this.binanceFutures.getQuote(sym) }];
      case 'us_stock':
      case 'etf':
        // Finnhub (tier 1, real WS) -> Massive/Polygon if a working key
        // exists (tier 1/3, currently a no-op: no free tier as of 2026,
        // see polygon.provider.ts) -> FMP (tier 4) -> TwelveData (tier 4)
        // -> Yahoo (tier 4, delayed) -> TradingView (tier 1 but Render-
        // risky, demoted) -> Alpha Vantage (tier 4, 25/day last resort).
        return [finnhub, polygon, fmp, twelvedata, ...yahoo, ...tradingview, alphavantage];
      case 'forex':
        // Finnhub (tier 1) -> TwelveData (tier 1 WS for priority symbols
        // via subscribeDynamic, tier 3 REST here) -> FMP (tier 4) ->
        // BiQuote if explicitly enabled (tier 2, gated) -> TradingView
        // (tier 1 but Render-risky, demoted) -> ECB/TCMB (tier 5, daily
        // reference only) -> Yahoo (tier 4) -> Alpha Vantage (last resort).
        return [finnhub, twelvedata, fmp, biquote, ...tradingview, ecb, tcmbEvds, ...yahoo, alphavantage];
      case 'commodity':
        // TwelveData (tier 1 WS/tier 3 REST) -> Finnhub (tier 4, not
        // officially covered but harmless if it returns nothing) -> FMP
        // (tier 4) -> BiQuote if enabled (tier 2) -> TradingView (tier 1
        // but demoted) -> Yahoo (tier 4) -> Alpha Vantage (last resort).
        return [twelvedata, finnhub, fmp, biquote, ...tradingview, ...yahoo, alphavantage];
      case 'index':
        // TwelveData (tier 1/3) -> Finnhub -> FMP (tier 4) -> Yahoo
        // (tier 4) -> TradingView (tier 1 but demoted to last since this
        // category wasn't given an explicit TV fallback slot).
        return [twelvedata, finnhub, fmp, ...yahoo, ...tradingview];
      case 'bist':
        // BIST realtime depth/AKD/takas has no free path at all (see
        // bist-institutional.provider.ts). For last-price quotes:
        // bigpara (tier 2, near-live public frontend snapshot) ->
        // isyatirim (tier 4, daily public frontend OHLC) -> Yahoo (tier
        // 4, delayed) -> TradingView (tier 1 but Render-risky, "only if
        // it works") -> TwelveData/FMP (tier 4, no real BIST coverage,
        // harmless last-resort no-ops).
        return [bigpara, isyatirim, ...yahoo, ...tradingview, twelvedata, fmp];
      default:
        return [];
    }
  }

  /** Picks the right live provider for a symbol's category and fetches
   * its recent candle history. Shared by the /candles REST route and the
   * scanner's on-demand indicator computation. */
  async getCandlesFor(def: SymbolDef, interval: CandleInterval, limit = 200) {
    if (def.category === 'bist') {
      // TradingView's unofficial socket is Render-blocked (451); isyatirim
      // (public, unauthenticated, daily OHLC) is the working fallback.
      const candles = await this.isyatirim.getCandles(def.symbol, interval, limit);
      if (candles.length > 0) return { candles, providerId: 'isyatirim' };
      const tvCandles = await this.tv.getCandles(def.symbol, interval, limit);
      return { candles: tvCandles, providerId: 'tradingview-twc' };
    }
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

  /** Backs /api/provider-diagnostics: per-provider health check (config
   * state, last latency) plus circuit-breaker state (open/closed,
   * consecutive failures, last error) so a developer can see exactly why
   * a category is degraded without digging through server logs. Normal
   * users never see this -- the frontend only surfaces it in debug mode. */
  async providerDiagnostics() {
    const [health, breakers] = await Promise.all([this.healthSnapshot(), Promise.resolve(providerHealth.allSnapshots())]);
    const breakerByProvider = new Map(breakers.map((b) => [b.provider, b]));
    return {
      providers: health.map((h) => ({ ...h, circuit: breakerByProvider.get(h.provider) ?? null })),
      flags: FLAGS,
      finnhub: this.finnhubSlots
        ? { configured: true, capacity: FINNHUB_WS_CAPACITY }
        : { configured: false, capacity: FINNHUB_WS_CAPACITY },
      twelvedata: this.twelvedataSlots
        ? { configured: true, capacity: TWELVEDATA_WS_CAPACITY }
        : { configured: false, capacity: TWELVEDATA_WS_CAPACITY },
    };
  }

  categories(): MarketCategory[] {
    return ['crypto', 'crypto_futures', 'forex', 'commodity', 'bist', 'us_stock', 'etf', 'index'];
  }
}
