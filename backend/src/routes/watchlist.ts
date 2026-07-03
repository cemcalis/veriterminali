import { Router } from 'express';
import { fileURLToPath } from 'node:url';
import { JsonStore } from '../store/json-store.js';

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
}

/** Cross-device persistent watchlist. Single shared list for now, matching
 * the existing portfolio/alerts routes (no auth/user-scoping exists yet
 * anywhere in the backend) -- still solves the actual problem (a device
 * switch no longer loses your list), without inventing new auth plumbing
 * the rest of the app doesn't have. */
export function watchlistRouter() {
  const router = Router();
  const store = new JsonStore<WatchlistItem[]>(
    fileURLToPath(new URL('../../data/watchlist.json', import.meta.url)),
    [],
  );

  router.get('/', (_req, res) => {
    res.json({ items: store.read() });
  });

  router.post('/', (req, res) => {
    const { symbol } = req.body ?? {};
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'symbol is required' });
    }
    const items = store.write((data) =>
      data.some((i) => i.symbol === symbol) ? data : [...data, { symbol, addedAt: Date.now() }],
    );
    res.status(201).json({ items });
  });

  router.delete('/:symbol', (req, res) => {
    const items = store.write((data) => data.filter((i) => i.symbol !== req.params.symbol));
    res.json({ items });
  });

  return router;
}
