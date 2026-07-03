import type {
  Alert,
  Candle,
  CandleInterval,
  InstitutionalResult,
  Position,
  ProviderHealth,
  Quote,
  ScannerFilters,
  ScannerPreset,
  ScannerRow,
  SymbolDef,
  WatchlistItem,
} from './types';

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
  search: (query: string) =>
    json<{ results: SymbolDef[]; discovered: boolean }>(`/api/market/search?q=${encodeURIComponent(query)}`),
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
  watchlist: {
    list: () => json<{ items: WatchlistItem[] }>('/api/watchlist'),
    add: (symbol: string) =>
      json<{ items: WatchlistItem[] }>('/api/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) }),
    remove: (symbol: string) =>
      json<{ items: WatchlistItem[] }>(`/api/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' }),
  },
  scanner: {
    query: (filters: ScannerFilters) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== '') params.set(key, String(value));
      }
      return json<{ rows: ScannerRow[]; total: number }>(`/api/scanner?${params.toString()}`);
    },
  },
  scannerPresets: {
    list: () => json<{ presets: ScannerPreset[] }>('/api/scanner-presets'),
    add: (name: string, filters: Record<string, string | number>) =>
      json<{ presets: ScannerPreset[] }>('/api/scanner-presets', {
        method: 'POST',
        body: JSON.stringify({ name, filters }),
      }),
    remove: (id: string) => json<{ presets: ScannerPreset[] }>(`/api/scanner-presets/${id}`, { method: 'DELETE' }),
  },
  institutional: {
    depth: (symbol: string) => json<InstitutionalResult<unknown>>(`/api/institutional/depth/${encodeURIComponent(symbol)}`),
    akd: (symbol: string) => json<InstitutionalResult<unknown>>(`/api/institutional/akd/${encodeURIComponent(symbol)}`),
    teorik: (symbol: string) => json<InstitutionalResult<unknown>>(`/api/institutional/teorik/${encodeURIComponent(symbol)}`),
    takas: (symbol: string) => json<InstitutionalResult<unknown>>(`/api/institutional/takas/${encodeURIComponent(symbol)}`),
  },
};
