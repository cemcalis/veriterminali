'use client';

import Link from 'next/link';
import { useMarketStore } from '@/lib/store';
import { usePriceFlash } from '@/lib/use-price-flash';
import type { SymbolDef } from '@/lib/types';
import { StatusBadge } from './status-badge';

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  if (price >= 1000) return price.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  return price.toLocaleString('tr-TR', { maximumFractionDigits: 6 });
}

const AVATAR_COLORS = [
  'from-emerald-500/30 to-teal-500/10 text-emerald-300',
  'from-sky-500/30 to-cyan-500/10 text-sky-300',
  'from-violet-500/30 to-fuchsia-500/10 text-violet-300',
  'from-amber-500/30 to-orange-500/10 text-amber-300',
  'from-rose-500/30 to-pink-500/10 text-rose-300',
];

function avatarClass(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function PriceCard({ def }: { def: SymbolDef }) {
  const quote = useMarketStore((s) => s.quotes[def.symbol]);
  const debugMode = useMarketStore((s) => s.debugMode);
  const changePercent = quote?.changePercent ?? null;
  const isUp = changePercent !== null && changePercent >= 0;
  const flashClass = usePriceFlash(quote?.price ?? null);
  const initials = def.displayNameTr.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/grafik?symbol=${encodeURIComponent(def.symbol)}`}
      className="panel-elevated flex items-center justify-between px-3 py-2.5 gap-3 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br ${avatarClass(def.symbol)} flex items-center justify-center text-[11px] font-semibold`}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{def.displayNameTr}</div>
          <div className="text-[11px] text-slate-500 truncate">{def.symbol}</div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`font-mono text-sm px-1 rounded ${flashClass}`}>{formatPrice(quote?.price ?? null)}</div>
        <div className={`text-[11px] font-mono ${isUp ? 'price-up' : changePercent !== null ? 'price-down' : 'text-slate-500'}`}>
          {changePercent !== null ? `${isUp ? '+' : ''}${changePercent.toFixed(2)}%` : quote ? '·' : 'yükleniyor'}
        </div>
        <div className="flex justify-end mt-0.5">
          <StatusBadge status={quote?.status} />
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
