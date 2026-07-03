import { create } from 'zustand';
import type { Quote } from './types';
import type { TelegramUser } from './telegram';

export type WsStatus = 'connecting' | 'open' | 'closed';

const RECENTLY_VIEWED_LIMIT = 12;

interface MarketState {
  quotes: Record<string, Quote>;
  wsStatus: WsStatus;
  debugMode: boolean;
  watchlist: string[];
  recentlyViewed: string[];
  telegramUser: TelegramUser | null;
  setQuote: (quote: Quote) => void;
  setQuotes: (quotes: Quote[]) => void;
  setWsStatus: (status: WsStatus) => void;
  toggleDebugMode: () => void;
  toggleWatch: (symbol: string) => void;
  addRecentlyViewed: (symbol: string) => void;
  setTelegramUser: (user: TelegramUser) => void;
  hydrateFromStorage: () => void;
}

const WATCHLIST_KEY = 'veri-terminali-watchlist';
const RECENTLY_VIEWED_KEY = 'veri-terminali-recently-viewed';

function loadList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

// watchlist/recentlyViewed always start empty here (both on the server
// and on the client's first render) so SSR output matches the initial
// client render exactly. The real localStorage-backed values are loaded
// once, client-side only, via hydrateFromStorage() called from
// AppProviders after mount -- avoids a hydration mismatch when a
// returning visitor already has a non-empty watchlist.
export const useMarketStore = create<MarketState>((set, get) => ({
  quotes: {},
  wsStatus: 'connecting',
  debugMode: false,
  watchlist: [],
  recentlyViewed: [],
  telegramUser: null,
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
  addRecentlyViewed: (symbol) => {
    const current = get().recentlyViewed.filter((s) => s !== symbol);
    const next = [symbol, ...current].slice(0, RECENTLY_VIEWED_LIMIT);
    if (typeof window !== 'undefined') localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    set({ recentlyViewed: next });
  },
  setTelegramUser: (telegramUser) => set({ telegramUser }),
  hydrateFromStorage: () => {
    set({ watchlist: loadList(WATCHLIST_KEY), recentlyViewed: loadList(RECENTLY_VIEWED_KEY) });
  },
}));
