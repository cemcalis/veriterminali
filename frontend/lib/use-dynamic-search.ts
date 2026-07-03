'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { useMarketStore } from './store';
import type { SymbolDef } from './types';

const DEBOUNCE_MS = 450;
const MIN_QUERY_LENGTH = 2;

/**
 * When the local catalog has no match for a search query, this looks the
 * query up against live providers (Binance / Yahoo search) so the app
 * feels like it can search unlimited markets, not just the ~1000+
 * symbols shipped in the static catalog. Debounced and only triggered
 * when there's nothing to show locally, so normal typing never hits the
 * network.
 */
export function useDynamicSearch(query: string, localResultCount: number): { searching: boolean } {
  const [searching, setSearching] = useState(false);
  const addDiscoveredSymbols = useMarketStore((s) => s.addDiscoveredSymbols);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (localResultCount > 0 || trimmed.length < MIN_QUERY_LENGTH) {
      setSearching(false);
      return;
    }

    const myId = ++requestId.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.search(trimmed);
        if (requestId.current !== myId) return;
        if (res.results.length > 0) addDiscoveredSymbols(res.results as SymbolDef[]);
      } catch {
        // silent -- search is best-effort, local results already shown
      } finally {
        if (requestId.current === myId) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, localResultCount, addDiscoveredSymbols]);

  return { searching };
}
