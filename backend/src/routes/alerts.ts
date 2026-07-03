import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JsonStore } from '../store/json-store.js';
import type { MarketHub } from '../market-hub.js';

export type AlertMetric = 'price' | 'changePercent' | 'volume';

export interface Alert {
  id: string;
  symbol: string;
  metric: AlertMetric;
  direction: 'above' | 'below';
  targetPrice: number;
  createdAt: number;
  triggeredAt: number | null;
  telegramChatId?: string;
}

export function alertsRouter(hub: MarketHub) {
  const router = Router();
  const store = new JsonStore<Alert[]>(
    fileURLToPath(new URL('../../data/alerts.json', import.meta.url)),
    [],
  );

  router.get('/', (_req, res) => {
    res.json({ alerts: store.read() });
  });

  router.post('/', (req, res) => {
    const { symbol, direction, targetPrice, telegramChatId, metric } = req.body ?? {};
    if (!symbol || !['above', 'below'].includes(direction) || typeof targetPrice !== 'number') {
      return res.status(400).json({ error: 'symbol, direction (above|below), targetPrice are required' });
    }
    const resolvedMetric: AlertMetric = ['price', 'changePercent', 'volume'].includes(metric) ? metric : 'price';
    const alert: Alert = {
      id: randomUUID(),
      symbol,
      metric: resolvedMetric,
      direction,
      targetPrice,
      createdAt: Date.now(),
      triggeredAt: null,
      telegramChatId,
    };
    const alerts = store.write((data) => [...data, alert]);
    res.status(201).json({ alerts });
  });

  router.delete('/:id', (req, res) => {
    const alerts = store.write((data) => data.filter((a) => a.id !== req.params.id));
    res.json({ alerts });
  });

  /** Runs on an interval from index.ts; checks live prices against alert targets. */
  async function checkAlerts(onTrigger: (alert: Alert, price: number) => void) {
    const alerts = store.read().filter((a) => !a.triggeredAt);
    for (const alert of alerts) {
      const def = hub.findDef(alert.symbol);
      if (!def) continue;
      const quote = await hub.getQuoteWithFallback(def);
      if (quote?.price == null) continue;
      const observed =
        alert.metric === 'changePercent' ? quote.changePercent : alert.metric === 'volume' ? quote.volume : quote.price;
      if (observed == null) continue;
      const hit =
        (alert.direction === 'above' && observed >= alert.targetPrice) ||
        (alert.direction === 'below' && observed <= alert.targetPrice);
      if (hit) {
        store.write((data) =>
          data.map((a) => (a.id === alert.id ? { ...a, triggeredAt: Date.now() } : a)),
        );
        onTrigger(alert, observed);
      }
    }
  }

  return { router, checkAlerts };
}
