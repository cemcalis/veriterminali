'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Star, Loader2 } from 'lucide-react';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import { useMarketStore } from '@/lib/store';
import { useSymbolSubscription } from '@/lib/use-market-socket';
import { usePriceFlash } from '@/lib/use-price-flash';
import { haptic } from '@/lib/telegram';
import { api } from '@/lib/api';
import { ChartPanel } from '@/components/chart-panel';
import { StatusBadge } from '@/components/status-badge';
import { InstitutionalPanel } from '@/components/institutional-panel';
import { NewsFeed } from '@/components/news-feed';

export function GrafikContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get('symbol') ?? SYMBOL_CATALOG[0].symbol;
  const [symbol, setSymbol] = useState(initial);
  const [searching, setSearching] = useState(false);
  const quote = useMarketStore((s) => s.quotes[symbol]);
  const watched = useMarketStore((s) => s.watchlist.includes(symbol));
  const toggleWatch = useMarketStore((s) => s.toggleWatch);
  const addRecentlyViewed = useMarketStore((s) => s.addRecentlyViewed);
  const discoveredSymbols = useMarketStore((s) => s.discoveredSymbols);
  const addDiscoveredSymbols = useMarketStore((s) => s.addDiscoveredSymbols);
  const catalog = useMemo(() => [...SYMBOL_CATALOG, ...discoveredSymbols], [discoveredSymbols]);
  const def = catalog.find((s) => s.symbol === symbol);
  const flashClass = usePriceFlash(quote?.price ?? null);
  const searchSeq = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useSymbolSubscription([symbol]);
  useEffect(() => {
    addRecentlyViewed(symbol);
  }, [symbol, addRecentlyViewed]);

  function selectSymbol(next: string) {
    setSymbol(next);
    router.replace(`/grafik?symbol=${encodeURIComponent(next)}`);
  }

  function handleInput(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const match = catalog.find((s) => s.symbol === value || `${s.displayNameTr} (${s.symbol})` === value);
    if (match) {
      selectSymbol(match.symbol);
      return;
    }
    // Free-typed text with no local match: ask the backend to look it up
    // on live providers (debounced) so any real, currently-listed
    // instrument is reachable here, not just the static catalog.
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    debounceRef.current = setTimeout(() => {
      const mySeq = ++searchSeq.current;
      setSearching(true);
      void api
        .search(trimmed)
        .then((res) => {
          if (searchSeq.current !== mySeq) return;
          if (res.results.length > 0) {
            addDiscoveredSymbols(res.results);
            selectSymbol(res.results[0].symbol);
          }
        })
        .finally(() => {
          if (searchSeq.current === mySeq) setSearching(false);
        });
    }, 500);
  }

  return (
    <div className="pb-4">
      <header className="px-4 pt-4">
        <h1 className="text-lg font-bold">Grafik</h1>
      </header>

      <div className="px-4 pt-3 relative">
        <Search size={15} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          list="symbol-options"
          defaultValue={symbol}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Sembol ara... (herhangi bir gerçek enstrüman)"
          className="w-full panel pl-9 pr-9 py-2 text-sm outline-none placeholder:text-slate-600"
        />
        {searching && (
          <Loader2 size={14} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" />
        )}
        <datalist id="symbol-options">
          {catalog.map((s) => (
            <option key={s.symbol} value={`${s.displayNameTr} (${s.symbol})`} />
          ))}
        </datalist>
      </div>

      {def && (
        <div className="px-4 pt-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{def.displayNameTr}</span>
              <button
                onClick={() => {
                  haptic('select');
                  toggleWatch(def.symbol);
                }}
                className={`active:scale-90 transition-transform ${watched ? 'text-amber-400' : 'text-slate-500'}`}
                aria-label="favorilere ekle"
              >
                <Star size={14} fill={watched ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-mono px-1 rounded ${flashClass}`}>{quote?.price ?? '—'}</span>
              {quote?.changePercent != null && (
                <span className={`text-sm font-mono ${quote.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                  {quote.changePercent >= 0 ? '+' : ''}
                  {quote.changePercent.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={quote?.status} />
        </div>
      )}

      <div className="px-4 pt-3">
        <ChartPanel symbol={symbol} />
      </div>

      {def?.category === 'bist' && (
        <div className="px-4 pt-4 flex flex-col gap-5">
          <NewsFeed symbol={def.symbol} />
          <InstitutionalPanel symbol={def.symbol} />
        </div>
      )}
    </div>
  );
}
