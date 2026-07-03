import WebSocket from 'ws';

const ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
  headers: {
    Origin: 'https://www.tradingview.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

const timeout = setTimeout(() => {
  console.log('TIMEOUT - no open/message within 8s');
  process.exit(1);
}, 8000);

ws.on('open', () => {
  console.log('WS OPEN');
});

ws.on('message', (data) => {
  console.log('MESSAGE:', data.toString().slice(0, 300));
  clearTimeout(timeout);
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  console.log('ERROR:', err.message);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', (code, reason) => {
  console.log('CLOSE', code, reason?.toString());
});
