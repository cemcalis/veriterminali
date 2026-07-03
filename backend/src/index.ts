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
  const { router: alertsRoute, checkAlerts } = alertsRouter(hub);
  app.use('/api/alerts', alertsRoute);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();
  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'snapshot', quotes: hub.allLatest() }));
    ws.on('close', () => clients.delete(ws));
  });

  hub.onTick((quote) => {
    const payload = JSON.stringify({ type: 'tick', quote });
    for (const client of clients) {
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
