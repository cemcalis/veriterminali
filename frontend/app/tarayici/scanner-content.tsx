'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Star, RefreshCw, SearchX, BookmarkPlus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useMarketStore } from '@/lib/store';
import { haptic } from '@/lib/telegram';
import { CATEGORY_LABELS_TR } from '@/lib/symbols';
import { StatusBadge } from '@/components/status-badge';
import type { MarketCategory, ScannerFilters, ScannerPreset, ScannerRow } from '@/lib/types';

const REFRESH_MS = 15_000;

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  if (price >= 1000) return price.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
  return price.toLocaleString('tr-TR', { maximumFractionDigits: 6 });
}

function formatVolume(volume: number | null | undefined): string {
  if (!volume) return '—';
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toFixed(2);
}

const CATEGORY_OPTIONS: (MarketCategory | 'all')[] = [
  'all',
  'crypto',
  'crypto_futures',
  'forex',
  'commodity',
  'bist',
  'us_stock',
  'etf',
  'index',
];

export function ScannerContent() {
  const [category, setCategory] = useState<MarketCategory | 'all'>('all');
  const [minChangePercent, setMinChangePercent] = useState('');
  const [maxChangePercent, setMaxChangePercent] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [rsiFilter, setRsiFilter] = useState<'' | 'oversold' | 'overbought'>('');
  const [sort, setSort] = useState<'changePercent' | 'volume' | 'price'>('changePercent');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');

  const [rows, setRows] = useState<ScannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [presets, setPresets] = useState<ScannerPreset[]>([]);

  const watchlist = useMarketStore((s) => s.watchlist);
  const toggleWatch = useMarketStore((s) => s.toggleWatch);

  const buildFilters = useCallback((): ScannerFilters => {
    const f: ScannerFilters = { sort, direction, limit: 60 };
    if (category !== 'all') f.category = category;
    if (minChangePercent !== '') f.minChangePercent = Number(minChangePercent);
    if (maxChangePercent !== '') f.maxChangePercent = Number(maxChangePercent);
    if (minVolume !== '') f.minVolume = Number(minVolume);
    if (rsiFilter !== '') f.rsi = rsiFilter;
    return f;
  }, [category, minChangePercent, maxChangePercent, minVolume, rsiFilter, sort, direction]);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const { rows } = await api.scanner.query(buildFilters());
      setRows(rows);
    } catch {
      // keep last successful result on transient failure
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    void run();
    const id = setInterval(() => void run(), REFRESH_MS);
    return () => clearInterval(id);
  }, [run]);

  useEffect(() => {
    api.scannerPresets
      .list()
      .then(({ presets }) => setPresets(presets))
      .catch(() => {});
  }, []);

  const applyPreset = (p: ScannerPreset) => {
    const f = p.filters;
    setCategory((f.category as MarketCategory) ?? 'all');
    setMinChangePercent(f.minChangePercent !== undefined ? String(f.minChangePercent) : '');
    setMaxChangePercent(f.maxChangePercent !== undefined ? String(f.maxChangePercent) : '');
    setMinVolume(f.minVolume !== undefined ? String(f.minVolume) : '');
    setRsiFilter((f.rsi as 'oversold' | 'overbought') ?? '');
    setSort((f.sort as typeof sort) ?? 'changePercent');
    setDirection((f.direction as typeof direction) ?? 'desc');
  };

  const savePreset = async () => {
    const name = window.prompt('Şablon adı');
    if (!name) return;
    const { presets } = await api.scannerPresets.add(name, buildFilters() as Record<string, string | number>);
    setPresets(presets);
    haptic('success');
  };

  const removePreset = async (id: string) => {
    const { presets } = await api.scannerPresets.remove(id);
    setPresets(presets);
  };

  return (
    <div className="pb-6">
      <div className="px-4 pt-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Tarayıcı</h1>
        <button
          onClick={() => void run()}
          className="flex items-center gap-1.5 text-xs text-slate-400 active:scale-95 transition-transform"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Yenile
        </button>
      </div>
      <p className="px-4 mt-1 text-[11px] text-slate-500">
        1149 enstrümanlık kataloğu canlı fiyat/hacim/RSI kriterleriyle filtreler. {REFRESH_MS / 1000} sn'de bir otomatik yenilenir.
      </p>

      {presets.length > 0 && (
        <div className="px-4 mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {presets.map((p) => (
            <span
              key={p.id}
              className="shrink-0 flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-[11px]"
            >
              <button onClick={() => applyPreset(p)}>{p.name}</button>
              <button onClick={() => void removePreset(p.id)} aria-label="şablonu sil" className="text-slate-500">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="px-4 mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORY_OPTIONS.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] border transition-colors ${
              category === c ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'border-[var(--border)] text-slate-400'
            }`}
          >
            {c === 'all' ? 'Tümü' : CATEGORY_LABELS_TR[c]}
          </button>
        ))}
      </div>

      <div className="px-4 mt-3 grid grid-cols-2 gap-2">
        <input
          value={minChangePercent}
          onChange={(e) => setMinChangePercent(e.target.value)}
          placeholder="Min %"
          inputMode="decimal"
          className="panel-elevated px-3 py-2 text-xs bg-transparent outline-none"
        />
        <input
          value={maxChangePercent}
          onChange={(e) => setMaxChangePercent(e.target.value)}
          placeholder="Maks %"
          inputMode="decimal"
          className="panel-elevated px-3 py-2 text-xs bg-transparent outline-none"
        />
        <input
          value={minVolume}
          onChange={(e) => setMinVolume(e.target.value)}
          placeholder="Min hacim"
          inputMode="decimal"
          className="panel-elevated px-3 py-2 text-xs bg-transparent outline-none"
        />
        <select
          value={rsiFilter}
          onChange={(e) => setRsiFilter(e.target.value as typeof rsiFilter)}
          className="panel-elevated px-3 py-2 text-xs bg-transparent outline-none"
        >
          <option value="">RSI (tümü)</option>
          <option value="oversold">RSI ≤ 30 (aşırı satım)</option>
          <option value="overbought">RSI ≥ 70 (aşırı alım)</option>
        </select>
      </div>

      <div className="px-4 mt-2 flex items-center justify-between">
        <div className="flex gap-2">
          {(['changePercent', 'volume', 'price'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-[11px] px-2 py-1 rounded-md ${sort === s ? 'text-emerald-300' : 'text-slate-500'}`}
            >
              {s === 'changePercent' ? '% Değişim' : s === 'volume' ? 'Hacim' : 'Fiyat'}
            </button>
          ))}
          <button
            onClick={() => setDirection((d) => (d === 'desc' ? 'asc' : 'desc'))}
            className="text-[11px] px-2 py-1 rounded-md text-slate-500"
          >
            {direction === 'desc' ? '↓' : '↑'}
          </button>
        </div>
        <button onClick={() => void savePreset()} className="flex items-center gap-1 text-[11px] text-slate-400">
          <BookmarkPlus size={13} /> Şablon kaydet
        </button>
      </div>

      <div className="mt-3">
        {rows.length === 0 && !loading ? (
          <div className="py-14 flex flex-col items-center gap-2 text-slate-500">
            <SearchX size={28} strokeWidth={1.5} />
            <span className="text-sm">Kriterlere uyan enstrüman yok</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {rows.map((row) => {
              const chp = row.quote.changePercent ?? null;
              const isUp = chp !== null && chp >= 0;
              const watched = watchlist.includes(row.symbol);
              return (
                <div
                  key={row.symbol}
                  className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)]/50"
                >
                  <button
                    onClick={() => {
                      haptic('select');
                      toggleWatch(row.symbol);
                    }}
                    className="shrink-0 text-slate-500 active:scale-90 transition-transform"
                    aria-label="favorilere ekle"
                  >
                    <Star size={15} fill={watched ? 'currentColor' : 'none'} className={watched ? 'text-amber-400' : ''} />
                  </button>
                  <Link href={`/grafik?symbol=${encodeURIComponent(row.symbol)}`} className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="min-w-0 w-[34%]">
                      <div className="text-sm font-medium truncate">{row.displayNameTr}</div>
                      <div className="text-[10px] text-slate-500 truncate">{row.symbol}</div>
                    </div>
                    <div className="text-right font-mono text-sm w-[20%] shrink-0">{formatPrice(row.quote.price)}</div>
                    <div className={`text-right font-mono text-xs w-[16%] shrink-0 ${isUp ? 'price-up' : 'price-down'}`}>
                      {chp !== null ? `${isUp ? '+' : ''}${chp.toFixed(2)}%` : '·'}
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-400 w-[14%] shrink-0 hidden sm:block">
                      {formatVolume(row.quote.volume)}
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-400 w-[10%] shrink-0 hidden md:block">
                      {row.rsi14 !== null ? row.rsi14.toFixed(0) : '—'}
                    </div>
                    <div className="w-[10%] shrink-0 flex justify-end">
                      <StatusBadge status={row.quote.status} />
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
