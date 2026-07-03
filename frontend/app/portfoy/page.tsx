'use client';

import { useEffect, useState } from 'react';
import { Trash2, Wallet, Plus, PackageOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import { useSymbolSubscription } from '@/lib/use-market-socket';
import { usePriceFlash } from '@/lib/use-price-flash';
import { haptic } from '@/lib/telegram';
import type { Position } from '@/lib/types';

function PositionRow({ position, onRemove }: { position: Position; onRemove: (id: string) => void }) {
  const def = SYMBOL_CATALOG.find((s) => s.symbol === position.symbol);
  const flashClass = usePriceFlash(position.currentPrice);
  return (
    <div className="panel-elevated p-3 flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{def?.displayNameTr ?? position.symbol}</div>
        <div className="text-[11px] text-slate-500">
          {position.quantity} adet @ {position.avgCost}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-mono text-sm px-1 rounded ${flashClass}`}>{position.currentPrice ?? '—'}</div>
        {position.pnl !== null && (
          <div className={`text-xs font-mono ${position.pnl >= 0 ? 'price-up' : 'price-down'}`}>
            {position.pnl >= 0 ? '+' : ''}
            {position.pnl.toFixed(2)} ({position.pnlPercent?.toFixed(2)}%)
          </div>
        )}
        <button
          onClick={() => {
            haptic('warning');
            onRemove(position.id);
          }}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 mt-1 ml-auto"
        >
          <Trash2 size={11} /> Sil
        </button>
      </div>
    </div>
  );
}

export default function PortfoyPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [symbolInput, setSymbolInput] = useState(`${SYMBOL_CATALOG[0].displayNameTr} (${SYMBOL_CATALOG[0].symbol})`);
  const [symbol, setSymbol] = useState(SYMBOL_CATALOG[0].symbol);
  const [quantity, setQuantity] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [loading, setLoading] = useState(true);

  useSymbolSubscription(positions.map((p) => p.symbol));

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
    haptic('success');
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
  const totalFlash = usePriceFlash(totalValue);

  return (
    <div className="pb-4">
      <header className="px-4 pt-4 flex items-center gap-2">
        <Wallet size={18} className="text-emerald-400" />
        <h1 className="text-lg font-bold">Portföy</h1>
      </header>

      <div className={`mx-4 mt-3 rounded-2xl p-4 border border-[var(--border)] ${totalPnl >= 0 ? 'gradient-card-green' : 'gradient-card-red'}`}>
        <div className="text-xs text-slate-500">Toplam Değer</div>
        <div className={`text-2xl font-mono px-1 rounded ${totalFlash}`}>
          {totalValue.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
        </div>
        <div className={`text-sm font-mono ${totalPnl >= 0 ? 'price-up' : 'price-down'}`}>
          {totalPnl >= 0 ? '+' : ''}
          {totalPnl.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ({totalPnlPercent.toFixed(2)}%)
        </div>
      </div>

      <form onSubmit={addPosition} className="mx-4 mt-3 panel-elevated p-3 flex flex-col gap-2">
        <div className="text-xs text-slate-400 font-medium">Pozisyon Ekle</div>
        <input
          list="symbol-options-portfoy"
          value={symbolInput}
          onChange={(e) => {
            setSymbolInput(e.target.value);
            const match = SYMBOL_CATALOG.find((s) => `${s.displayNameTr} (${s.symbol})` === e.target.value);
            if (match) setSymbol(match.symbol);
          }}
          placeholder="Sembol ara..."
          className="panel px-2 py-2 text-sm outline-none"
        />
        <datalist id="symbol-options-portfoy">
          {SYMBOL_CATALOG.map((s) => (
            <option key={s.symbol} value={`${s.displayNameTr} (${s.symbol})`} />
          ))}
        </datalist>
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
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 gradient-accent text-black font-medium rounded-xl py-2.5 text-sm active:scale-[0.98] transition-transform"
        >
          <Plus size={15} /> Ekle
        </button>
      </form>

      <div className="mx-4 mt-3 flex flex-col gap-2">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-2xl" />)}
        {!loading && positions.length === 0 && (
          <div className="panel-elevated flex flex-col items-center gap-2 py-8 text-slate-500">
            <PackageOpen size={26} strokeWidth={1.5} />
            <span className="text-sm">Henüz pozisyon eklenmedi</span>
          </div>
        )}
        {positions.map((p) => (
          <PositionRow key={p.id} position={p} onRemove={removePosition} />
        ))}
      </div>
    </div>
  );
}
