import { Router } from 'express';
import { getDisclosures } from '../../../src/providers/kap-client.js';
import { classifyDisclosure } from '../../../src/providers/kap-classifier.js';
import type { MarketHub } from '../market-hub.js';

const CORPORATE_ACTION_CATEGORIES = new Set(['temettu', 'sermaye_artirimi', 'birlesme_devralma']);
const CACHE_TTL_MS = 3 * 60 * 1000;
const cache = new Map<string, { items: unknown[]; cachedAt: number }>();

/** Corporate actions (dividends, capital increases, mergers) filtered
 * from the same real KAP disclosure feed used by news.ts -- classified
 * by kap-classifier.ts. Precise ex-date/ratio parsing per disclosure
 * type is not attempted here (KAP filings are unstructured per-company
 * documents); instead this surfaces the real, sourced announcement so a
 * portfolio holder is notified and can review the actual filing, rather
 * than silently computing a cost-basis adjustment that might be wrong. */
async function fetchCorporateActions(symbol: string) {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.items;

  const disclosures = await getDisclosures(symbol, 40);
  const items = disclosures
    .map((d) => ({ ...d, category: classifyDisclosure(d.title) }))
    .filter((d) => CORPORATE_ACTION_CATEGORIES.has(d.category));
  cache.set(symbol, { items, cachedAt: Date.now() });
  return items;
}

export function corporateActionsRouter(hub: MarketHub) {
  const router = Router();

  router.get('/:symbol', async (req, res) => {
    const symbol = decodeURIComponent(req.params.symbol);
    try {
      res.json({ items: await fetchCorporateActions(symbol) });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'KAP fetch failed', items: [] });
    }
  });

  /** Cross-references the caller's held symbols (from ?symbols=A,B,C)
   * against fresh corporate-action announcements, so the portfolio page
   * can show one honest "review your cost basis" notice instead of
   * silently mutating positions. */
  router.get('/', async (req, res) => {
    const symbols = String(req.query.symbols ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && hub.findDef(s)?.category === 'bist');
    const results = await Promise.all(
      symbols.map(async (symbol) => ({ symbol, items: await fetchCorporateActions(symbol).catch(() => []) })),
    );
    res.json({ bySymbol: results.filter((r) => r.items.length > 0) });
  });

  return router;
}
