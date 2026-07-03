'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import type { Position } from '@/lib/types';

export default function PortfoyPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [symbol, setSymbol] = useState(SYMBOL_CATALOG[0].symbol);
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await api.portfolio.list();
    setPositions(res.positions);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, []);

  async function addPosition(e: React.FormEvent) {
    e.preventDefault();
    const q = Number(quantity);
    const c = Number(avgCost);
    if (!q || !c) return;
    await api.portfolio.add(symbol, q, c);
    setQuantity('');
    setAvgCost('');
    await refresh();
  }

  async function removePosition(id: string) {
    await api.portfolio.remove(id);
    await refresh();
  }

  const totalValue = positions.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);
  const totalCost = positions.reduce((sum, p) => sum + p.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost !== 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="pb-4">
      <header className="px-3 pt-4">
        <h1 className="text-lg font-bold">Portföy</h1>
      </header>

      <div className="mx-3 mt-3 panel p-3">
        <div className="text-xs text-slate-500">Toplam Değer</div>
        <div className="text-2xl font-mono">
          {totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
        </div>
        <div className={`text-sm font-mono ${totalPnl >= 0 ? 'price-up' : 'price-down'}`}>
          {totalPnl >= 0 ? '+' : ''}
          {totalPnl.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ({totalPnlPercent.toFixed(2)}%)
        </div>
      </div>

      <form onSubmit={addPosition} className="mx-3 mt-3 panel p-3 flex flex-col gap-2">
        <div className="text-xs text-slate-400 font-medium">Pozisyon Ekle</div>
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="panel px-2 py-2 text-sm">
          {SYMBOL_CATALOG.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.displayNameTr} ({s.symbol})
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            type="number"
            step="any"
            placeholder="Miktar"
            className="panel px-2 py-2 text-sm flex-1 outline-none"
          />
          <input
            value={avgCost}
            onChange={(e) => setAvgCost(e.target.value)}
            type="number"
            step="any"
            placeholder="Ort. Maliyet"
            className="panel px-2 py-2 text-sm flex-1 outline-none"
          />
        </div>
        <button type="submit" className="bg-emerald-500/20 text-emerald-300 rounded-lg py-2 text-sm">
          Ekle
        </button>
      </form>

      <div className="mx-3 mt-3 flex flex-col gap-2">
        {loading && <div className="text-center text-sm text-slate-500 py-4">Yükleniyor…</div>}
        {!loading && positions.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-4">Henüz pozisyon eklenmedi</div>
        )}
        {positions.map((p) => {
          const def = SYMBOL_CATALOG.find((s) => s.symbol === p.symbol);
          return (
            <div key={p.id} className="panel p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{def?.displayNameTr ?? p.symbol}</div>
                <div className="text-[11px] text-slate-500">
                  {p.quantity} adet @ {p.avgCost}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{p.currentPrice ?? '—'}</div>
                {p.pnl !== null && (
                  <div className={`text-xs font-mono ${p.pnl >= 0 ? 'price-up' : 'price-down'}`}>
                    {p.pnl >= 0 ? '+' : ''}
                    {p.pnl.toFixed(2)} ({p.pnlPercent?.toFixed(2)}%)
                  </div>
                )}
                <button onClick={() => removePosition(p.id)} className="text-[10px] text-slate-500 underline mt-1">
                  Sil
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
