'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SYMBOL_CATALOG } from '@/lib/symbols';
import type { Alert } from '@/lib/types';

export default function AlarmPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
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
    await api.alerts.add(symbol, direction, price);
    setTargetPrice('');
    await refresh();
  }

  async function removeAlert(id: string) {
    await api.alerts.remove(id);
    await refresh();
  }

  return (
    <div className="pb-4">
      <header className="px-3 pt-4">
        <h1 className="text-lg font-bold">Alarm</h1>
        <p className="text-xs text-slate-500">
          Alarmlar arka planda 15 saniyede bir kontrol edilir. Telegram bildirimi için Ayarlar&apos;dan bot token
          tanımlayın.
        </p>
      </header>

      <form onSubmit={addAlert} className="mx-3 mt-3 panel p-3 flex flex-col gap-2">
        <div className="text-xs text-slate-400 font-medium">Yeni Alarm</div>
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="panel px-2 py-2 text-sm">
          {SYMBOL_CATALOG.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.displayNameTr} ({s.symbol})
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
            className="panel px-2 py-2 text-sm"
          >
            <option value="above">Üzerine çıkınca</option>
            <option value="below">Altına inince</option>
          </select>
          <input
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            type="number"
            step="any"
            placeholder="Hedef fiyat"
            className="panel px-2 py-2 text-sm flex-1 outline-none"
          />
        </div>
        <button type="submit" className="bg-emerald-500/20 text-emerald-300 rounded-lg py-2 text-sm">
          Alarm Oluştur
        </button>
      </form>

      <div className="mx-3 mt-3 flex flex-col gap-2">
        {loading && <div className="text-center text-sm text-slate-500 py-4">Yükleniyor…</div>}
        {!loading && alerts.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-4">Henüz alarm oluşturulmadı</div>
        )}
        {alerts.map((a) => {
          const def = SYMBOL_CATALOG.find((s) => s.symbol === a.symbol);
          return (
            <div key={a.id} className="panel p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{def?.displayNameTr ?? a.symbol}</div>
                <div className="text-[11px] text-slate-500">
                  {a.direction === 'above' ? 'Üzeri' : 'Altı'}: {a.targetPrice}
                </div>
              </div>
              <div className="text-right">
                {a.triggeredAt ? (
                  <span className="text-xs text-amber-400">Tetiklendi</span>
                ) : (
                  <span className="text-xs text-slate-500">Aktif</span>
                )}
                <button onClick={() => removeAlert(a.id)} className="text-[10px] text-slate-500 underline mt-1 block">
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
