import { Router } from 'express';
import { getDisclosures } from '../../../src/providers/kap-client.js';
import { classifyDisclosure } from '../../../src/providers/kap-classifier.js';

const CACHE_TTL_MS = 3 * 60 * 1000; // KAP itself republishes roughly every 3 minutes
const cache = new Map<string, { items: unknown[]; cachedAt: number }>();

/** Real KAP (Kamuyu Aydınlatma Platformu) disclosures per symbol -- free,
 * public, no API key. See src/providers/kap-client.ts for the endpoints. */
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
      const items = disclosures.map((d) => ({ ...d, category: classifyDisclosure(d.title) }));
      cache.set(symbol, { items, cachedAt: Date.now() });
      res.json({ items, cached: false });
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'KAP fetch failed', items: [] });
    }
  });

  return router;
}
