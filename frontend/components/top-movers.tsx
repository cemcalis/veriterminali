'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMarketStore } from '@/lib/store';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import { usePriceFlash } from '@/lib/use-price-flash';
import type { MarketCategory } from '@/lib/types';

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  if (price >= 1000) return price.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  return price.toLocaleString('tr-TR', { maximumFractionDigits: 6 });
}

const symbolIndex = new Map(SYMBOL_CATALOG.map((s) => [s.symbol, s]));

function MoverCard({ symbol, price, changePercent, index }: { symbol: string; price: number | null; changePercent: number; index: number }) {
  const def = symbolIndex.get(symbol);
  const isUp = changePercent >= 0;
  const flashClass = usePriceFlash(price);
  if (!def) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        href={`/grafik?symbol=${encodeURIComponent(symbol)}`}
        className={`block w-32 shrink-0 rounded-2xl p-3 border border-[var(--border)] ${isUp ? 'gradient-card-green' : 'gradient-card-red'}`}
      >
        <div className="text-xs font-medium truncate">{def.displayNameTr}</div>
        <div className="text-[10px] text-slate-500 truncate mb-1.5">{def.symbol}</div>
        <div className={`font-mono text-sm px-0.5 rounded ${flashClass}`}>{formatPrice(price)}</div>
        <div className={`font-mono text-xs font-semibold ${isUp ? 'price-up' : 'price-down'}`}>
          {isUp ? '+' : ''}
          {changePercent.toFixed(2)}%
        </div>
      </Link>
    </motion.div>
  );
}

export function TopMovers({
  title,
  direction,
  category,
  emptyHint,
}: {
  title: string;
  direction: 'up' | 'down';
  category?: MarketCategory;
  emptyHint: string;
}) {
  const quotes = useMarketStore((s) => s.quotes);

  const ranked = useMemo(() => {
    const values = Object.values(quotes).filter((q) => q.changePercent !== null && q.changePercent !== undefined);
    const filtered = category ? values.filter((q) => symbolIndex.get(q.symbol)?.category === category) : values;
    const sorted = [...filtered].sort((a, b) =>
      direction === 'up' ? (b.changePercent ?? 0) - (a.changePercent ?? 0) : (a.changePercent ?? 0) - (b.changePercent ?? 0),
    );
    const relevant = direction === 'up' ? sorted.filter((q) => (q.changePercent ?? 0) > 0) : sorted.filter((q) => (q.changePercent ?? 0) < 0);
    return relevant.slice(0, 8);
  }, [quotes, direction, category]);

  return (
    <section className="pt-4">
      <h2 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{title}</h2>
      {ranked.length === 0 ? (
        <div className="mx-4 panel px-3 py-4 text-center text-xs text-slate-500">{emptyHint}</div>
      ) : (
        <div className="flex gap-2 px-4 overflow-x-auto no-scrollbar pb-1">
          {ranked.map((q, i) => (
            <MoverCard key={q.symbol} symbol={q.symbol} price={q.price} changePercent={q.changePercent ?? 0} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
