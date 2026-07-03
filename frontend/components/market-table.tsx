'use client';

import { List, type RowComponentProps } from 'react-window';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import type { SymbolDef } from '@/lib/types';
import { StatusBadge } from './status-badge';

export type TableMode = 'compact' | 'detailed';

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  if (price >= 1000) return price.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  return price.toLocaleString('tr-TR', { maximumFractionDigits: 6 });
}

function formatVolume(volume: number | null | undefined): string {
  if (volume === null || volume === undefined) return '—';
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toFixed(2);
}

function formatAge(timestamp: number | undefined): string {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'şimdi';
  if (seconds < 60) return `${seconds}sn önce`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk önce`;
  return `${Math.floor(minutes / 60)}sa önce`;
}

interface RowProps {
  items: SymbolDef[];
  mode: TableMode;
}

function Row({ index, style, items, mode }: RowComponentProps<RowProps>) {
  const def = items[index];
  const quote = useMarketStore((s) => s.quotes[def.symbol]);
  const debugMode = useMarketStore((s) => s.debugMode);
  const watched = useMarketStore((s) => s.watchlist.includes(def.symbol));
  const toggleWatch = useMarketStore((s) => s.toggleWatch);

  const chp = quote?.changePercent ?? null;
  const isUp = chp !== null && chp >= 0;

  return (
    <div
      style={style}
      className="flex items-center gap-2 px-3 border-b border-[var(--border)]/50 hover:bg-white/[0.02]"
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWatch(def.symbol);
        }}
        className="shrink-0 text-slate-500 hover:text-amber-400 transition-colors"
        aria-label="favorilere ekle"
      >
        <Star size={15} fill={watched ? 'currentColor' : 'none'} className={watched ? 'text-amber-400' : ''} />
      </button>

      <Link href={`/grafik?symbol=${encodeURIComponent(def.symbol)}`} className="flex-1 min-w-0 flex items-center gap-3">
        <div className="min-w-0 w-[38%]">
          <div className="text-sm font-medium truncate">{def.displayNameTr}</div>
          <div className="text-[10px] text-slate-500 truncate">{def.symbol}</div>
        </div>

        <div className="text-right font-mono text-sm w-[20%] shrink-0">{formatPrice(quote?.price ?? null)}</div>

        <div
          className={`text-right font-mono text-xs w-[16%] shrink-0 ${
            isUp ? 'price-up' : chp !== null ? 'price-down' : 'text-slate-500'
          }`}
        >
          {chp !== null ? `${isUp ? '+' : ''}${chp.toFixed(2)}%` : '·'}
        </div>

        {mode === 'detailed' && (
          <>
            <div className="text-right font-mono text-[11px] text-slate-400 w-[16%] shrink-0 hidden sm:block">
              {quote?.bid != null && quote?.ask != null ? `${formatPrice(quote.bid)}/${formatPrice(quote.ask)}` : '—'}
            </div>
            <div className="text-right font-mono text-[11px] text-slate-400 w-[12%] shrink-0 hidden md:block">
              {formatVolume(quote?.volume)}
            </div>
          </>
        )}

        <div className="w-[14%] shrink-0 flex flex-col items-end gap-0.5">
          <StatusBadge status={quote?.status} compact />
          {(mode === 'detailed' || debugMode) && (
            <span className="text-[9px] text-slate-600">
              {quote?.provider ?? '—'} · {formatAge(quote?.timestamp)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

export function MarketTable({ items, mode }: { items: SymbolDef[]; mode: TableMode }) {
  const rowHeight = mode === 'detailed' ? 56 : 44;

  if (items.length === 0) {
    return <div className="py-10 text-center text-sm text-slate-500">Sonuç bulunamadı</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-3 pb-1.5 text-[10px] text-slate-500 uppercase tracking-wide">
        <span className="w-[15px]" />
        <span className="flex-1 min-w-0">Sembol</span>
      </div>
      <List
        rowComponent={Row}
        rowCount={items.length}
        rowHeight={rowHeight}
        rowProps={{ items, mode }}
        defaultHeight={Math.min(items.length * rowHeight, 560)}
        className="no-scrollbar"
      />
    </div>
  );
}
