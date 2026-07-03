import { SYMBOL_CATALOG } from '@/lib/symbols';
import type { MarketCategory } from '@/lib/types';
import { PriceCard } from './price-card';

export function Section({ title, category }: { title: string; category: MarketCategory }) {
  const symbols = SYMBOL_CATALOG.filter((s) => s.category === category);
  if (symbols.length === 0) return null;
  return (
    <section className="px-3 pt-4">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{title}</h2>
      <div className="flex flex-col gap-2">
        {symbols.map((def) => (
          <PriceCard key={def.symbol} def={def} />
        ))}
      </div>
    </section>
  );
}
