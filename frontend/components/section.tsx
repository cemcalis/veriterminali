'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import { useSymbolSubscription } from '@/lib/use-market-socket';
import type { MarketCategory } from '@/lib/types';
import { PriceCard } from './price-card';

const PREVIEW_COUNT = 5;

export function Section({ title, category }: { title: string; category: MarketCategory }) {
  const all = SYMBOL_CATALOG.filter((s) => s.category === category);
  const preview = all.slice(0, PREVIEW_COUNT);
  useSymbolSubscription(preview.map((s) => s.symbol));
  if (all.length === 0) return null;

  return (
    <section className="px-3 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {title} <span className="text-slate-600 normal-case">({all.length})</span>
        </h2>
        <Link
          href={`/piyasalar?category=${category}`}
          className="flex items-center gap-0.5 text-[11px] text-emerald-400"
        >
          Tümünü gör <ChevronRight size={12} />
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {preview.map((def) => (
          <PriceCard key={def.symbol} def={def} />
        ))}
      </div>
    </section>
  );
}
