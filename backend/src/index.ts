import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { MarketHub } from './market-hub.js';
import { Cache } from './cache.js';
import { marketRouter } from './routes/market.js';
import { portfolioRouter } from './routes/portfolio.js';
import { alertsRouter } from './routes/alerts.js';
import { watchlistRouter } from './routes/watchlist.js';
import { scannerRouter } from './routes/scanner.js';
import { scannerPresetsRouter } from './routes/scanner-presets.js';
import { institutionalRouter } from './routes/institutional.js';
import { newsRouter } from './routes/news.js';
import { calendarRouter } from './routes/calendar.js';
import { corporateActionsRouter } from './routes/corporate-actions.js';
import { sendTelegramMessage } from './telegram.js';

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  const cache = new Cache(process.env.REDIS_URL);
  const hub = new MarketHub(cache);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/status', (_req, res) => {
    res.json({ ok: true, cacheBackend: cache.backend(), time: Date.now() });
  });

  app.use('/api/market', marketRouter(hub));
  app.use('/api/portfolio', portfolioRouter(hub));
  app.use('/api/watchlist', watchlistRouter());
  app.use('/api/scanner', scannerRouter(hub));
  app.use('/api/scanner-presets', scannerPresetsRouter());
  app.use('/api/institutional', institutionalRouter());
  app.use('/api/news', newsRouter());
  app.use('/api/calendar', calendarRouter());
  app.use('/api/corporate-actions', corporateActionsRouter(hub));
  const { router: alertsRoute, checkAlerts } = alertsRouter(hub);
  app.use('/api/alerts', alertsRoute);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Each client tracks the set of symbols it has explicitly asked to
  // stream (beyond the default priority set), so the hub can ref-count
  // dynamic tradingview-twc subscriptions and drop them once nobody is
  // watching that symbol anymore (smart batching / category-based
  // streaming / watchlist-priority streaming).
  const clientSubs = new Map<WebSocket, Set<string>>();
  wss.on('connection', (ws) => {
    clientSubs.set(ws, new Set());
    ws.send(JSON.stringify({ type: 'snapshot', quotes: hub.allLatest() }));

    ws.on('message', (raw) => {
      let msg: { type?: string; symbols?: unknown };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      const symbols = Array.isArray(msg.symbols) ? msg.symbols.filter((s): s is string => typeof s === 'string') : [];
      if (symbols.length === 0) return;
      const mine = clientSubs.get(ws);
      if (!mine) return;

      if (msg.type === 'subscribe') {
        const fresh = symbols.filter((s) => !mine.has(s));
        fresh.forEach((s) => mine.add(s));
        if (fresh.length > 0) hub.subscribeDynamic(fresh);
        const snapshot = symbols.map((s) => hub.getLatest(s)).filter((q): q is NonNullable<typeof q> => !!q);
        if (snapshot.length > 0) ws.send(JSON.stringify({ type: 'snapshot', quotes: snapshot }));
      } else if (msg.type === 'unsubscribe') {
        const mineToDrop = symbols.filter((s) => mine.has(s));
        mineToDrop.forEach((s) => mine.delete(s));
        if (mineToDrop.length > 0) hub.unsubscribeDynamic(mineToDrop);
      }
    });

    ws.on('close', () => {
      const mine = clientSubs.get(ws);
      if (mine && mine.size > 0) hub.unsubscribeDynamic([...mine]);
      clientSubs.delete(ws);
    });
  });

  hub.onTick((quote) => {
    const payload = JSON.stringify({ type: 'tick', quote });
    for (const client of clientSubs.keys()) {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
  });

  await hub.start();

  // alert-checking loop every 15s
  setInterval(() => {
    void checkAlerts(async (alert, price) => {
      const msg = `🔔 ${alert.symbol} ${alert.direction === 'above' ? 'yükseldi' : 'düştü'}: ${price} (hedef: ${alert.targetPrice})`;
      console.log('[alert]', msg);
      if (alert.telegramChatId) await sendTelegramMessage(alert.telegramChatId, msg);
    });
  }, 15000);

  httpServer.listen(PORT, () => {
    console.log(`[backend] listening on http://localhost:${PORT} (ws at /ws), cache=${cache.backend()}`);
  });
}

main().catch((err) => {
  console.error('[backend] fatal startup error', err);
  process.exit(1);
});
