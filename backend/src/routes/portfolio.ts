import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JsonStore } from '../store/json-store.js';
import type { MarketHub } from '../market-hub.js';
import { findSymbol } from '../../../src/symbols.js';

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  createdAt: number;
}

export function portfolioRouter(hub: MarketHub) {
  const router = Router();
  const store = new JsonStore<Position[]>(
    fileURLToPath(new URL('../../data/portfolio.json', import.meta.url)),
    [],
  );

  router.get('/', async (_req, res) => {
    const positions = store.read();
    const enriched = await Promise.all(
      positions.map(async (p) => {
        const def = findSymbol(p.symbol);
        const quote = def ? await hub.getQuoteWithFallback(def) : null;
        const price = quote?.price ?? null;
        const marketValue = price !== null ? price * p.quantity : null;
        const costBasis = p.avgCost * p.quantity;
        const pnl = marketValue !== null ? marketValue - costBasis : null;
        const pnlPercent = pnl !== null && costBasis !== 0 ? (pnl / costBasis) * 100 : null;
        return { ...p, currentPrice: price, marketValue, costBasis, pnl, pnlPercent };
      }),
    );
    res.json({ positions: enriched });
  });

  router.post('/', (req, res) => {
    const { symbol, quantity, avgCost } = req.body ?? {};
    if (!symbol || typeof quantity !== 'number' || typeof avgCost !== 'number') {
      return res.status(400).json({ error: 'symbol, quantity, avgCost are required' });
    }
    const position: Position = { id: randomUUID(), symbol, quantity, avgCost, createdAt: Date.now() };
    const positions = store.write((data) => [...data, position]);
    res.status(201).json({ positions });
  });

  router.delete('/:id', (req, res) => {
    const positions = store.write((data) => data.filter((p) => p.id !== req.params.id));
    res.json({ positions });
  });

  return router;
}
