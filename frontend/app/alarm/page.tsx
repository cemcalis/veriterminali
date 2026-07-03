'use client';

import { useEffect, useState } from 'react';
import { Trash2, Bell, Plus, ArrowUp, ArrowDown, BellOff } from 'lucide-react';
import { api } from '@/lib/api';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import { haptic } from '@/lib/telegram';
import type { Alert } from '@/lib/types';

export default function AlarmPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [symbolInput, setSymbolInput] = useState(`${SYMBOL_CATALOG[0].displayNameTr} (${SYMBOL_CATALOG[0].symbol})`);
  const [symbol, setSymbol] = useState(SYMBOL_CATALOG[0].symbol);
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await api.alerts.list();
    setAlerts(res.alerts);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, []);

  async function addAlert(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(targetPrice);
    if (!price) return;
    haptic('success');
    await api.alerts.add(symbol, direction, price);
    setTargetPrice('');
    await refresh();
  }

  async function removeAlert(id: string) {
    haptic('warning');
    await api.alerts.remove(id);
    await refresh();
  }

  return (
    <div className="pb-4">
      <header className="px-4 pt-4 flex items-center gap-2">
        <Bell size={18} className="text-emerald-400" />
        <div>
          <h1 className="text-lg font-bold">Alarm</h1>
          <p className="text-xs text-slate-500">
            Alarmlar arka planda 15 saniyede bir kontrol edilir. Telegram bildirimi için Ayarlar&apos;dan bot token
            tanımlayın.
          </p>
        </div>
      </header>

      <form onSubmit={addAlert} className="mx-4 mt-3 panel-elevated p-3 flex flex-col gap-2">
        <div className="text-xs text-slate-400 font-medium">Yeni Alarm</div>
        <input
          list="symbol-options-alarm"
          value={symbolInput}
          onChange={(e) => {
            setSymbolInput(e.target.value);
            const match = SYMBOL_CATALOG.find((s) => `${s.displayNameTr} (${s.symbol})` === e.target.value);
            if (match) setSymbol(match.symbol);
          }}
          placeholder="Sembol ara..."
          className="panel px-2 py-2 text-sm outline-none"
        />
        <datalist id="symbol-options-alarm">
          {SYMBOL_CATALOG.map((s) => (
            <option key={s.symbol} value={`${s.displayNameTr} (${s.symbol})`} />
          ))}
        </datalist>
        <div className="flex gap-2">
          <div className="flex panel overflow-hidden">
            <button
              type="button"
              onClick={() => {
                haptic('select');
                setDirection('above');
              }}
              className={`flex items-center gap-1 px-2 py-2 text-xs transition-colors ${direction === 'above' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
            >
              <ArrowUp size={13} /> Üzeri
            </button>
            <button
              type="button"
              onClick={() => {
                haptic('select');
                setDirection('below');
              }}
              className={`flex items-center gap-1 px-2 py-2 text-xs transition-colors ${direction === 'below' ? 'bg-red-500/20 text-red-300' : 'text-slate-400'}`}
            >
              <ArrowDown size={13} /> Altı
            </button>
          </div>
          <input
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            type="number"
            step="any"
            placeholder="Hedef fiyat"
            className="panel px-2 py-2 text-sm flex-1 outline-none"
          />
        </div>
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 gradient-accent text-black font-medium rounded-xl py-2.5 text-sm active:scale-[0.98] transition-transform"
        >
          <Plus size={15} /> Alarm Oluştur
        </button>
      </form>

      <div className="mx-4 mt-3 flex flex-col gap-2">
        {loading && Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-2xl" />)}
        {!loading && alerts.length === 0 && (
          <div className="panel-elevated flex flex-col items-center gap-2 py-8 text-slate-500">
            <BellOff size={26} strokeWidth={1.5} />
            <span className="text-sm">Henüz alarm oluşturulmadı</span>
          </div>
        )}
        {alerts.map((a) => {
          const def = SYMBOL_CATALOG.find((s) => s.symbol === a.symbol);
          return (
            <div key={a.id} className="panel-elevated p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{def?.displayNameTr ?? a.symbol}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  {a.direction === 'above' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                  {a.direction === 'above' ? 'Üzeri' : 'Altı'}: {a.targetPrice}
                </div>
              </div>
              <div className="text-right">
                {a.triggeredAt ? (
                  <span className="text-xs text-amber-400">Tetiklendi</span>
                ) : (
                  <span className="text-xs text-slate-500">Aktif</span>
                )}
                <button
                  onClick={() => removeAlert(a.id)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 mt-1 ml-auto"
                >
                  <Trash2 size={11} /> Sil
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
