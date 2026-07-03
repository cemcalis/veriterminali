import { Router } from 'express';
import type { MarketHub } from '../market-hub.js';
import { SYMBOL_CATALOG, findSymbol, symbolsByCategory } from '../../../src/symbols.js';
import type { MarketCategory, CandleInterval } from '../../../src/providers/market-provider.interface.js';

const VALID_INTERVALS: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export function marketRouter(hub: MarketHub) {
  const router = Router();

  router.get('/symbols', (req, res) => {
    const category = req.query.category as MarketCategory | undefined;
    res.json({ symbols: category ? symbolsByCategory(category) : SYMBOL_CATALOG });
  });

  router.get('/quote/:symbol', async (req, res) => {
    const symbol = decodeURIComponent(req.params.symbol);
    const def = findSymbol(symbol);
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
    const def = findSymbol(symbol);
    if (!def) return res.status(404).json({ error: 'unknown symbol' });

    try {
      const provider = def.category === 'crypto' ? hub.registry.get('binance')! : hub.registry.get('tradingview-twc')!;
      const candles = await provider.getCandles(symbol, interval, 200);
      res.json({ candles, provider: provider.id, experimental: provider.experimental });
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
