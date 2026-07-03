import { create } from 'zustand';
import type { Quote } from './types';

export type WsStatus = 'connecting' | 'open' | 'closed';

interface MarketState {
  quotes: Record<string, Quote>;
  wsStatus: WsStatus;
  debugMode: boolean;
  watchlist: string[];
  setQuote: (quote: Quote) => void;
  setQuotes: (quotes: Quote[]) => void;
  setWsStatus: (status: WsStatus) => void;
  toggleDebugMode: () => void;
  toggleWatch: (symbol: string) => void;
}

const WATCHLIST_KEY = 'veri-terminali-watchlist';

function loadWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export const useMarketStore = create<MarketState>((set, get) => ({
  quotes: {},
  wsStatus: 'connecting',
  debugMode: false,
  watchlist: loadWatchlist(),
  setQuote: (quote) => set((state) => ({ quotes: { ...state.quotes, [quote.symbol]: quote } })),
  setQuotes: (quotes) =>
    set((state) => ({
      quotes: { ...state.quotes, ...Object.fromEntries(quotes.map((q) => [q.symbol, q])) },
    })),
  setWsStatus: (wsStatus) => set({ wsStatus }),
  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
  toggleWatch: (symbol) => {
    const current = get().watchlist;
    const next = current.includes(symbol) ? current.filter((s) => s !== symbol) : [...current, symbol];
    if (typeof window !== 'undefined') localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
    set({ watchlist: next });
  },
}));
