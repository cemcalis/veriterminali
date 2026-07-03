'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Star } from 'lucide-react';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import { useMarketStore } from '@/lib/store';
import { useSymbolSubscription } from '@/lib/use-market-socket';
import { ChartPanel } from '@/components/chart-panel';
import { StatusBadge } from '@/components/status-badge';

export function GrafikContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get('symbol') ?? SYMBOL_CATALOG[0].symbol;
  const [symbol, setSymbol] = useState(initial);
  const quote = useMarketStore((s) => s.quotes[symbol]);
  const watched = useMarketStore((s) => s.watchlist.includes(symbol));
  const toggleWatch = useMarketStore((s) => s.toggleWatch);
  const def = SYMBOL_CATALOG.find((s) => s.symbol === symbol);

  useSymbolSubscription([symbol]);

  function selectSymbol(next: string) {
    setSymbol(next);
    router.replace(`/grafik?symbol=${encodeURIComponent(next)}`);
  }

  return (
    <div className="pb-4">
      <header className="px-3 pt-4">
        <h1 className="text-lg font-bold">Grafik</h1>
      </header>

      <div className="px-3 pt-3 relative">
        <Search size={15} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          list="symbol-options"
          defaultValue={symbol}
          onChange={(e) => {
            const match = SYMBOL_CATALOG.find(
              (s) => s.symbol === e.target.value || `${s.displayNameTr} (${s.symbol})` === e.target.value,
            );
            if (match) selectSymbol(match.symbol);
          }}
          placeholder="Sembol ara..."
          className="w-full panel pl-9 pr-3 py-2 text-sm outline-none placeholder:text-slate-600"
        />
        <datalist id="symbol-options">
          {SYMBOL_CATALOG.map((s) => (
            <option key={s.symbol} value={`${s.displayNameTr} (${s.symbol})`} />
          ))}
        </datalist>
      </div>

      {def && (
        <div className="px-3 pt-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{def.displayNameTr}</span>
              <button
                onClick={() => toggleWatch(def.symbol)}
                className={watched ? 'text-amber-400' : 'text-slate-500'}
                aria-label="favorilere ekle"
              >
                <Star size={14} fill={watched ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono">{quote?.price ?? '—'}</span>
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

      <div className="px-3 pt-3">
        <ChartPanel symbol={symbol} />
      </div>
    </div>
  );
}
