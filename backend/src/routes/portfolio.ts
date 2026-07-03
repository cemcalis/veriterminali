import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JsonStore } from '../store/json-store.js';
import type { MarketHub } from '../market-hub.js';

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avgCost: number;
  createdAt: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'sell';
  quantity: number;
  costBasis: number;
  proceeds: number;
  realizedPnl: number;
  closedAt: number;
}

export interface EquitySnapshot {
  date: string; // YYYY-MM-DD
  totalValue: number;
}

export function portfolioRouter(hub: MarketHub) {
  const router = Router();
  const store = new JsonStore<Position[]>(
    fileURLToPath(new URL('../../data/portfolio.json', import.meta.url)),
    [],
  );
  const tradesStore = new JsonStore<Trade[]>(
    fileURLToPath(new URL('../../data/portfolio-trades.json', import.meta.url)),
    [],
  );
  const equityStore = new JsonStore<EquitySnapshot[]>(
    fileURLToPath(new URL('../../data/portfolio-equity.json', import.meta.url)),
    [],
  );

  /** Records today's total portfolio value once per calendar day (TR
   * time), building an equity curve organically from regular reads
   * instead of needing a separate cron/scheduler process. */
  async function recordSnapshotIfNeeded() {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
    const existing = equityStore.read();
    if (existing.some((s) => s.date === today)) return;
    const positions = store.read();
    let total = 0;
    for (const p of positions) {
      const def = hub.findDef(p.symbol);
      const quote = def ? await hub.getQuoteWithFallback(def) : null;
      if (quote?.price != null) total += quote.price * p.quantity;
    }
    equityStore.write((data) => [...data, { date: today, totalValue: total }]);
  }

  router.get('/', async (_req, res) => {
    void recordSnapshotIfNeeded();
    const positions = store.read();
    const enriched = await Promise.all(
      positions.map(async (p) => {
        const def = hub.findDef(p.symbol);
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

  /** Realized-P&L close: sells `quantity` of `symbol` at `price`, FIFO
   * against existing lots (oldest position first). Partially-consumed
   * lots are shrunk in place; fully-consumed lots are removed. Each
   * consumed slice becomes one Trade record with its own cost basis, so
   * realized P&L reflects the actual lots sold, not a blended average. */
  router.post('/sell', (req, res) => {
    const { symbol, quantity, price } = req.body ?? {};
    if (!symbol || typeof quantity !== 'number' || quantity <= 0 || typeof price !== 'number') {
      return res.status(400).json({ error: 'symbol, quantity (>0), price are required' });
    }

    const positions = store.read();
    const lots = positions.filter((p) => p.symbol === symbol).sort((a, b) => a.createdAt - b.createdAt);
    const available = lots.reduce((sum, l) => sum + l.quantity, 0);
    if (available < quantity) {
      return res.status(400).json({ error: `only ${available} units of ${symbol} held, cannot sell ${quantity}` });
    }

    let remaining = quantity;
    const newTrades: Trade[] = [];
    const updatedPositions = [...positions];

    for (const lot of lots) {
      if (remaining <= 0) break;
      const consumed = Math.min(lot.quantity, remaining);
      remaining -= consumed;
      const costBasis = consumed * lot.avgCost;
      const proceeds = consumed * price;
      newTrades.push({
        id: randomUUID(),
        symbol,
        side: 'sell',
        quantity: consumed,
        costBasis,
        proceeds,
        realizedPnl: proceeds - costBasis,
        closedAt: Date.now(),
      });
      const idx = updatedPositions.findIndex((p) => p.id === lot.id);
      const leftoverQty = lot.quantity - consumed;
      if (leftoverQty <= 0) {
        updatedPositions.splice(idx, 1);
      } else {
        updatedPositions[idx] = { ...lot, quantity: leftoverQty };
      }
    }

    store.write(() => updatedPositions);
    const trades = tradesStore.write((data) => [...data, ...newTrades]);
    res.status(201).json({ positions: updatedPositions, trades: newTrades, allTrades: trades });
  });

  router.get('/trades', (_req, res) => {
    res.json({ trades: tradesStore.read() });
  });

  router.get('/equity-history', async (_req, res) => {
    await recordSnapshotIfNeeded();
    res.json({ history: equityStore.read() });
  });

  return router;
}
