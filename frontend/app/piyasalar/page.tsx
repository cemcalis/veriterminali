'use client';

import { useMemo, useState } from 'react';
import { SYMBOL_CATALOG, CATEGORY_LABELS_TR } from '@/lib/symbols';
import { useMarketStore } from '@/lib/store';
import type { MarketCategory } from '@/lib/types';
import Link from 'next/link';

const CATEGORIES: (MarketCategory | 'watchlist' | 'all')[] = [
  'all',
  'watchlist',
  'crypto',
  'forex',
  'commodity',
  'bist',
  'us_stock',
  'index',
];

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—';
  if (price >= 1000) return price.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  return price.toLocaleString('tr-TR', { maximumFractionDigits: 6 });
}

export default function PiyasalarPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]>('all');
  const quotes = useMarketStore((s) => s.quotes);
  const watchlist = useMarketStore((s) => s.watchlist);
  const toggleWatch = useMarketStore((s) => s.toggleWatch);

  const filtered = useMemo(() => {
    let list = SYMBOL_CATALOG;
    if (tab === 'watchlist') list = list.filter((s) => watchlist.includes(s.symbol));
    else if (tab !== 'all') list = list.filter((s) => s.category === tab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.displayNameTr.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tab, query, watchlist]);

  return (
    <div className="pb-4">
      <header className="px-3 pt-4">
        <h1 className="text-lg font-bold">Piyasalar</h1>
      </header>

      <div className="px-3 pt-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sembol veya isim ara..."
          className="w-full panel px-3 py-2 text-sm outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="px-3 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${
              tab === c
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'border-[var(--border)] text-slate-400'
            }`}
          >
            {c === 'all' ? 'Tümü' : c === 'watchlist' ? 'İzleme Listem' : CATEGORY_LABELS_TR[c]}
          </button>
        ))}
      </div>

      <div className="px-3 pt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-slate-500 border-b border-[var(--border)]">
              <th className="py-2 font-normal">Sembol</th>
              <th className="py-2 font-normal text-right">Fiyat</th>
              <th className="py-2 font-normal text-right">Değişim</th>
              <th className="py-2 font-normal w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((def) => {
              const q = quotes[def.symbol];
              const chp = q?.changePercent ?? null;
              const isUp = chp !== null && chp >= 0;
              const watched = watchlist.includes(def.symbol);
              return (
                <tr key={def.symbol} className="border-b border-[var(--border)]/50">
                  <td className="py-2">
                    <Link href={`/grafik?symbol=${encodeURIComponent(def.symbol)}`} className="block">
                      <div className="text-sm">{def.displayNameTr}</div>
                      <div className="text-[10px] text-slate-500">{def.symbol}</div>
                    </Link>
                  </td>
                  <td className="py-2 text-right font-mono">{formatPrice(q?.price ?? null)}</td>
                  <td className={`py-2 text-right font-mono text-xs ${isUp ? 'price-up' : chp !== null ? 'price-down' : 'text-slate-500'}`}>
                    {chp !== null ? `${isUp ? '+' : ''}${chp.toFixed(2)}%` : '·'}
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => toggleWatch(def.symbol)} className="text-lg leading-none">
                      {watched ? '★' : '☆'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                  Sonuç bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
