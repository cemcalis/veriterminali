import type { Alert, Candle, CandleInterval, Position, ProviderHealth, Quote } from './types';

const BASE = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL ?? 'http://localhost:4000';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  status: () => json<{ ok: boolean; cacheBackend: string; time: number }>('/api/status'),
  health: () => json<{ providers: ProviderHealth[] }>('/api/market/health'),
  quote: (symbol: string) => json<{ quote: Quote }>(`/api/market/quote/${encodeURIComponent(symbol)}`),
  candles: (symbol: string, interval: CandleInterval) =>
    json<{ candles: Candle[]; provider: string; experimental: boolean }>(
      `/api/market/candles/${encodeURIComponent(symbol)}?interval=${interval}`,
    ),
  portfolio: {
    list: () => json<{ positions: Position[] }>('/api/portfolio'),
    add: (symbol: string, quantity: number, avgCost: number) =>
      json<{ positions: Position[] }>('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify({ symbol, quantity, avgCost }),
      }),
    remove: (id: string) => json<{ positions: Position[] }>(`/api/portfolio/${id}`, { method: 'DELETE' }),
  },
  alerts: {
    list: () => json<{ alerts: Alert[] }>('/api/alerts'),
    add: (symbol: string, direction: 'above' | 'below', targetPrice: number) =>
      json<{ alerts: Alert[] }>('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ symbol, direction, targetPrice }),
      }),
    remove: (id: string) => json<{ alerts: Alert[] }>(`/api/alerts/${id}`, { method: 'DELETE' }),
  },
};
