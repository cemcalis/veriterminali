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
  headers: {
    Origin: 'https://www.tradingview.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

const quoteSession = randSession('qs');
const symbols = ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'EURUSD', 'AAPL', 'BIST:THYAO'];
let gotData = false;

const timeout = setTimeout(() => {
  console.log(gotData ? 'DONE (timeout after some data)' : 'TIMEOUT - no quote data within 12s');
  process.exit(gotData ? 0 : 1);
}, 12000);

ws.on('open', () => {
  console.log('WS OPEN, creating quote session', quoteSession);
  ws.send(tvMsg({ m: 'quote_create_session', p: [quoteSession] }));
  ws.send(tvMsg({ m: 'quote_set_fields', p: [quoteSession, 'lp', 'chp', 'ch', 'volume', 'bid', 'ask'] }));
  for (const sym of symbols) {
    ws.send(tvMsg({ m: 'quote_add_symbols', p: [quoteSession, sym] }));
  }
});

ws.on('message', (data) => {
  const raw = data.toString();
  // handle heartbeat pings ~h~
  if (raw.includes('~h~')) {
    ws.send(raw); // echo heartbeat
    return;
  }
  // split multiple ~m~len~m~{json} frames
  const parts = raw.split(/~m~\d+~m~/).filter(Boolean);
  for (const part of parts) {
    try {
      const j = JSON.parse(part);
      if (j.m === 'qsd') {
        gotData = true;
        console.log('QUOTE DATA:', JSON.stringify(j.p[1]));
      } else if (j.m) {
        console.log('EVENT:', j.m);
      }
    } catch (e) {
      // ignore non-json (session id line)
    }
  }
});

ws.on('error', (err) => {
  console.log('ERROR:', err.message);
});

ws.on('close', (code, reason) => {
  console.log('CLOSE', code, reason?.toString());
});
