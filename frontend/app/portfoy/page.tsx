'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2, Wallet, Plus, PackageOpen, TrendingDown, History, PieChart, Landmark } from 'lucide-react';
import { api } from '@/lib/api';
import { CATEGORY_LABELS_TR, SYMBOL_CATALOG } from '@/lib/symbols';
import { useSymbolSubscription } from '@/lib/use-market-socket';
import { usePriceFlash } from '@/lib/use-price-flash';
import { haptic } from '@/lib/telegram';
import { EquitySparkline } from '@/components/equity-sparkline';
import type { CorporateActionItem, EquitySnapshot, Position, Trade } from '@/lib/types';

function PositionRow({
  position,
  onRemove,
  onSell,
}: {
  position: Position;
  onRemove: (id: string) => void;
  onSell: (symbol: string, quantity: number) => void;
}) {
  const def = SYMBOL_CATALOG.find((s) => s.symbol === position.symbol);
  const flashClass = usePriceFlash(position.currentPrice);
  const [selling, setSelling] = useState(false);

  return (
    <div className="panel-elevated p-3">
      <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2 mt-1 justify-end">
            <button
              onClick={() => setSelling((s) => !s)}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-400"
            >
              <TrendingDown size={11} /> Sat
            </button>
            <button
              onClick={() => {
                haptic('warning');
                onRemove(position.id);
              }}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400"
            >
              <Trash2 size={11} /> Sil
            </button>
          </div>
        </div>
      </div>
      {selling && (
        <SellForm
          max={position.quantity}
          defaultPrice={position.currentPrice ?? position.avgCost}
          onCancel={() => setSelling(false)}
          onConfirm={(qty) => {
            onSell(position.symbol, qty);
            setSelling(false);
          }}
        />
      )}
    </div>
  );
}

function SellForm({
  max,
  defaultPrice,
  onCancel,
  onConfirm,
}: {
  max: number;
  defaultPrice: number;
  onCancel: () => void;
  onConfirm: (quantity: number) => void;
}) {
  const [qty, setQty] = useState(String(max));
  return (
    <div className="mt-2.5 pt-2.5 border-t border-[var(--border)] flex items-center gap-2">
      <input
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        type="number"
        step="any"
        max={max}
        className="panel px-2 py-1.5 text-xs flex-1 outline-none"
        placeholder="Miktar"
      />
      <span className="text-[10px] text-slate-500">@ {defaultPrice}</span>
      <button
        onClick={() => {
          const n = Number(qty);
          if (n > 0 && n <= max) {
            haptic('success');
            onConfirm(n);
          }
        }}
        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30"
      >
        Onayla
      </button>
      <button onClick={onCancel} className="text-[11px] text-slate-500 px-1">
        İptal
      </button>
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
  const [equityHistory, setEquityHistory] = useState<EquitySnapshot[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [corporateActions, setCorporateActions] = useState<{ symbol: string; items: CorporateActionItem[] }[]>([]);

  useSymbolSubscription(positions.map((p) => p.symbol));

  async function refresh() {
    const res = await api.portfolio.list();
    setPositions(res.positions);
    setLoading(false);
  }

  async function refreshHistory() {
    const [{ history }, { trades }] = await Promise.all([api.portfolio.equityHistory(), api.portfolio.trades()]);
    setEquityHistory(history);
    setTrades(trades.slice().reverse());
  }

  useEffect(() => {
    refresh();
    refreshHistory();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const bistSymbols = [...new Set(positions.map((p) => p.symbol))].filter((s) => s.startsWith('BIST:'));
    if (bistSymbols.length === 0) {
      setCorporateActions([]);
      return;
    }
    api.corporateActions
      .forHoldings(bistSymbols)
      .then((res) => setCorporateActions(res.bySymbol))
      .catch(() => setCorporateActions([]));
  }, [positions]);

  async function sellPosition(sym: string, qty: number) {
    const position = positions.find((p) => p.symbol === sym);
    const price = position?.currentPrice ?? position?.avgCost ?? 0;
    await api.portfolio.sell(sym, qty, price);
    await refresh();
    await refreshHistory();
  }

  const allocation = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const p of positions) {
      const def = SYMBOL_CATALOG.find((s) => s.symbol === p.symbol);
      const cat = def?.category ?? 'other';
      const value = (p.marketValue ?? p.costBasis) || 0;
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + value);
    }
    const total = [...byCategory.values()].reduce((a, b) => a + b, 0);
    return [...byCategory.entries()]
      .map(([category, value]) => ({ category, value, percent: total > 0 ? (value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

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

      {corporateActions.length > 0 && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
            <Landmark size={13} /> Kurumsal aksiyon bildirimi
          </div>
          {corporateActions.map(({ symbol, items }) => (
            <div key={symbol} className="text-[11px] text-amber-100/80">
              <span className="font-mono">{symbol}</span>: {items[0].title}
              {items.length > 1 ? ` (+${items.length - 1} bildirim daha)` : ''} — maliyet tabanınızı KAP kaydına göre
              gözden geçirin.{' '}
              <a href={items[0].url} target="_blank" rel="noopener noreferrer" className="underline">
                Bildirimi gör
              </a>
            </div>
          ))}
        </div>
      )}

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
          <PositionRow key={p.id} position={p} onRemove={removePosition} onSell={sellPosition} />
        ))}
      </div>

      {equityHistory.length > 1 && (
        <div className="mx-4 mt-4 panel-elevated p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            <History size={13} /> Performans
          </div>
          <EquitySparkline history={equityHistory} />
        </div>
      )}

      {allocation.length > 0 && (
        <div className="mx-4 mt-4 panel-elevated p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            <PieChart size={13} /> Dağılım
          </div>
          <div className="flex flex-col gap-1.5">
            {allocation.map((a) => (
              <div key={a.category} className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 w-24 shrink-0 truncate">
                  {CATEGORY_LABELS_TR[a.category] ?? a.category}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full gradient-accent" style={{ width: `${a.percent}%` }} />
                </div>
                <span className="text-[10px] font-mono text-slate-500 w-10 text-right">{a.percent.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {trades.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            İşlem Günlüğü
          </div>
          <div className="flex flex-col gap-1.5">
            {trades.slice(0, 20).map((t) => {
              const def = SYMBOL_CATALOG.find((s) => s.symbol === t.symbol);
              return (
                <div key={t.id} className="panel-elevated p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium">{def?.displayNameTr ?? t.symbol}</div>
                    <div className="text-[10px] text-slate-500">
                      {t.quantity} adet satıldı · {new Date(t.closedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <div className={`text-xs font-mono ${t.realizedPnl >= 0 ? 'price-up' : 'price-down'}`}>
                    {t.realizedPnl >= 0 ? '+' : ''}
                    {t.realizedPnl.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
