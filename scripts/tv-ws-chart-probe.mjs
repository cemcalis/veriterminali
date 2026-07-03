import WebSocket from 'ws';

function tvMsg(obj) {
  const s = JSON.stringify(obj);
  return `~m~${s.length}~m~${s}`;
}
function randSession(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let r = '';
  for (let i = 0; i < 12; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${r}`;
}

const ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
  headers: { Origin: 'https://www.tradingview.com', 'User-Agent': 'Mozilla/5.0' },
});

const chartSession = randSession('cs');
let resolved = false;
const timeout = setTimeout(() => { console.log(resolved ? 'DONE' : 'TIMEOUT no candles'); process.exit(resolved?0:1); }, 12000);

ws.on('open', () => {
  console.log('OPEN, chart session', chartSession);
  ws.send(tvMsg({ m: 'chart_create_session', p: [chartSession, ''] }));
  ws.send(tvMsg({ m: 'resolve_symbol', p: [chartSession, 'sds_sym_1', '=XAUUSD'] }));
  ws.send(tvMsg({ m: 'create_series', p: [chartSession, 'sds_1', 's1', 'sds_sym_1', '5', 10] }));
});

ws.on('message', (data) => {
  const raw = data.toString();
  if (raw.includes('~h~')) { ws.send(raw); return; }
  const parts = raw.split(/~m~\d+~m~/).filter(Boolean);
  for (const part of parts) {
    try {
      const j = JSON.parse(part);
      if (j.m === 'timescale_update' || j.m === 'du') {
        resolved = true;
        console.log('CANDLE EVENT:', j.m, JSON.stringify(j.p).slice(0, 400));
      } else if (j.m === 'symbol_resolved') {
        console.log('SYMBOL RESOLVED:', JSON.stringify(j.p[2]).slice(0,200));
      } else if (j.m) {
        console.log('EVENT:', j.m);
      }
    } catch (e) {}
  }
});
ws.on('error', (err) => console.log('ERROR:', err.message));
