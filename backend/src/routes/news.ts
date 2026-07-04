import { Router } from 'express';
import { getDisclosures } from '../../../src/providers/kap-client.js';
import { classifyDisclosure } from '../../../src/providers/kap-classifier.js';
import { FmpProvider } from '../../../src/providers/fmp.provider.js';

const CACHE_TTL_MS = 3 * 60 * 1000; // KAP itself republishes roughly every 3 minutes
const cache = new Map<string, { items: unknown[]; cachedAt: number }>();
const fmp = new FmpProvider();

/** News priority: KAP disclosures for BIST symbols (free, public, no
 * key) first; for non-BIST symbols (US stocks etc, where KAP has
 * nothing) FMP's stock news is used as a fallback if FMP_API_KEY is
 * configured. Yahoo Finance news / Turkish economy RSS / crypto RSS are
 * NOT implemented in this pass (deferred, not faked) -- documented as a
 * known gap rather than left silently unmentioned. */
export function newsRouter() {
  const router = Router();

  router.get('/:symbol', async (req, res) => {
    const symbol = decodeURIComponent(req.params.symbol);
    const cached = cache.get(symbol);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return res.json({ items: cached.items, cached: true });
    }
    try {
      const disclosures = await getDisclosures(symbol, 20);
      let items: unknown[] = disclosures.map((d) => ({ ...d, category: classifyDisclosure(d.title) }));
      if (items.length === 0) {
        const fmpNews = await fmp.getNews(symbol, 20);
        items = fmpNews.map((n, i) => ({
          publishDate: n.publishedDate,
          disclosureIndex: n.url || String(i),
          title: n.title,
          url: n.url,
          category: 'diger' as const,
        }));
      }
      cache.set(symbol, { items, cachedAt: Date.now() });
      res.json({ items, cached: false });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'news fetch failed', items: [] });
    }
  });

  return router;
}
