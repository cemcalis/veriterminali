'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Star, Rows3, Table2, Loader2 } from 'lucide-react';
import { SYMBOL_CATALOG, CATEGORY_LABELS_TR } from '@/lib/symbols';
import { useMarketStore } from '@/lib/store';
import { useSymbolSubscription } from '@/lib/use-market-socket';
import { useDynamicSearch } from '@/lib/use-dynamic-search';
import { MarketTable, type TableMode } from '@/components/market-table';
import { haptic } from '@/lib/telegram';
import type { MarketCategory } from '@/lib/types';

const CATEGORIES: (MarketCategory | 'watchlist' | 'all')[] = [
  'all',
  'watchlist',
  'crypto',
  'crypto_futures',
  'forex',
  'commodity',
  'bist',
  'us_stock',
  'etf',
  'index',
];

const VISIBLE_STREAM_CAP = 80;

function initialTab(param: string | null): (typeof CATEGORIES)[number] {
  return (CATEGORIES as readonly string[]).includes(param ?? '') ? (param as (typeof CATEGORIES)[number]) : 'all';
}

export function PiyasalarContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]>(() => initialTab(searchParams.get('category')));
  const [mode, setMode] = useState<TableMode>('compact');
  const watchlist = useMarketStore((s) => s.watchlist);
  const wsStatus = useMarketStore((s) => s.wsStatus);
  const discoveredSymbols = useMarketStore((s) => s.discoveredSymbols);
  const debugMode = useMarketStore((s) => s.debugMode);

  const catalog = useMemo(() => [...SYMBOL_CATALOG, ...discoveredSymbols], [discoveredSymbols]);

  const filtered = useMemo(() => {
    let list = catalog;
    if (tab === 'watchlist') list = list.filter((s) => watchlist.includes(s.symbol));
    else if (tab !== 'all') list = list.filter((s) => s.category === tab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.displayNameTr.toLowerCase().includes(q),
      );
    }
    return list;
  }, [catalog, tab, query, watchlist]);

  // If nothing matches locally, this reaches out to live providers; any
  // match gets cached into the store, which flows back into `catalog`
  // above and makes `filtered` non-empty on the next render.
  const { searching } = useDynamicSearch(query, filtered.length);

  // Prioritize streaming for what's actually visible in the current
  // view (bounded, so switching to a 400-symbol crypto tab doesn't
  // trigger 400 dynamic tradingview subscriptions at once) plus the
  // full watchlist regardless of the active tab.
  const streamTargets = useMemo(() => {
    const visible = filtered.slice(0, VISIBLE_STREAM_CAP).map((s) => s.symbol);
    return [...new Set([...visible, ...watchlist])];
  }, [filtered, watchlist]);
  useSymbolSubscription(streamTargets);

  const loading = wsStatus === 'connecting';

  return (
    <div className="pb-4">
      <header className="px-4 pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Piyasalar</h1>
          <p className="text-[11px] text-slate-500">
            {debugMode ? `${catalog.length} enstrüman` : 'Geniş kapsamlı piyasa verisi'}
          </p>
        </div>
        <div className="flex items-center gap-1 panel-elevated p-1">
          <button
            onClick={() => {
              haptic('select');
              setMode('compact');
            }}
            className={`p-1.5 rounded-lg transition-colors ${mode === 'compact' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'}`}
            aria-label="kompakt görünüm"
          >
            <Rows3 size={15} />
          </button>
          <button
            onClick={() => {
              haptic('select');
              setMode('detailed');
            }}
            className={`p-1.5 rounded-lg transition-colors ${mode === 'detailed' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'}`}
            aria-label="detaylı görünüm"
          >
            <Table2 size={15} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-3 relative">
        <Search size={15} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sembol veya isim ara..."
          className="w-full panel-elevated pl-9 pr-9 py-2.5 text-sm outline-none placeholder:text-slate-600"
        />
        {searching && (
          <Loader2 size={15} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" />
        )}
      </div>

      <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => {
              haptic('select');
              setTab(c);
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
              tab === c
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'border-[var(--border)] text-slate-400'
            }`}
          >
            {c === 'watchlist' && <Star size={12} />}
            {c === 'all' ? 'Tümü' : c === 'watchlist' ? 'İzleme Listem' : CATEGORY_LABELS_TR[c]}
          </button>
        ))}
      </div>

      <div className="pt-3">
        {loading ? (
          <div className="px-4 flex flex-col gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-11 w-full" />
            ))}
          </div>
        ) : searching && filtered.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-2 text-slate-500">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Piyasalarda aranıyor…</span>
          </div>
        ) : (
          <MarketTable items={filtered} mode={mode} />
        )}
      </div>
    </div>
  );
}
