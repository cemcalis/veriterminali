import { Router } from 'express';
import type { MarketHub } from '../market-hub.js';
import { computeIndicators } from '../../../src/indicators/index.js';
import type { MarketCategory, Quote } from '../../../src/providers/market-provider.interface.js';

interface ScannerRow {
  symbol: string;
  category: MarketCategory;
  displayNameTr: string;
  quote: Quote;
  rsi14: number | null;
}

const INDICATOR_TTL_MS = 60_000;
const MAX_INDICATOR_LOOKUPS = 40;
const indicatorCache = new Map<string, { rsi14: number | null; computedAt: number }>();

/** Live catalog scanner: filters/sorts the full symbol catalog by price
 * change, volume, and (optionally) RSI. Cheap filters run first over the
 * already-live in-memory quote cache (no network call); RSI is only
 * fetched for the surviving candidate set, and only when actually
 * requested, to avoid pulling candle history for 1000+ symbols on every
 * request. */
export function scannerRouter(hub: MarketHub) {
  const router = Router();

  router.get('/', async (req, res) => {
    const category = req.query.category as MarketCategory | undefined;
    const minChangePercent = req.query.minChangePercent ? Number(req.query.minChangePercent) : undefined;
    const maxChangePercent = req.query.maxChangePercent ? Number(req.query.maxChangePercent) : undefined;
    const minVolume = req.query.minVolume ? Number(req.query.minVolume) : undefined;
    const rsiFilter = req.query.rsi as 'oversold' | 'overbought' | undefined;
    const sort = (req.query.sort as string) ?? 'changePercent';
    const direction = req.query.direction === 'asc' ? 1 : -1;
    const limit = Math.min(Number(req.query.limit ?? 50), 200);

    const catalog = hub.fullCatalog();
    const byCategory = category ? catalog.filter((s) => s.category === category) : catalog;

    // BIST only: fill any symbol the live in-memory quote cache doesn't
    // have yet (most of the ~200-symbol catalog, since only a priority
    // subset streams live) from TradingView's bulk scanner endpoint --
    // table/scanner data only, never used for single-symbol quote routes.
    const bistScanMap =
      category === 'bist'
        ? new Map((await hub.getBistScannerRows()).map((r) => [r.symbol, r]))
        : null;

    let candidates = byCategory
      .map((def) => {
        const live = hub.getLatest(def.symbol);
        if (live) return { def, quote: live };
        const scanned = bistScanMap?.get(def.symbol);
        if (scanned && scanned.price != null) {
          const quote: Quote = {
            symbol: def.symbol,
            price: scanned.price,
            change: scanned.change,
            changePercent: scanned.changePercent,
            volume: scanned.volume,
            timestamp: Date.now(),
            provider: 'tradingview-scanner',
            delayed: false,
            experimental: true,
            status: 'near-live',
          };
          return { def, quote };
        }
        return { def, quote: undefined };
      })
      .filter((row): row is { def: (typeof byCategory)[number]; quote: Quote } => !!row.quote && row.quote.price !== null);

    if (minChangePercent !== undefined) {
      candidates = candidates.filter((r) => (r.quote.changePercent ?? -Infinity) >= minChangePercent);
    }
    if (maxChangePercent !== undefined) {
      candidates = candidates.filter((r) => (r.quote.changePercent ?? Infinity) <= maxChangePercent);
    }
    if (minVolume !== undefined) {
      candidates = candidates.filter((r) => (r.quote.volume ?? 0) >= minVolume);
    }

    let rows: ScannerRow[] = candidates.map((r) => ({
      symbol: r.def.symbol,
      category: r.def.category,
      displayNameTr: r.def.displayNameTr,
      quote: r.quote,
      rsi14: null,
    }));

    if (rsiFilter) {
      // RSI needs candle history, which needs a network round-trip per
      // symbol -- only compute it for a bounded top-N slice (pre-sorted by
      // volume so the most liquid/relevant names are evaluated first),
      // never for the whole catalog.
      const preSorted = [...rows].sort((a, b) => (b.quote.volume ?? 0) - (a.quote.volume ?? 0)).slice(0, MAX_INDICATOR_LOOKUPS);
      const withRsi = await Promise.all(
        preSorted.map(async (row) => {
          const cached = indicatorCache.get(row.symbol);
          if (cached && Date.now() - cached.computedAt < INDICATOR_TTL_MS) {
            return { ...row, rsi14: cached.rsi14 };
          }
          const def = hub.findDef(row.symbol);
          if (!def) return row;
          try {
            const { candles } = await hub.getCandlesFor(def, '1d', 60);
            const { rsi14 } = computeIndicators(candles);
            indicatorCache.set(row.symbol, { rsi14, computedAt: Date.now() });
            return { ...row, rsi14 };
          } catch {
            return row;
          }
        }),
      );
      rows = withRsi.filter((r) =>
        rsiFilter === 'oversold' ? r.rsi14 !== null && r.rsi14 <= 30 : r.rsi14 !== null && r.rsi14 >= 70,
      );
    }

    rows.sort((a, b) => {
      const av = sort === 'volume' ? (a.quote.volume ?? 0) : sort === 'price' ? (a.quote.price ?? 0) : (a.quote.changePercent ?? 0);
      const bv = sort === 'volume' ? (b.quote.volume ?? 0) : sort === 'price' ? (b.quote.price ?? 0) : (b.quote.changePercent ?? 0);
      return (av - bv) * direction;
    });

    res.json({ rows: rows.slice(0, limit), total: rows.length });
  });

  return router;
}
