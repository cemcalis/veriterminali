'use client';

import Link from 'next/link';
import { History } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import { useSymbolSubscription } from '@/lib/use-market-socket';

const symbolIndex = new Map(SYMBOL_CATALOG.map((s) => [s.symbol, s]));

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  if (price >= 1000) return price.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  return price.toLocaleString('tr-TR', { maximumFractionDigits: 6 });
}

export function RecentlyViewed() {
  const recentlyViewed = useMarketStore((s) => s.recentlyViewed);
  const quotes = useMarketStore((s) => s.quotes);
  useSymbolSubscription(recentlyViewed);

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="pt-4">
      <h2 className="px-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
        <History size={13} /> Son Görüntülenenler
      </h2>
      <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-1">
        {recentlyViewed.map((symbol) => {
          const def = symbolIndex.get(symbol);
          if (!def) return null;
          const q = quotes[symbol];
          const chp = q?.changePercent ?? null;
          const isUp = chp !== null && chp >= 0;
          return (
            <Link
              key={symbol}
              href={`/grafik?symbol=${encodeURIComponent(symbol)}`}
              className="shrink-0 w-28 rounded-xl panel-elevated p-2.5"
            >
              <div className="text-[11px] font-medium truncate">{def.displayNameTr}</div>
              <div className="font-mono text-xs mt-1">{formatPrice(q?.price)}</div>
              <div className={`font-mono text-[10px] ${isUp ? 'price-up' : chp !== null ? 'price-down' : 'text-slate-500'}`}>
                {chp !== null ? `${isUp ? '+' : ''}${chp.toFixed(2)}%` : '·'}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
