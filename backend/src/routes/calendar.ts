import { Router } from 'express';
import { MACRO_CALENDAR } from '../../../src/data/economic-calendar.js';
import { getExpectedDisclosures } from '../../../src/providers/kap-client.js';

const EARNINGS_CACHE_TTL_MS = 60 * 60 * 1000; // expected-disclosure dates move rarely; hourly is plenty
const earningsCache = new Map<string, { items: unknown[]; cachedAt: number }>();

export function calendarRouter() {
  const router = Router();

  /** Central-bank macro calendar (TCMB/Fed) -- see src/data/economic-calendar.ts */
  router.get('/economic', (req, res) => {
    const from = String(req.query.from ?? '');
    const to = String(req.query.to ?? '');
    let events = MACRO_CALENDAR;
    if (from) events = events.filter((e) => e.date >= from);
    if (to) events = events.filter((e) => e.date <= to);
    res.json({ events });
  });

  /** Real live earnings/expected-disclosure calendar from KAP for one symbol. */
  router.get('/earnings/:symbol', async (req, res) => {
    const symbol = decodeURIComponent(req.params.symbol);
    const cached = earningsCache.get(symbol);
    if (cached && Date.now() - cached.cachedAt < EARNINGS_CACHE_TTL_MS) {
      return res.json({ events: cached.items, cached: true });
    }
    try {
      const events = await getExpectedDisclosures(symbol);
      earningsCache.set(symbol, { items: events, cachedAt: Date.now() });
      res.json({ events, cached: false });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'KAP calendar fetch failed', events: [] });
    }
  });

  return router;
}
