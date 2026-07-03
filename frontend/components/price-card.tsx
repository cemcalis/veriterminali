'use client';

import Link from 'next/link';
import { useMarketStore } from '@/lib/store';
import type { SymbolDef } from '@/lib/types';
import { StatusBadge } from './status-badge';

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  if (price >= 1000) return price.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  return price.toLocaleString('tr-TR', { maximumFractionDigits: 6 });
}

export function PriceCard({ def }: { def: SymbolDef }) {
  const quote = useMarketStore((s) => s.quotes[def.symbol]);
  const debugMode = useMarketStore((s) => s.debugMode);
  const changePercent = quote?.changePercent ?? null;
  const isUp = changePercent !== null && changePercent >= 0;

  return (
    <Link
      href={`/grafik?symbol=${encodeURIComponent(def.symbol)}`}
      className="panel flex items-center justify-between px-3 py-2.5 gap-2"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{def.displayNameTr}</div>
        <div className="text-[11px] text-slate-500 truncate">{def.symbol}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-mono text-sm">{formatPrice(quote?.price ?? null)}</div>
        <div className={`text-[11px] font-mono ${isUp ? 'price-up' : changePercent !== null ? 'price-down' : 'text-slate-500'}`}>
          {changePercent !== null ? `${isUp ? '+' : ''}${changePercent.toFixed(2)}%` : quote ? '·' : 'yükleniyor'}
        </div>
        <div className="flex justify-end mt-0.5">
          <StatusBadge status={quote?.status} compact />
        </div>
        {debugMode && quote && (
          <div className="text-[9px] text-slate-600">
            {quote.provider}
            {quote.experimental ? ' (deneysel)' : ''}
          </div>
        )}
      </div>
    </Link>
  );
}
