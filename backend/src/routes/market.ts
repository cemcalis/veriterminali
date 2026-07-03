import { Router } from 'express';
import type { MarketHub } from '../market-hub.js';
import type { MarketCategory, CandleInterval } from '../../../src/providers/market-provider.interface.js';

const VALID_INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export function marketRouter(hub: MarketHub) {
  const router = Router();

  router.get('/symbols', (req, res) => {
    const category = req.query.category as MarketCategory | undefined;
    const all = hub.fullCatalog();
    res.json({ symbols: category ? all.filter((s) => s.category === category) : all });
  });

  /** Local + dynamic symbol search. Always checks the local catalog
   * first (instant); only reaches out to live providers when nothing
   * matches locally, so the app feels like it can search any real
   * instrument without a slow round-trip for common tickers. */
  router.get('/search', async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 1) return res.json({ results: [], discovered: false });

    const local = hub.searchLocal(q, 20);
    if (local.length > 0) return res.json({ results: local, discovered: false });

    if (q.length < 2) return res.json({ results: [], discovered: false });
    try {
      const found = await hub.searchDynamic(q);
      res.json({ results: found, discovered: true });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'search failed', results: [] });
    }
  });

  router.get('/quote/:symbol', async (req, res) => {
    const symbol = decodeURIComponent(req.params.symbol);
    const def = hub.findDef(symbol);
    if (!def) return res.status(404).json({ error: 'unknown symbol' });
    const quote = await hub.getQuoteWithFallback(def);
    if (!quote) return res.status(502).json({ error: 'no provider returned data for this symbol' });
    res.json({ quote });
  });

  router.get('/quotes', async (_req, res) => {
    res.json({ quotes: hub.allLatest() });
  });

  router.get('/candles/:symbol', async (req, res) => {
    const symbol = decodeURIComponent(req.params.symbol);
    const interval = (req.query.interval as CandleInterval) ?? '5m';
    if (!VALID_INTERVALS.includes(interval)) {
      return res.status(400).json({ error: `interval must be one of ${VALID_INTERVALS.join(', ')}` });
    }
    const def = hub.findDef(symbol);
    if (!def) return res.status(404).json({ error: 'unknown symbol' });

    try {
      const { candles, providerId } = await hub.getCandlesFor(def, interval, 200);
      const provider = hub.registry.get(providerId);
      res.json({ candles, provider: providerId, experimental: provider?.experimental ?? false });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'candle fetch failed' });
    }
  });

  router.get('/health', async (_req, res) => {
    const health = await hub.healthSnapshot();
    res.json({ providers: health });
  });

  return router;
}
