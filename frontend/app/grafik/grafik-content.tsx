'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import { useMarketStore } from '@/lib/store';
import { ChartPanel } from '@/components/chart-panel';

export function GrafikContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get('symbol') ?? SYMBOL_CATALOG[0].symbol;
  const [symbol, setSymbol] = useState(initial);
  const quote = useMarketStore((s) => s.quotes[symbol]);
  const def = SYMBOL_CATALOG.find((s) => s.symbol === symbol);

  function selectSymbol(next: string) {
    setSymbol(next);
    router.replace(`/grafik?symbol=${encodeURIComponent(next)}`);
  }

  return (
    <div className="pb-4">
      <header className="px-3 pt-4">
        <h1 className="text-lg font-bold">Grafik</h1>
      </header>

      <div className="px-3 pt-3">
        <select
          value={symbol}
          onChange={(e) => selectSymbol(e.target.value)}
          className="w-full panel px-3 py-2 text-sm outline-none"
        >
          {SYMBOL_CATALOG.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.displayNameTr} ({s.symbol})
            </option>
          ))}
        </select>
      </div>

      {def && (
        <div className="px-3 pt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono">{quote?.price ?? '—'}</span>
          {quote?.changePercent != null && (
            <span className={`text-sm font-mono ${quote.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
              {quote.changePercent >= 0 ? '+' : ''}
              {quote.changePercent.toFixed(2)}%
            </span>
          )}
        </div>
      )}

      <div className="px-3 pt-3">
        <ChartPanel symbol={symbol} />
      </div>
    </div>
  );
}
