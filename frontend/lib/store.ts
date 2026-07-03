import { create } from 'zustand';
import { api } from './api';
import type { Quote, SymbolDef } from './types';
import type { TelegramUser } from './telegram';

export type WsStatus = 'connecting' | 'open' | 'closed';

const RECENTLY_VIEWED_LIMIT = 12;
const DISCOVERED_LIMIT = 60;

interface MarketState {
  quotes: Record<string, Quote>;
  wsStatus: WsStatus;
  debugMode: boolean;
  watchlist: string[];
  recentlyViewed: string[];
  /** Symbols found via dynamic search (not in the static catalog).
   * Cached locally so a discovered symbol keeps working like any other
   * instrument for the rest of the session/device. */
  discoveredSymbols: SymbolDef[];
  telegramUser: TelegramUser | null;
  setQuote: (quote: Quote) => void;
  setQuotes: (quotes: Quote[]) => void;
  setWsStatus: (status: WsStatus) => void;
  toggleDebugMode: () => void;
  toggleWatch: (symbol: string) => void;
  addRecentlyViewed: (symbol: string) => void;
  addDiscoveredSymbols: (defs: SymbolDef[]) => void;
  setTelegramUser: (user: TelegramUser) => void;
  hydrateFromStorage: () => void;
  syncWatchlistFromServer: () => Promise<void>;
}

const WATCHLIST_KEY = 'veri-terminali-watchlist';
const RECENTLY_VIEWED_KEY = 'veri-terminali-recently-viewed';
const DISCOVERED_KEY = 'veri-terminali-discovered-symbols';

function loadList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

function loadDiscovered(): SymbolDef[] {
  try {
    return JSON.parse(localStorage.getItem(DISCOVERED_KEY) ?? '[]');
  } catch {
    return [];
  }
}

// watchlist/recentlyViewed/discoveredSymbols always start empty here
// (both on the server and on the client's first render) so SSR output
// matches the initial client render exactly. The real localStorage-backed
// values are loaded once, client-side only, via hydrateFromStorage()
// called from AppProviders after mount -- avoids a hydration mismatch
// when a returning visitor already has non-empty persisted state.
export const useMarketStore = create<MarketState>((set, get) => ({
  quotes: {},
  wsStatus: 'connecting',
  debugMode: false,
  watchlist: [],
  recentlyViewed: [],
  discoveredSymbols: [],
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
    const wasWatched = current.includes(symbol);
    const next = wasWatched ? current.filter((s) => s !== symbol) : [...current, symbol];
    if (typeof window !== 'undefined') localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
    set({ watchlist: next });
    // Optimistic: UI already updated above. Sync to the backend so the
    // list survives a device switch; on failure the local/localStorage
    // state is left as-is (best-effort, not worth blocking the UI over).
    const call = wasWatched ? api.watchlist.remove(symbol) : api.watchlist.add(symbol);
    call.catch(() => {});
  },
  addRecentlyViewed: (symbol) => {
    const current = get().recentlyViewed.filter((s) => s !== symbol);
    const next = [symbol, ...current].slice(0, RECENTLY_VIEWED_LIMIT);
    if (typeof window !== 'undefined') localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    set({ recentlyViewed: next });
  },
  addDiscoveredSymbols: (defs) => {
    if (defs.length === 0) return;
    const current = get().discoveredSymbols;
    const bySymbol = new Map(current.map((d) => [d.symbol, d]));
    for (const def of defs) bySymbol.set(def.symbol, def);
    const next = [...bySymbol.values()].slice(-DISCOVERED_LIMIT);
    if (typeof window !== 'undefined') localStorage.setItem(DISCOVERED_KEY, JSON.stringify(next));
    set({ discoveredSymbols: next });
  },
  setTelegramUser: (telegramUser) => set({ telegramUser }),
  hydrateFromStorage: () => {
    set({
      watchlist: loadList(WATCHLIST_KEY),
      recentlyViewed: loadList(RECENTLY_VIEWED_KEY),
      discoveredSymbols: loadDiscovered(),
    });
  },
  /** Reconciles the local (device) watchlist with the backend's shared
   * list right after hydration, so a watchlist built on another device
   * shows up here too. Union of both sides -- never silently drops a
   * symbol the user starred locally before the first server round-trip. */
  syncWatchlistFromServer: async () => {
    try {
      const { items } = await api.watchlist.list();
      const remote = items.map((i) => i.symbol);
      const local = get().watchlist;
      const merged = [...new Set([...local, ...remote])];
      if (typeof window !== 'undefined') localStorage.setItem(WATCHLIST_KEY, JSON.stringify(merged));
      set({ watchlist: merged });
      const missingRemotely = local.filter((s) => !remote.includes(s));
      await Promise.all(missingRemotely.map((s) => api.watchlist.add(s).catch(() => {})));
    } catch {
      // backend unreachable -- keep the local/localStorage watchlist as-is
    }
  },
}));
